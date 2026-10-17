from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.core.config import settings
from app.services.chroma_service import chroma_service

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    chroma_status = "connected" if chroma_service.is_connected else "degraded_in_memory"
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        services={
            "api": "operational",
            "chromadb": chroma_status,
        },
    )
