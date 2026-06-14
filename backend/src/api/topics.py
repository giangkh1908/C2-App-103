from fastapi import APIRouter


router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("")
async def list_topics() -> dict:
    return {
        "topics": [
            {"id": "multiplication", "label": "Phép nhân"},
            {"id": "division", "label": "Phép chia"},
            {"id": "fraction_basic", "label": "Phân số cơ bản"},
            {"id": "perimeter_area_basic", "label": "Chu vi và diện tích cơ bản"},
        ]
    }
