"""GitHub API service for fetching repository data."""
import httpx
from typing import Optional


class GitHubService:
    """Service for interacting with GitHub API."""

    BASE_URL = "https://api.github.com"
    RAW_URL = "https://raw.githubusercontent.com"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch_package_json(self, owner: str, repo: str, branch: str = "main") -> Optional[dict]:
        """Fetch package.json from a GitHub repository.
        
        Args:
            owner: Repository owner
            repo: Repository name
            branch: Branch name (defaults to 'main')
            
        Returns:
            Parsed package.json content or None if not found
        """
        # Try main branch first
        url = f"{self.RAW_URL}/{owner}/{repo}/{branch}/package.json"
        
        try:
            response = await self.client.get(url)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass

        # Try master branch as fallback
        if branch == "main":
            url = f"{self.RAW_URL}/{owner}/{repo}/master/package.json"
            try:
                response = await self.client.get(url)
                if response.status_code == 200:
                    return response.json()
            except Exception:
                pass

        return None

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Singleton instance
github_service = GitHubService()