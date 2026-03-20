from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import graph
from app.api import analyze

app = FastAPI(title="OpenPulse API", version="0.3.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "0.3.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "OpenPulse API",
        "version": "0.3.0",
        "docs": "/docs",
    }