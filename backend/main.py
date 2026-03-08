from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="OpenPulse API",
    description="Backend API for 3D Intelligence Platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "OpenPulse API",
        "version": "0.1.0",
        "status": "Phase 1 Complete"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}