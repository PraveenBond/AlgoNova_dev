from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from typing import List

# Load environment variables
load_dotenv()

app = FastAPI(title="AlgoNova API", version="1.0.0")


def _build_cors_origins() -> List[str]:
    """Return a list of allowed origins covering localhost + 127.0.0.1 variants."""
    default_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:9000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:9000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
    custom_env = os.getenv("CORS_ORIGINS")
    if custom_env:
        default_origins.extend([origin.strip() for origin in custom_env.split(",") if origin.strip()])
    # Remove duplicates while preserving insertion order
    seen = set()
    deduped = []
    for origin in default_origins:
        if origin not in seen:
            seen.add(origin)
            deduped.append(origin)
    return deduped


# CORS configuration
cors_origins = _build_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from APP.routers import broker, fyers

# Include routers
app.include_router(broker.router, prefix="/api/broker", tags=["broker"])
app.include_router(fyers.router, prefix="/api/fyers", tags=["fyers"])

@app.get("/")
async def root():
    return {"message": "AlgoNova API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

