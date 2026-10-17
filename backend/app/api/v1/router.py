from fastapi import APIRouter
from app.api.v1.endpoints import health, telemetry, diagnostics, manuals, stream

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
api_router.include_router(stream.router, prefix="/telemetry", tags=["Real-Time Streaming"])
api_router.include_router(diagnostics.router, prefix="/diagnostics", tags=["Diagnostics & Manual RAG"])
api_router.include_router(manuals.router, prefix="/manuals", tags=["Manuals Vector Search"])
