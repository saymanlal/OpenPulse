import base64
import hashlib
import json
from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import get_settings


class GitHubAnalyzerService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _headers(self) -> dict[str, str]:
        headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'OpenPulse/1.0',
        }
        if self.settings.github_token:
            headers['Authorization'] = f'Bearer {self.settings.github_token}'
        return headers

    async def analyze_repository(self, repo: str) -> dict[str, list[dict[str, Any]]]:
        owner, name = self._parse_repo(repo)

        async with httpx.AsyncClient(
            base_url=self.settings.github_api_base,
            headers=self._headers(),
            timeout=self.settings.request_timeout,
        ) as client:
            repository = await self._fetch_repository(client, owner, name)
            package_json = await self._fetch_package_json(client, owner, name, repository['default_branch'])

        dependencies = package_json.get('dependencies') or {}
        dependency_items = list(dependencies.items())[: max(self.settings.max_graph_nodes - 1, 0)]

        repo_id = repository['full_name']
        repo_node = {
            'id': repo_id,
            'type': 'repository',
            'risk': 0.12,
            'size': 2.6,
        }

        nodes: list[dict[str, Any]] = [repo_node]
        edges: list[dict[str, str]] = []

        for package_name, version in dependency_items:
            node_type = self._classify_package(package_name)
            risk = self._stable_risk(package_name)
            size = round(1.0 + min(len(package_name), 18) / 18, 2)
            nodes.append(
                {
                    'id': package_name,
                    'type': node_type,
                    'risk': risk,
                    'size': size,
                }
            )
            edges.append({'source': repo_id, 'target': package_name})

        if len(nodes) == 1:
            raise HTTPException(status_code=422, detail='No direct dependencies found in package.json')

        return {'nodes': nodes, 'edges': edges}

    def _parse_repo(self, repo: str) -> tuple[str, str]:
        cleaned = repo.strip().strip('/')
        parts = cleaned.split('/')
        if len(parts) != 2 or not all(parts):
            raise HTTPException(status_code=400, detail='Repository must be in owner/name format')
        return parts[0], parts[1]

    async def _fetch_repository(self, client: httpx.AsyncClient, owner: str, name: str) -> dict[str, Any]:
        response = await client.get(f'/repos/{owner}/{name}')
        self._raise_for_status(response, repo=f'{owner}/{name}')
        return response.json()

    async def _fetch_package_json(
        self,
        client: httpx.AsyncClient,
        owner: str,
        name: str,
        default_branch: str,
    ) -> dict[str, Any]:
        response = await client.get(f'/repos/{owner}/{name}/contents/package.json', params={'ref': default_branch})

        if response.status_code == 404 and default_branch != 'main':
            response = await client.get(f'/repos/{owner}/{name}/contents/package.json', params={'ref': 'main'})

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail='No package.json found in repository root')

        self._raise_for_status(response, repo=f'{owner}/{name}')
        payload = response.json()
        encoded = payload.get('content')
        if not encoded:
            raise HTTPException(status_code=502, detail='GitHub returned an empty package.json response')

        try:
            decoded = base64.b64decode(encoded).decode('utf-8')
        except Exception as exc:  # pragma: no cover - defensive decoding guard
            raise HTTPException(status_code=502, detail='Failed to decode package.json from GitHub') from exc

        try:
            return json.loads(decoded)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail='package.json is not valid JSON') from exc

    def _raise_for_status(self, response: httpx.Response, repo: str) -> None:
        if response.status_code < 400:
            return

        if response.status_code == 403 and response.headers.get('x-ratelimit-remaining') == '0':
            raise HTTPException(status_code=429, detail='GitHub API rate limit exceeded. Add GITHUB_TOKEN and retry.')

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail=f'Repository not found: {repo}')

        try:
            detail = response.json().get('message', 'GitHub API request failed')
        except ValueError:
            detail = 'GitHub API request failed'

        raise HTTPException(status_code=502, detail=detail)

    def _stable_risk(self, package_name: str) -> float:
        digest = hashlib.sha256(package_name.encode('utf-8')).hexdigest()
        bucket = int(digest[:8], 16) % 100
        return round(0.12 + (bucket / 100) * 0.76, 2)

    def _classify_package(self, package_name: str) -> str:
        lowered = package_name.lower()
        if 'db' in lowered or 'sql' in lowered or 'mongo' in lowered or 'redis' in lowered:
            return 'database'
        if 'api' in lowered or 'http' in lowered or 'graphql' in lowered:
            return 'api'
        if 'server' in lowered or 'express' in lowered or 'fastify' in lowered:
            return 'server'
        return 'library'
