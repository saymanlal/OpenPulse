"""
GitHub service — fetches ALL ecosystem manifest files from a repo.

Supported ecosystems:
  npm/yarn  → package.json
  Python    → requirements.txt, pyproject.toml, setup.py, Pipfile
  Go        → go.mod
  Rust      → Cargo.toml
"""
from __future__ import annotations

import json
import re
from typing import Any, Optional
import os

import httpx

# Every manifest file we care about (order matters for display)
MANIFEST_FILES = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "setup.py",
    "Pipfile",
    "go.mod",
    "Cargo.toml",
]

ECOSYSTEM_MAP: dict[str, str] = {
    "package.json":   "npm",
    "requirements.txt": "python",
    "pyproject.toml": "python",
    "setup.py":       "python",
    "Pipfile":        "python",
    "go.mod":         "go",
    "Cargo.toml":     "rust",
}


class GitHubService:
    BASE_URL = "https://api.github.com"
    RAW_URL  = "https://raw.githubusercontent.com"

    def __init__(self) -> None:
        # Add GitHub token if available for higher rate limits
        headers = {"Accept": "application/vnd.github+json"}
        github_token = os.getenv("GITHUB_TOKEN", "").strip()
        if github_token:
            headers["Authorization"] = f"Bearer {github_token}"
        
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers=headers,
            follow_redirects=True
        )

    # ------------------------------------------------------------------ #
    #  Public API                                                          #
    # ------------------------------------------------------------------ #

    async def scan_repo(self, owner: str, repo: str) -> dict[str, Any]:
        """
        Scan the entire repo and return every manifest found.

        Returns:
        {
          "branch": "main",
          "manifests": [
            {
              "path": "package.json",
              "ecosystem": "npm",
              "raw": "...",          # raw text
              "parsed": { ... }      # parsed dict (None on failure)
            },
            ...
          ]
        }
        """
        print(f"🔍 Scanning {owner}/{repo}...")
        
        # Get default branch
        branch = await self._default_branch(owner, repo)
        print(f"📌 Using branch: {branch}")
        
        # Get full repository tree
        tree = await self._full_tree(owner, repo, branch)
        
        if not tree:
            print(f"⚠️ Could not fetch repository tree")
            # Fallback: try to fetch common manifest files directly
            return await self._fallback_scan(owner, repo, branch)

        # Filter tree to only manifest files (skip node_modules / vendor)
        skip_dirs = {"node_modules", "vendor", ".git", "dist", "build", "venv", ".venv", "target", "__pycache__"}
        found_paths: list[str] = []
        
        for item in tree:
            path: str = item.get("path", "")
            parts = path.split("/")
            filename = parts[-1]
            
            # skip hidden/vendor dirs
            if any(p in skip_dirs or p.startswith(".") for p in parts[:-1]):
                continue
            
            if filename in MANIFEST_FILES:
                found_paths.append(path)
                print(f"  ✓ Found: {path}")

        if not found_paths:
            print(f"⚠️ No manifest files found in tree, trying fallback...")
            return await self._fallback_scan(owner, repo, branch)

        # Fetch and parse each manifest
        manifests: list[dict] = []
        for path in found_paths:
            raw = await self._fetch_raw_text(owner, repo, branch, path)
            if raw is None:
                print(f"  ✗ Could not fetch: {path}")
                continue
            
            ecosystem = ECOSYSTEM_MAP.get(path.split("/")[-1], "unknown")
            parsed = _parse_raw(path.split("/")[-1], raw)
            
            if parsed and (parsed.get("dependencies") or parsed.get("devDependencies")):
                manifests.append({
                    "path":      path,
                    "ecosystem": ecosystem,
                    "raw":       raw,
                    "parsed":    parsed,
                })
                print(f"  ✓ Parsed: {path} ({len(parsed.get('dependencies', {}))} deps)")
            else:
                print(f"  ⚠️ Skipped {path} (no dependencies found)")

        print(f"✅ Total manifests loaded: {len(manifests)}")
        return {"branch": branch, "manifests": manifests}

    async def _fallback_scan(self, owner: str, repo: str, branch: str) -> dict[str, Any]:
        """
        Fallback: try to fetch common manifest files directly from root.
        Used when tree API fails or returns nothing.
        """
        print("🔄 Fallback: checking common manifest locations...")
        
        common_paths = [
            "package.json",
            "requirements.txt",
            "pyproject.toml",
            "go.mod",
            "Cargo.toml",
            "frontend/package.json",
            "backend/package.json",
            "api/package.json",
        ]
        
        manifests: list[dict] = []
        
        for path in common_paths:
            raw = await self._fetch_raw_text(owner, repo, branch, path)
            if raw:
                filename = path.split("/")[-1]
                ecosystem = ECOSYSTEM_MAP.get(filename, "unknown")
                parsed = _parse_raw(filename, raw)
                
                if parsed and (parsed.get("dependencies") or parsed.get("devDependencies")):
                    manifests.append({
                        "path":      path,
                        "ecosystem": ecosystem,
                        "raw":       raw,
                        "parsed":    parsed,
                    })
                    print(f"  ✓ Found via fallback: {path}")
        
        return {"branch": branch, "manifests": manifests}

    async def fetch_package_json(
        self, owner: str, repo: str, branch: str = "main"
    ) -> Optional[dict]:
        """Legacy helper kept for backward compat."""
        for b in [branch, "master", "develop"]:
            raw = await self._fetch_raw_text(owner, repo, b, "package.json")
            if raw:
                try:
                    return json.loads(raw)
                except Exception:
                    pass
        return None

    async def close(self) -> None:
        await self.client.aclose()

    # ------------------------------------------------------------------ #
    #  Internals                                                           #
    # ------------------------------------------------------------------ #

    async def _default_branch(self, owner: str, repo: str) -> str:
        try:
            r = await self.client.get(f"{self.BASE_URL}/repos/{owner}/{repo}")
            r.raise_for_status()
            branch = r.json().get("default_branch", "main")
            return branch
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise Exception(f"Repository {owner}/{repo} not found or is private")
            elif e.response.status_code == 403:
                raise Exception("GitHub API rate limit exceeded. Please add GITHUB_TOKEN environment variable.")
            raise Exception(f"GitHub API error: {e}")
        except Exception as e:
            print(f"⚠️ Could not determine default branch: {e}, using 'main'")
            return "main"

    async def _full_tree(self, owner: str, repo: str, branch: str) -> list[dict]:
        try:
            r = await self.client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/git/trees/{branch}",
                params={"recursive": "1"},
            )
            
            if r.status_code == 404:
                # Try alternative branches
                for alt_branch in ["master", "develop", "dev"]:
                    r = await self.client.get(
                        f"{self.BASE_URL}/repos/{owner}/{repo}/git/trees/{alt_branch}",
                        params={"recursive": "1"},
                    )
                    if r.status_code == 200:
                        print(f"  ℹ️ Using branch '{alt_branch}' instead")
                        return r.json().get("tree", [])
            
            if r.status_code == 403:
                print("⚠️ GitHub API rate limit exceeded")
                return []
            
            r.raise_for_status()
            tree = r.json().get("tree", [])
            print(f"  📂 Found {len(tree)} items in tree")
            return tree
            
        except Exception as e:
            print(f"⚠️ Tree fetch failed: {e}")
            return []

    async def _fetch_raw_text(
        self, owner: str, repo: str, branch: str, path: str
    ) -> Optional[str]:
        url = f"{self.RAW_URL}/{owner}/{repo}/{branch}/{path}"
        try:
            r = await self.client.get(url)
            if r.status_code == 200:
                return r.text
            elif r.status_code == 404:
                # Try alternative branches for this specific file
                for alt_branch in ["master", "develop", "dev"]:
                    if alt_branch == branch:
                        continue
                    alt_url = f"{self.RAW_URL}/{owner}/{repo}/{alt_branch}/{path}"
                    r = await self.client.get(alt_url)
                    if r.status_code == 200:
                        return r.text
        except Exception as e:
            print(f"  ✗ Fetch error for {path}: {e}")
        return None


# ------------------------------------------------------------------ #
#  Per-ecosystem raw-text parsers                                      #
# ------------------------------------------------------------------ #

def _parse_raw(filename: str, raw: str) -> Optional[dict]:
    try:
        if filename == "package.json":
            return json.loads(raw)
        if filename == "requirements.txt":
            return _parse_requirements_txt(raw)
        if filename == "pyproject.toml":
            return _parse_pyproject_toml(raw)
        if filename == "setup.py":
            return _parse_setup_py(raw)
        if filename == "Pipfile":
            return _parse_pipfile(raw)
        if filename == "go.mod":
            return _parse_go_mod(raw)
        if filename == "Cargo.toml":
            return _parse_cargo_toml(raw)
    except Exception as e:
        print(f"  ⚠️ Parse error for {filename}: {e}")
    return None


def _parse_requirements_txt(raw: str) -> dict:
    deps: dict[str, str] = {}
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Strip extras like [security], env markers
        line = re.split(r";|\s+#", line)[0].strip()
        m = re.match(r"^([A-Za-z0-9_.\-]+)\s*([><=!~^]+.*)?$", line)
        if m:
            name = m.group(1)
            ver  = (m.group(2) or "").strip() or "*"
            deps[name] = ver
    return {"name": "python-project", "dependencies": deps, "devDependencies": {}}


def _parse_pyproject_toml(raw: str) -> dict:
    """
    Minimal TOML parser — no external dep needed.
    Handles [tool.poetry.dependencies] and [project] sections.
    """
    deps: dict[str, str] = {}
    dev_deps: dict[str, str] = {}
    name = "python-project"

    in_deps     = False
    in_dev_deps = False
    in_project  = False

    for line in raw.splitlines():
        stripped = line.strip()

        # Section headers
        if stripped.startswith("["):
            in_deps     = stripped in ("[tool.poetry.dependencies]", "[project]")
            in_dev_deps = stripped in (
                "[tool.poetry.dev-dependencies]",
                "[tool.poetry.group.dev.dependencies]",
            )
            in_project = stripped == "[project]"
            continue

        if stripped.startswith("name") and "=" in stripped:
            val = stripped.split("=", 1)[1].strip().strip('"').strip("'")
            if val:
                name = val
            continue

        if (in_deps or in_dev_deps) and "=" in stripped and not stripped.startswith("#"):
            k, _, v = stripped.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k != "python":
                if in_dev_deps:
                    dev_deps[k] = v
                else:
                    deps[k] = v

    return {"name": name, "dependencies": deps, "devDependencies": dev_deps}


def _parse_setup_py(raw: str) -> dict:
    deps: dict[str, str] = {}
    # Extract install_requires list
    m = re.search(r"install_requires\s*=\s*\[(.*?)\]", raw, re.DOTALL)
    if m:
        for item in re.findall(r'["\']([^"\']+)["\']', m.group(1)):
            name = re.split(r"[><=!~^;\s]", item)[0].strip()
            if name:
                deps[name] = "*"
    return {"name": "python-project", "dependencies": deps, "devDependencies": {}}


def _parse_pipfile(raw: str) -> dict:
    deps: dict[str, str] = {}
    dev_deps: dict[str, str] = {}
    in_packages     = False
    in_dev_packages = False

    for line in raw.splitlines():
        stripped = line.strip()
        if stripped == "[packages]":
            in_packages = True; in_dev_packages = False; continue
        if stripped == "[dev-packages]":
            in_dev_packages = True; in_packages = False; continue
        if stripped.startswith("["):
            in_packages = in_dev_packages = False; continue
        if "=" in stripped and not stripped.startswith("#"):
            k, _, v = stripped.partition("=")
            k = k.strip(); v = v.strip().strip('"').strip("'")
            if in_packages:
                deps[k] = v
            elif in_dev_packages:
                dev_deps[k] = v

    return {"name": "python-project", "dependencies": deps, "devDependencies": dev_deps}


def _parse_go_mod(raw: str) -> dict:
    deps: dict[str, str] = {}
    module_name = "go-project"
    in_require = False

    for line in raw.splitlines():
        stripped = line.strip()
        if stripped.startswith("module "):
            module_name = stripped[7:].strip()
        if stripped == "require (":
            in_require = True; continue
        if in_require and stripped == ")":
            in_require = False; continue
        if in_require or stripped.startswith("require "):
            parts = stripped.replace("require ", "").split()
            if len(parts) >= 2:
                deps[parts[0]] = parts[1]

    return {"name": module_name, "dependencies": deps, "devDependencies": {}}


def _parse_cargo_toml(raw: str) -> dict:
    deps: dict[str, str] = {}
    dev_deps: dict[str, str] = {}
    name = "rust-project"
    in_deps = False
    in_dev  = False

    for line in raw.splitlines():
        stripped = line.strip()
        if stripped.startswith("name") and "=" in stripped and not in_deps and not in_dev:
            name = stripped.split("=", 1)[1].strip().strip('"').strip("'")
            continue
        if stripped == "[dependencies]":
            in_deps = True; in_dev = False; continue
        if stripped == "[dev-dependencies]":
            in_dev = True; in_deps = False; continue
        if stripped.startswith("["):
            in_deps = in_dev = False; continue
        if "=" in stripped and not stripped.startswith("#"):
            k, _, v = stripped.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if in_deps:
                deps[k] = v
            elif in_dev:
                dev_deps[k] = v

    return {"name": name, "dependencies": deps, "devDependencies": dev_deps}


github_service = GitHubService()