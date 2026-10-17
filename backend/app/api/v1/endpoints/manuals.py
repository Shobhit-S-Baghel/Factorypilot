from fastapi import APIRouter
from app.models.schemas import ManualQueryRequest, ManualQueryResponse
from app.services.chroma_service import chroma_service

router = APIRouter()


@router.post("/search", response_model=ManualQueryResponse)
async def search_industrial_manuals(request: ManualQueryRequest) -> ManualQueryResponse:
    results = chroma_service.query_manuals(
        query_text=request.query,
        n_results=request.top_k,
        machine_filter=request.machine_filter,
    )
    return ManualQueryResponse(
        query=request.query,
        results=results,
        total_found=len(results),
    )
