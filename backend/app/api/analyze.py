"""
/api/analyze  — Universal multi-ecosystem endpoint.

Flow:
  1. Scan the whole repo → find every manifest file.
  2. If no manifests → 404.
  3. Build one merged graph from ALL manifests found.
  4. Return graph + manifestGroups so the frontend knows what was found.
"""
from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.dependency_analyzer import DependencyAnalyzer
from app.services.github_service import github_service

router = APIRouter(prefix="/api", tags=["analyze"])


# ------------------------------------------------------------------ #
#  Request / Response models                                           #
# ------------------------------------------------------------------ #

class AnalyzeRequest(BaseModel):
    owner:      str
    repo:       str
    ecosystem:  str | None = None   # "npm" | "python" | "go" | "rust" | None=all


class EcosystemSummary(BaseModel):
    ecosystem:    str
    manifestPath: str
    projectName:  str
    totalDeps:    int
    directDeps:   int
    devDeps:      int


class AnalyzeResponse(BaseModel):
    status:      str
    ecosystems:  list[EcosystemSummary] = []
    nodes:       list = []
    edges:       list = []
    metadata:    dict = {}


# ------------------------------------------------------------------ #
#  Endpoint                                                            #
# ------------------------------------------------------------------ #

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(req: AnalyzeRequest) -> AnalyzeResponse:
    """
    Scan a GitHub repo for ALL manifest files across all ecosystems.
    Returns a merged graph with 3D clusters separated by ecosystem.
    Multiple manifests of the same ecosystem fan out from the same base position.
    """
    try:
        scan = await github_service.scan_repo(req.owner, req.repo)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GitHub fetch failed: {exc}")

    manifests = scan.get("manifests", [])

    # Keep only manifests that actually have dependencies
    valid = [
        m for m in manifests
        if m.get("parsed")
        and (
            m["parsed"].get("dependencies")
            or m["parsed"].get("devDependencies")
        )
    ]

    if not valid:
        raise HTTPException(
            status_code=404,
            detail=(
                "No supported manifest files found. "
                "OpenPulse supports: package.json, requirements.txt, "
                "pyproject.toml, go.mod, Cargo.toml"
            ),
        )

    # Filter by requested ecosystem
    if req.ecosystem and req.ecosystem != "all":
        filtered = [m for m in valid if m["ecosystem"] == req.ecosystem]
        if not filtered:
            raise HTTPException(
                status_code=404,
                detail=f"No {req.ecosystem} manifest found in this repository.",
            )
        valid = filtered

    # ---------------------------------------------------------------- #
    #  Merge all manifest graphs into one unified graph                 #
    # ---------------------------------------------------------------- #
    all_nodes: list[dict] = []
    all_edges: list[dict] = []
    ecosystems_found: list[EcosystemSummary] = []
    seen_node_ids: set[str] = set()
    node_index_map: dict[str, int] = {}

    # { "npm": ["frontend/package.json", "backend/package.json"], ... }
    manifest_groups: dict[str, list[str]] = {}

    for manifest_idx, manifest in enumerate(valid):
        graph = DependencyAnalyzer.analyze_manifest(manifest)
        meta  = graph["metadata"]
        eco   = meta["ecosystem"]
        mpath = meta["manifestPath"]

        ecosystems_found.append(EcosystemSummary(
            ecosystem=eco,
            manifestPath=mpath,
            projectName=meta["projectName"],
            totalDeps=meta["totalDependencies"],
            directDeps=meta["directDependencies"],
            devDeps=meta["devDependencies"],
        ))

        # How many manifests of this ecosystem have we already processed?
        eco_occurrence = len(manifest_groups.get(eco, []))
        manifest_groups.setdefault(eco, []).append(mpath)

        offset = _ecosystem_offset(eco, manifest_idx, eco_occurrence)

        for node in graph["nodes"]:
            nid = node["id"]
            if nid not in seen_node_ids:
                seen_node_ids.add(nid)
                pos = node["position"]
                node["position"] = [
                    round(pos[0] + offset[0], 2),
                    round(pos[1] + offset[1], 2),
                    round(pos[2] + offset[2], 2),
                ]
                # ── NEW: stamp owner/repo on every root node ──────── #
                if node.get("metadata", {}).get("isRoot"):
                    node["metadata"]["repoOwner"] = req.owner
                    node["metadata"]["repoName"]  = req.repo
                # ────────────────────────────────────────────────────── #
                node_index_map[nid] = len(all_nodes)
                all_nodes.append(node)
            else:
                # Same package appears in two manifests of the same ecosystem.
                # Merge manifestPaths so Inspector shows "appears in X, Y".
                existing  = all_nodes[node_index_map[nid]]
                ex_paths  = existing.get("metadata", {}).get("manifestPaths", [])
                new_paths = node.get("metadata", {}).get("manifestPaths", [])
                merged    = list(dict.fromkeys(ex_paths + new_paths))
                existing.setdefault("metadata", {})["manifestPaths"] = merged

        all_edges.extend(graph["edges"])

    total_nodes = len(all_nodes)
    total_edges = len(all_edges)
    avg_risk = (
        sum(n.get("riskScore", 0) for n in all_nodes) / total_nodes
        if total_nodes else 0.0
    )

    return AnalyzeResponse(
        status="ok",
        ecosystems=ecosystems_found,
        nodes=all_nodes,
        edges=all_edges,
        metadata={
            "owner":           req.owner,
            "repo":            req.repo,
            "totalNodes":      total_nodes,
            "totalEdges":      total_edges,
            "avgRisk":         round(avg_risk, 3),
            "ecosystemsFound": list(manifest_groups.keys()),
            "manifestGroups":  manifest_groups,
        },
    )


# ------------------------------------------------------------------ #
#  3D cluster positioning                                              #
# ------------------------------------------------------------------ #

_ECOSYSTEM_BASE: dict[str, tuple[float, float]] = {
    "npm":     (  0.0,   0.0),
    "python":  ( 90.0,   0.0),
    "go":      (-90.0,   0.0),
    "rust":    (  0.0,  90.0),
    "unknown": (  0.0, -90.0),
}

_MULTI_MANIFEST_FAN = 60.0


def _ecosystem_offset(ecosystem: str, global_index: int, eco_occurrence: int) -> list[float]:
    if ecosystem in _ECOSYSTEM_BASE:
        bx, bz = _ECOSYSTEM_BASE[ecosystem]
    else:
        angle = (global_index / 6) * math.pi * 2
        bx = round(math.cos(angle) * 100, 2)
        bz = round(math.sin(angle) * 100, 2)

    if eco_occurrence == 0:
        return [bx, 0.0, bz]

    length = math.sqrt(bx ** 2 + bz ** 2) or 1.0
    fan_x = (-bz / length) * _MULTI_MANIFEST_FAN * eco_occurrence
    fan_z = ( bx / length) * _MULTI_MANIFEST_FAN * eco_occurrence

    return [round(bx + fan_x, 2), 0.0, round(bz + fan_z, 2)]