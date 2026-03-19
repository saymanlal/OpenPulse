import os
from functools import lru_cache


class Settings:
    def __init__(self) -> None:
        self.api_host = os.getenv('API_HOST', '0.0.0.0')
        self.api_port = int(os.getenv('API_PORT', '8000'))
        self.github_token = os.getenv('GITHUB_TOKEN', '').strip()
        self.github_api_base = os.getenv('GITHUB_API_BASE', 'https://api.github.com').rstrip('/')
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        self.cors_origins = [
            origin.strip()
            for origin in os.getenv(
                'CORS_ORIGINS',
                f'http://localhost:3000,http://127.0.0.1:3000,{self.frontend_url}',
            ).split(',')
            if origin.strip()
        ]
        self.max_graph_nodes = int(os.getenv('MAX_GRAPH_NODES', '120'))
        self.request_timeout = float(os.getenv('REQUEST_TIMEOUT', '12'))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
