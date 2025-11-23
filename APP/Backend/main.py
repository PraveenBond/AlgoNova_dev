"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from Routers import auth_router, broker_router, market_router, orders_router, portfolio_router, strategies_router
from DB.database import engine, Base
from config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Algo Trading API",
    description="Algorithmic Trading Platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(broker_router.router, prefix="/api/broker", tags=["Broker"])
app.include_router(market_router.router, prefix="/api/market", tags=["Market Data"])
app.include_router(orders_router.router, prefix="/api/orders", tags=["Orders"])
app.include_router(portfolio_router.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(strategies_router.router, prefix="/api/strategies", tags=["Strategies"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Algo Trading API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "message": str(exc)}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

