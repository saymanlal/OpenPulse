"""API endpoint for analyzing GitHub repositories."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.github_service import github_service
from app.services.dependency_analyzer import DependencyAnalyzer

router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Request model for repository analysis."""
    owner: str
    repo: str
    branch: str = "main"


class AnalyzeResponse(BaseModel):
    """Response model for repository analysis."""
    nodes: list
    edges: list
    metadata: dict


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repository(request: AnalyzeRequest):
    """Analyze a GitHub repository and return dependency graph.
    
    Args:
        request: Repository information (owner, repo, branch)
        
    Returns:
        Graph data with nodes and edges
        
    Raises:
        HTTPException: If repository not found or package.json missing
    """
    # Fetch package.json from GitHub
    package_data = await github_service.fetch_package_json(
        owner=request.owner,
        repo=request.repo,
        branch=request.branch
    )
    
    if not package_data:
        raise HTTPException(
            status_code=404,
            detail=f"package.json not found in {request.owner}/{request.repo}"
        )
    
    # Parse dependencies and build graph
    analyzer = DependencyAnalyzer()
    graph_data = analyzer.parse_package_json(package_data)
    
    return AnalyzeResponse(
        nodes=graph_data["nodes"],
        edges=graph_data["edges"],
        metadata=graph_data["metadata"]
    )