from fastapi import APIRouter

from src.services import plan_service

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/")
async def list_plans():
    """Public plan catalog - returns only display fields."""
    plans = await plan_service.get_all_plans()
    return {
        "plans": [
            {
                "id": p.id,
                "name": p.name,
                "displayName": p.display_name,
                "priceMonthly": p.price_monthly,
                "priceYearly": p.price_yearly,
                "quotas": {
                    "chatTurns": p.quotas.chat_turns,
                    "ttsRequests": p.quotas.tts_requests,
                    "sttRequests": p.quotas.stt_requests,
                    "practiceExams": p.quotas.practice_exams,
                },
                "features": {
                    "progressTracking": p.features.progress_tracking,
                    "parentDashboard": p.features.parent_dashboard,
                    "multiAccounts": p.features.multi_accounts,
                },
            }
            for p in plans
        ]
    }
