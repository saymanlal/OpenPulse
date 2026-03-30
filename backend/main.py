from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analyze, graph, repo_intel
from app.core.database import init_db

app = FastAPI(
    title="OpenPulse API",
    version="1.0.0",
    description="Multi-ecosystem dependency analysis API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://open-pulse.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:10000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, tags=["analyze"])
app.include_router(graph.router, tags=["graph"])
app.include_router(repo_intel.router, tags=["repo-intel"])


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "OpenPulse API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "graph": "/api/graph/data",
            "repo-intel": "/api/repo-intel",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "openpulse-api",
        "version": "1.0.0"
    }
