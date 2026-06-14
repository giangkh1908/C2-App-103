from fastapi import APIRouter


router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("")
async def list_topics() -> dict:
    return {
        "topics": [
            {"id": "multiplication", "label": "Phep nhan"},
            {"id": "division", "label": "Phep chia"},
            {"id": "fraction_basic", "label": "Phan so co ban"},
            {"id": "perimeter_area_basic", "label": "Chu vi va dien tich co ban"},
        ]
    }
