from fastapi import APIRouter, Depends

from src.core.deps import get_current_admin
from src.core.metrics import get_metrics

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("")
async def metrics(admin=Depends(get_current_admin)) -> dict:
    return get_metrics()
