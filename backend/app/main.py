from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.services.chroma_service import chroma_service

setup_logging()
logger = logging.getLogger("factorypilot.main")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Initializing FactoryPilot Core Services...")
    # Attempt connecting to ChromaDB vector store
    chroma_service.connect()
    yield
    logger.info("Shutting down FactoryPilot Core Services...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Industrial AI & Telemetry Platform API for Machine Monitoring and RAG Manual Lookup",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
origins = settings.BACKEND_CORS_ORIGINS
if isinstance(origins, list):
    allowed_origins = origins
else:
    allowed_origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health endpoint for container healthchecks
@app.get("/health", tags=["Root"])
async def root_health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# Include API v1 routes
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.BACKEND_PORT, reload=settings.DEBUG)
