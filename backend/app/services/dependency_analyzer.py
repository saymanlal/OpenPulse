"""
Universal dependency analyzer.

Builds a graph from any manifest — npm, Python, Go, Rust.
Each ecosystem gets its own node sub-type and color hint so
the frontend can filter by ecosystem.
"""
from __future__ import annotations

import math
from typing import Any

# ------------------------------------------------------------------ #
#  Risk databases (npm)                                               #
# ------------------------------------------------------------------ #

NPM_HIGH_RISK = {
    "event-stream", "ua-parser-js", "node-ipc", "colors", "faker",
    "log4js", "lodash", "moment", "request", "node-fetch",
    "axios", "minimist", "ansi-regex", "path-parse", "glob-parent",
    "semver", "json5", "qs", "express", "debug", "ms",
    "underscore", "jquery", "serialize-javascript", "acorn",
    "webpack", "babel-loader", "terser", "postcss",
}
NPM_MEDIUM_RISK = {
    "react", "react-dom", "next", "vue", "angular", "svelte",
    "typescript", "eslint", "prettier", "jest", "vitest",
    "vite", "rollup", "esbuild", "parcel",
    "mongoose", "sequelize", "typeorm", "prisma",
    "socket.io", "ws", "cors", "helmet",
}
NPM_LOW_RISK = {
    "clsx", "classnames", "zod", "date-fns", "uuid",
    "immer", "zustand", "jotai", "tailwindcss",
    "lucide-react", "radix-ui", "framer-motion",
}

# Python packages with known supply-chain or CVE history
PYTHON_HIGH_RISK = {
    "requests", "urllib3", "pillow", "cryptography", "paramiko",
    "pyyaml", "lxml", "sqlalchemy", "django", "flask",
    "celery", "redis", "boto3", "numpy", "pandas",
}
PYTHON_MEDIUM_RISK = {
    "fastapi", "starlette", "pydantic", "httpx", "aiohttp",
    "alembic", "pymongo", "psycopg2", "mysql-connector-python",
    "pytest", "black", "mypy", "ruff",
}

# Go modules with known issues
GO_HIGH_RISK = {
    "github.com/dgrijalva/jwt-go",   # archived, CVEs
    "gopkg.in/yaml.v2",
    "github.com/gogo/protobuf",
}

# Rust crates — generally safer but a few had issues
RUST_HIGH_RISK = {
    "openssl", "ring", "rustls",
}

# ------------------------------------------------------------------ #
#  Node type inference                                                 #
# ------------------------------------------------------------------ #

def _infer_npm_type(name: str) -> str:
    n = name.lower().replace("@", "").split("/")[-1]
    if any(x in n for x in ("express", "fastify", "koa", "hapi", "nest", "django", "flask", "fastapi")):
        return "service"
    if any(x in n for x in ("mongo", "postgres", "mysql", "sqlite", "redis", "prisma", "drizzle", "typeorm", "sequelize")):
        return "database"
    if any(x in n for x in ("axios", "fetch", "got", "superagent", "grpc", "http-client", "request")):
        return "api"
    if any(x in n for x in ("webpack", "vite", "rollup", "esbuild", "parcel", "babel", "swc", "turbo")):
        return "server"
    return "library"


def _infer_python_type(name: str) -> str:
    n = name.lower()
    if any(x in n for x in ("django", "flask", "fastapi", "tornado", "starlette", "sanic")):
        return "service"
    if any(x in n for x in ("sqlalchemy", "pymongo", "psycopg", "mysql", "redis", "elasticsearch", "cassandra")):
        return "database"
    if any(x in n for x in ("requests", "httpx", "aiohttp", "urllib", "boto", "grpc")):
        return "api"
    if any(x in n for x in ("celery", "dramatiq", "rq", "worker", "gunicorn", "uvicorn", "nginx")):
        return "server"
    return "library"


def _infer_go_type(name: str) -> str:
    n = name.lower()
    if any(x in n for x in ("gin", "echo", "fiber", "chi", "mux", "http", "grpc", "server")):
        return "service"
    if any(x in n for x in ("mongo", "postgres", "mysql", "sqlite", "redis", "gorm", "xorm")):
        return "database"
    if any(x in n for x in ("client", "http", "rest", "graphql", "rpc", "api")):
        return "api"
    return "library"


def _infer_rust_type(name: str) -> str:
    n = name.lower()
    if any(x in n for x in ("actix", "axum", "rocket", "warp", "hyper", "tower", "server")):
        return "service"
    if any(x in n for x in ("diesel", "sqlx", "sea-orm", "mongodb", "redis", "postgres")):
        return "database"
    if any(x in n for x in ("reqwest", "hyper", "surf", "isahc", "ureq", "client")):
        return "api"
    return "library"


# ------------------------------------------------------------------ #
#  Risk scoring                                                        #
# ------------------------------------------------------------------ #

def _version_risk(ver: str) -> float:
    if not ver or ver in ("*", "latest", ""):
        return 0.35
    risk = 0.0
    if ver.startswith(("^", "~", ">=", ">")):
        risk += 0.08
    v = ver.lstrip("^~>=<v").split(".")[0]
    try:
        major = int(v)
        if major == 0:
            risk += 0.2
        elif major == 1:
            risk += 0.05
    except ValueError:
        pass
    return min(risk, 0.35)


def _risk_npm(name: str, ver: str, is_dev: bool, total: int) -> float:
    n = name.lower().replace("@", "").split("/")[-1]
    if n in NPM_HIGH_RISK:      base = 0.60
    elif n in NPM_MEDIUM_RISK:  base = 0.38
    elif n in NPM_LOW_RISK:     base = 0.10
    else:                       base = 0.28
    score = base + _version_risk(ver) + (-0.15 if is_dev else 0) + min(total / 200, 0.10)
    return round(max(0.02, min(0.97, score)), 2)


def _risk_python(name: str, ver: str, is_dev: bool, total: int) -> float:
    n = name.lower()
    if n in PYTHON_HIGH_RISK:    base = 0.55
    elif n in PYTHON_MEDIUM_RISK: base = 0.35
    else:                         base = 0.25
    score = base + _version_risk(ver) + (-0.12 if is_dev else 0) + min(total / 200, 0.10)
    return round(max(0.02, min(0.97, score)), 2)


def _risk_go(name: str, ver: str, total: int) -> float:
    n = name.lower()
    base = 0.45 if n in GO_HIGH_RISK else 0.22
    score = base + _version_risk(ver) + min(total / 200, 0.08)
    return round(max(0.02, min(0.97, score)), 2)


def _risk_rust(name: str, ver: str, total: int) -> float:
    n = name.lower()
    base = 0.40 if n in RUST_HIGH_RISK else 0.18
    score = base + _version_risk(ver) + min(total / 200, 0.08)
    return round(max(0.02, min(0.97, score)), 2)


# ------------------------------------------------------------------ #
#  Position helpers                                                    #
# ------------------------------------------------------------------ #

def _spread_position(index: int, total: int, radius: float = 40.0) -> list[float]:
    """Fibonacci sphere distribution so nodes never clump."""
    if total <= 1:
        return [0.0, 0.0, 0.0]
    golden = math.pi * (3.0 - math.sqrt(5.0))
    y   = 1.0 - (index / (total - 1)) * 2.0
    rad = math.sqrt(max(0.0, 1.0 - y * y))
    phi = golden * index
    r   = radius + (total / 12.0)
    return [
        round(math.cos(phi) * rad * r, 2),
        round(y * r * 0.55, 2),
        round(math.sin(phi) * rad * r, 2),
    ]


# ------------------------------------------------------------------ #
#  Main analyzer                                                       #
# ------------------------------------------------------------------ #

class DependencyAnalyzer:

    @staticmethod
    def analyze_manifest(manifest: dict) -> dict[str, Any]:
        """
        Dispatch to the correct parser based on ecosystem.

        manifest = {
          "path": "...",
          "ecosystem": "npm" | "python" | "go" | "rust",
          "parsed": { "name": ..., "dependencies": {}, "devDependencies": {} }
        }
        """
        ecosystem = manifest.get("ecosystem", "npm")
        parsed    = manifest.get("parsed") or {}
        path      = manifest.get("path", "")

        if ecosystem == "npm":
            return DependencyAnalyzer._build_graph(
                parsed, ecosystem="npm",
                type_fn=_infer_npm_type,
                risk_fn=lambda name, ver, is_dev, total: _risk_npm(name, ver, is_dev, total),
                path=path,
            )
        if ecosystem == "python":
            return DependencyAnalyzer._build_graph(
                parsed, ecosystem="python",
                type_fn=_infer_python_type,
                risk_fn=lambda name, ver, is_dev, total: _risk_python(name, ver, is_dev, total),
                path=path,
            )
        if ecosystem == "go":
            return DependencyAnalyzer._build_graph(
                parsed, ecosystem="go",
                type_fn=_infer_go_type,
                risk_fn=lambda name, ver, _is_dev, total: _risk_go(name, ver, total),
                path=path,
            )
        if ecosystem == "rust":
            return DependencyAnalyzer._build_graph(
                parsed, ecosystem="rust",
                type_fn=_infer_rust_type,
                risk_fn=lambda name, ver, _is_dev, total: _risk_rust(name, ver, total),
                path=path,
            )
        # Fallback
        return DependencyAnalyzer._build_graph(parsed, ecosystem="unknown",
            type_fn=lambda _n: "library",
            risk_fn=lambda _n, _v, _d, _t: 0.3,
            path=path,
        )

    @staticmethod
    def _build_graph(
        parsed: dict,
        *,
        ecosystem: str,
        type_fn,
        risk_fn,
        path: str = "",
    ) -> dict[str, Any]:
        nodes: list[dict] = []
        edges: list[dict] = []

        project_name = parsed.get("name") or "unknown-project"
        project_ver  = parsed.get("version", "")
        deps         = parsed.get("dependencies", {}) or {}
        dev_deps     = parsed.get("devDependencies", {}) or {}
        all_deps     = {**deps, **dev_deps}
        total        = len(all_deps)

        # Root node — include manifest path slug in ID so two package.json
        # files (e.g. frontend/package.json vs backend/package.json) never collide.
        path_slug = path.replace("/", "_").replace(".", "_") if path else "root"
        root_id   = f"{ecosystem}:{project_name}:{path_slug}"

        nodes.append({
            "id":        root_id,
            "label":     project_name,
            "type":      "repository",
            "position":  [0.0, 0.0, 0.0],
            "riskScore": 0.0,
            "size":      1.5,
            "metadata": {
                "name":         project_name,
                "version":      project_ver,
                "ecosystem":    ecosystem,
                "manifestPath": path,
                "isRoot":       True,
                # Human-readable subtitle shown in Inspector header
                "subtitle":     path or project_name,
            },
        })

        for index, (dep_name, dep_version) in enumerate(all_deps.items()):
            is_dev = dep_name in dev_deps
            ver    = str(dep_version) if dep_version else "*"
            risk   = risk_fn(dep_name, ver, is_dev, total)
            pos    = _spread_position(index, total)
            dtype  = type_fn(dep_name)

            # Dep ID is ecosystem-scoped only (NOT path-scoped) so that the
            # same package shared across multiple manifests of the SAME ecosystem
            # (e.g. fastapi in both requirements.txt and pyproject.toml) shares
            # one node in the graph instead of creating a duplicate.
            dep_id = f"{ecosystem}:{dep_name}"

            nodes.append({
                "id":        dep_id,
                "label":     dep_name,
                "type":      dtype,
                "position":  pos,
                "riskScore": risk,
                "size":      1.3 if risk > 0.7 else 1.0 if risk > 0.4 else 0.8,
                "metadata": {
                    "name":      dep_name,
                    "version":   ver,
                    "isDev":     is_dev,
                    "ecosystem": ecosystem,
                    "license":   "unknown",
                    # Track every manifest this dep appears in (populated by
                    # the merge step in analyze.py, seeded here for first occurrence)
                    "manifestPaths": [path] if path else [],
                },
            })

            # Edge ID is path-scoped so two manifests can both point to the
            # same dep node without their edges colliding.
            edges.append({
                "id":     f"edge-{ecosystem}-{path_slug}-{dep_name}",
                "source": root_id,
                "target": dep_id,
                "weight": 0.5 if is_dev else 1.0,
                "metadata": {
                    "ecosystem": ecosystem,
                    "isDev":     is_dev,
                },
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "projectName":        project_name,
                "ecosystem":          ecosystem,
                "manifestPath":       path,
                "totalDependencies":  total,
                "directDependencies": len(deps),
                "devDependencies":    len(dev_deps),
            },
        }

    # ---------------------------------------------------------------- #
    #  Legacy: kept so old callers don't break                          #
    # ---------------------------------------------------------------- #

    @staticmethod
    def parse_package_json(package_data: dict) -> dict[str, Any]:
        return DependencyAnalyzer._build_graph(
            package_data,
            ecosystem="npm",
            type_fn=_infer_npm_type,
            risk_fn=lambda name, ver, is_dev, total: _risk_npm(name, ver, is_dev, total),
        )