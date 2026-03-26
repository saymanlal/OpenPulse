from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import graph
from app.api import analyze

app = FastAPI(title="OpenPulse API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(analyze.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.3.0"}


@app.get("/")
async def root():
    return {
        "message": "OpenPulse API",
        "version": "0.3.0",
        "docs": "/docs",
    }