from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analyze import router as analyze_router
from app.api.graph import router as graph_router
from app.core.config import get_settings
from app.core.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title='OpenPulse API',
    description='Analyze public GitHub repositories and stream graph data for the OpenPulse 3D client.',
    version='1.0.0',
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(analyze_router)
app.include_router(graph_router)


@app.get('/')
async def root():
    return {
        'name': 'OpenPulse API',
        'version': '1.0.0',
        'status': 'ready',
    }


@app.get('/health')
async def health():
    return {
        'status': 'healthy',
        'github_api_base': settings.github_api_base,
        'cors_origins': settings.cors_origins,
    }
