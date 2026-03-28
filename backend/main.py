from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analyze, graph
from app.core.database import init_db

app = FastAPI(
    title="OpenPulse API",
    version="1.0.0",
    description="Multi-ecosystem dependency analysis API"
)

# ========================================
# CRITICAL: CORS Configuration
# ========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://open-pulse.onrender.com",      # Your production frontend
        "http://localhost:3000",                 # Local dev
        "http://127.0.0.1:3000",                # Local dev alternative
        "http://localhost:10000",               # Render preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, tags=["analyze"])
app.include_router(graph.router, tags=["graph"])


@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    await init_db()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "online",
        "service": "OpenPulse API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "graph": "/api/graph/data",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint for connection testing"""
    return {
        "status": "healthy",
        "service": "openpulse-api",
        "version": "1.0.0"
    }