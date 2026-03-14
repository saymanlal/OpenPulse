from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import init_db
from app.api.graph import router as graph_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="OpenPulse API",
    description="Backend API for 3D Intelligence Platform",
    version="0.2.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(graph_router)

@app.get("/")
async def root():
    return {
        "message": "OpenPulse API",
        "version": "0.2.0",
        "status": "Phase 9 Complete - Backend Graph Models"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}