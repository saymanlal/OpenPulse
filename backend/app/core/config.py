import os
from functools import lru_cache


class Settings:
    def __init__(self) -> None:
        self.api_host = os.getenv('API_HOST', '0.0.0.0')
        self.api_port = int(os.getenv('API_PORT', '10000'))
        self.github_token = os.getenv('GITHUB_TOKEN', '').strip()
        self.github_api_base = os.getenv('GITHUB_API_BASE', 'https://api.github.com').rstrip('/')
        
        # Frontend URL for CORS
        self.frontend_url = os.getenv('FRONTEND_URL', 'https://open-pulse.onrender.com')
        
        # CORS origins
        self.cors_origins = [
            self.frontend_url,
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:10000',
        ]
        
        self.max_graph_nodes = int(os.getenv('MAX_GRAPH_NODES', '120'))
        self.request_timeout = float(os.getenv('REQUEST_TIMEOUT', '30'))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()