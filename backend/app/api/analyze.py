"""Analyze endpoint - handles multi-package.json repos."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.github_service import github_service
from app.services.dependency_analyzer import DependencyAnalyzer

router = APIRouter(prefix="/api", tags=["analyze"])


class AnalyzeRequest(BaseModel):
    owner: str
    repo:  str
    path:  str | None = None   # optional: specific package.json path


class PackageOption(BaseModel):
    path:         str
    name:         str
    version:      str
    description:  str
    depCount:     int


class AnalyzeResponse(BaseModel):
    status:          str
    nodes:           list  = []
    edges:           list  = []
    metadata:        dict  = {}
    # Set when multiple package.json found and no path selected
    multipleFound:   bool  = False
    packageOptions:  list[PackageOption] = []


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(req: AnalyzeRequest):
    """
    1. Search entire repo for package.json files.
    2. If multiple found and no path given → return options list.
    3. If single found or path given → analyze and return graph.
    """
    try:
        all_pkgs = await github_service.find_package_jsons(req.owner, req.repo)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub fetch failed: {e}")

    if not all_pkgs:
        raise HTTPException(status_code=404, detail="No package.json found in this repository.")

    # If caller specified a path, find that one
    if req.path:
        match = next((p for p in all_pkgs if p["path"] == req.path), None)
        if not match:
            raise HTTPException(status_code=404, detail=f"package.json not found at {req.path}")
        selected = match
    elif len(all_pkgs) == 1:
        selected = all_pkgs[0]
    else:
        # Multiple found — ask the frontend to choose
        options = [
            PackageOption(
                path=p["path"],
                name=p["name"],
                version=p["version"],
                description=p["description"],
                depCount=len(p["dependencies"]) + len(p["devDependencies"]),
            )
            for p in all_pkgs
        ]
        return AnalyzeResponse(
            status="multiple_found",
            multipleFound=True,
            packageOptions=options,
        )

    # Analyze the selected package.json
    graph = DependencyAnalyzer.parse_package_json(selected["_raw"])

    return AnalyzeResponse(
        status="ok",
        nodes=graph["nodes"],
        edges=graph["edges"],
        metadata=graph["metadata"],
    )