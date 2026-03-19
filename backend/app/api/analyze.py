from fastapi import APIRouter, Query

from app.services.github_analyzer import GitHubAnalyzerService

router = APIRouter(tags=['analysis'])
service = GitHubAnalyzerService()


@router.get('/analyze')
async def analyze_repository(repo: str = Query(..., min_length=3, description='Repository in owner/name format')):
    return await service.analyze_repository(repo)
