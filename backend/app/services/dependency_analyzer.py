"""Dependency analysis - builds graph with real risk scoring."""
import math
import random
from typing import Any


# Packages known to have had serious CVEs / supply-chain issues
HIGH_RISK_PACKAGES = {
    "event-stream", "ua-parser-js", "node-ipc", "colors", "faker",
    "log4js", "lodash", "moment", "request", "node-fetch",
    "axios", "minimist", "ansi-regex", "path-parse", "glob-parent",
    "semver", "json5", "qs", "express", "debug", "ms",
    "underscore", "jquery", "serialize-javascript", "acorn",
    "webpack", "babel-loader", "terser", "postcss",
}

MEDIUM_RISK_PACKAGES = {
    "react", "react-dom", "next", "vue", "angular", "svelte",
    "typescript", "eslint", "prettier", "jest", "vitest",
    "vite", "rollup", "esbuild", "parcel",
    "mongoose", "sequelize", "typeorm", "prisma",
    "socket.io", "ws", "cors", "helmet",
}

# Packages that are well-maintained low-risk utilities
LOW_RISK_PACKAGES = {
    "clsx", "classnames", "zod", "date-fns", "uuid",
    "immer", "zustand", "jotai", "tailwindcss",
    "lucide-react", "radix-ui", "framer-motion",
}


def _version_risk(version_str: str) -> float:
    """
    Older / unpinned versions add risk.
    ^ or ~ prefix = not locked = slightly riskier.
    Very old major versions (0.x, 1.x) are riskier.
    """
    risk = 0.0
    if not version_str or version_str in ("*", "latest"):
        return 0.4          # unpinned is risky

    if version_str.startswith("^") or version_str.startswith("~"):
        risk += 0.08        # range specifier

    # Strip prefix
    v = version_str.lstrip("^~>=<v").split(".")[0]
    try:
        major = int(v)
        if major == 0:
            risk += 0.2     # pre-stable
        elif major == 1:
            risk += 0.05
    except ValueError:
        pass

    return min(risk, 0.4)


def _compute_risk(name: str, version: str, is_dev: bool, dep_count: int) -> float:
    """
    Risk score 0.0–1.0 composed of:
      - Base risk by known-package category     (0–0.5)
      - Version / pinning risk                  (0–0.4)
      - Dev dependency discount                 (-0.15)
      - Depth / fan-out penalty                 (0–0.1)
    """
    name_lower = name.lower().replace("@", "").split("/")[-1]

    if name_lower in HIGH_RISK_PACKAGES:
        base = 0.55
    elif name_lower in MEDIUM_RISK_PACKAGES:
        base = 0.35
    elif name_lower in LOW_RISK_PACKAGES:
        base = 0.10
    else:
        # Unknown package – moderate default
        base = 0.30

    version_penalty = _version_risk(version)
    dev_discount     = -0.15 if is_dev else 0.0
    depth_penalty    = min(dep_count / 200, 0.10)

    score = base + version_penalty + dev_discount + depth_penalty
    return round(max(0.02, min(0.98, score)), 2)


def _spread_position(index: int, total: int) -> list[float]:
    """Fibonacci-sphere-ish spread so nodes don't clump."""
    if total <= 1:
        return [0.0, 0.0, 0.0]
    golden = math.pi * (3 - math.sqrt(5))
    y   = 1 - (index / (total - 1)) * 2
    rad = math.sqrt(max(0, 1 - y * y))
    phi = golden * index
    spread = 40 + (total / 10)
    return [
        round(math.cos(phi) * rad * spread, 2),
        round(y * spread * 0.5, 2),
        round(math.sin(phi) * rad * spread, 2),
    ]


class DependencyAnalyzer:

    @staticmethod
    def parse_package_json(package_data: dict) -> dict[str, Any]:
        """Build graph from a single package.json."""
        nodes = []
        edges = []

        project_name = package_data.get("name", "unknown-project")
        project_ver  = package_data.get("version", "0.0.0")

        # Root node
        root_id = project_name
        nodes.append({
            "id":        root_id,
            "label":     project_name,
            "type":      "repository",
            "position":  [0.0, 0.0, 0.0],
            "riskScore": 0.0,
            "size":      1.4,
            "metadata": {
                "name":    project_name,
                "version": project_ver,
                "isRoot":  True,
            },
        })

        dependencies     = package_data.get("dependencies",    {})
        dev_dependencies = package_data.get("devDependencies", {})
        all_deps         = {**dependencies, **dev_dependencies}
        total            = len(all_deps)

        for index, (dep_name, dep_version) in enumerate(all_deps.items()):
            is_dev  = dep_name in dev_dependencies
            risk    = _compute_risk(dep_name, dep_version, is_dev, total)
            pos     = _spread_position(index, total)

            dep_type = "library"
            name_l   = dep_name.lower()
            if any(x in name_l for x in ("express", "fastify", "koa", "hapi", "nest")):
                dep_type = "service"
            elif any(x in name_l for x in ("mongo", "postgres", "mysql", "sqlite", "redis", "prisma", "drizzle", "typeorm")):
                dep_type = "database"
            elif any(x in name_l for x in ("axios", "fetch", "got", "superagent", "http", "grpc")):
                dep_type = "api"
            elif any(x in name_l for x in ("webpack", "vite", "rollup", "esbuild", "parcel", "babel", "swc")):
                dep_type = "server"

            nodes.append({
                "id":        dep_name,
                "label":     dep_name,
                "type":      dep_type,
                "position":  pos,
                "riskScore": risk,
                "size":      1.2 if risk > 0.7 else 1.0 if risk > 0.4 else 0.8,
                "metadata": {
                    "name":    dep_name,
                    "version": dep_version,
                    "isDev":   is_dev,
                    "license": "unknown",
                },
            })

            edges.append({
                "id":     f"edge-{dep_name}",
                "source": root_id,
                "target": dep_name,
                "weight": 1.0 if not is_dev else 0.5,
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "projectName":        project_name,
                "totalDependencies":  total,
                "directDependencies": len(dependencies),
                "devDependencies":    len(dev_dependencies),
            },
        }