"""GitHub API service - searches all folders for package.json files."""
import httpx
import base64
import json
from typing import Optional


class GitHubService:
    BASE_URL = "https://api.github.com"
    RAW_URL  = "https://raw.githubusercontent.com"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def find_package_jsons(self, owner: str, repo: str) -> list[dict]:
        """
        Recursively search the whole repo for every package.json.
        Returns a list of dicts:
          { path, name, version, dependencies, devDependencies, description }
        """
        branch = await self._default_branch(owner, repo)
        tree   = await self._full_tree(owner, repo, branch)
        if not tree:
            return []

        # Collect every package.json path (exclude node_modules)
        paths = [
            item["path"] for item in tree
            if item["path"].endswith("package.json")
            and "node_modules" not in item["path"]
        ]

        results = []
        for path in paths:
            data = await self._fetch_raw(owner, repo, branch, path)
            if data:
                results.append({
                    "path": path,
                    "name": data.get("name", "unknown"),
                    "version": data.get("version", ""),
                    "description": data.get("description", ""),
                    "dependencies": data.get("dependencies", {}),
                    "devDependencies": data.get("devDependencies", {}),
                    "_raw": data,
                })

        return results

    async def fetch_package_json(self, owner: str, repo: str, branch: str = "main") -> Optional[dict]:
        """Legacy single-file fetch (kept for backward compat)."""
        for b in [branch, "master", "develop"]:
            data = await self._fetch_raw(owner, repo, b, "package.json")
            if data:
                return data
        # Fall back to deep search
        results = await self.find_package_jsons(owner, repo)
        return results[0]["_raw"] if results else None

    async def close(self):
        await self.client.aclose()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _default_branch(self, owner: str, repo: str) -> str:
        try:
            r = await self.client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}",
                headers={"Accept": "application/vnd.github+json"},
            )
            return r.json().get("default_branch", "main")
        except Exception:
            return "main"

    async def _full_tree(self, owner: str, repo: str, branch: str) -> list:
        """Get the full recursive file tree via Git Trees API."""
        try:
            r = await self.client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/git/trees/{branch}",
                params={"recursive": "1"},
                headers={"Accept": "application/vnd.github+json"},
            )
            if r.status_code != 200:
                return []
            return r.json().get("tree", [])
        except Exception:
            return []

    async def _fetch_raw(self, owner: str, repo: str, branch: str, path: str) -> Optional[dict]:
        url = f"{self.RAW_URL}/{owner}/{repo}/{branch}/{path}"
        try:
            r = await self.client.get(url)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        return None


github_service = GitHubService()