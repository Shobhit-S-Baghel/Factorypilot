from fastapi import APIRouter
from datetime import datetime
from app.core.config import settings
from app.services.chroma_service import chroma_service
from app.services.rag_service import rag_service

router = APIRouter()


@router.get("")
async def get_health():
    """Health check endpoint returning system statuses, version, and vector store readiness."""
    chroma_status = "connected" if chroma_service.is_connected else "in_memory"
    rag_chunks = len(rag_service.chunks)

    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "operational",
            "chromadb": chroma_status,
            "rag_engine": f"active ({rag_chunks} chunks indexed)",
            "ml_anomaly_engine": "operational (IsolationForest + ISO 10816)",
        },
    }
