"""Budget alert for LLM usage.

Periodically checks today's LLM cost against the configured daily budget
and sends an email alert to all admin users when the budget is exceeded.
"""

from datetime import UTC, datetime

from src.core.config import settings
from src.core.database import get_db
from src.core.email import send_email
from src.core.logging import get_logger

logger = get_logger("toan_truc_quan.budget_alert")


async def check_llm_budget() -> None:
    """Check today's LLM cost and alert if it exceeds the daily budget.

    Queries ``llm_audit_logs`` for all records created since midnight UTC,
    sums their *cost_usd*, and compares with ``settings.llm_daily_budget_usd``.

    If the budget is exceeded, sends an email to every user with
    ``role == "admin"`` via Resend.
    """
    db = get_db()
    today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)

    pipeline = [
        {"$match": {"created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$cost_usd", 0]}}}},
    ]
    result = await db.llm_audit_logs.aggregate(pipeline).to_list(1)
    today_cost = result[0]["total"] if result else 0.0
    budget = settings.llm_daily_budget_usd

    if today_cost <= budget:
        logger.debug(
            "llm_budget_ok",
            daily_cost=round(today_cost, 6),
            budget=budget,
        )
        return

    logger.warning(
        "llm_budget_exceeded",
        daily_cost=round(today_cost, 6),
        budget=budget,
    )

    # Notify all admins
    admins = await db.users.find({"role": "admin"}, {"email": 1}).to_list(length=None)
    if not admins:
        logger.info("llm_budget_no_admins_to_alert")
        return

    subject = f"Cảnh báo ngân sách LLM — ${today_cost:.4f} / ${budget:.2f}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #D32F2F;">⚠️ Cảnh báo ngân sách LLM</h2>
        <p>Chi phí LLM hôm nay đã vượt ngân sách cấu hình:</p>
        <table style="margin: 16px 0; border-collapse: collapse;">
            <tr>
                <td style="padding: 6px 12px; font-weight: bold;">Chi phí hôm nay</td>
                <td style="padding: 6px 12px;">${today_cost:.4f}</td>
            </tr>
            <tr>
                <td style="padding: 6px 12px; font-weight: bold;">Ngân sách</td>
                <td style="padding: 6px 12px;">${budget:.2f}</td>
            </tr>
            <tr>
                <td style="padding: 6px 12px; font-weight: bold;">Vượt</td>
                <td style="padding: 6px 12px; color: #D32F2F;">+{((today_cost / budget) - 1) * 100:.1f}%</td>
            </tr>
        </table>
        <p style="color: #666; font-size: 13px;">
            Vào admin dashboard để xem chi tiết: <a href="{settings.frontend_url}/admin">{settings.frontend_url}/admin</a>
        </p>
    </div>
    """

    sent = 0
    for admin in admins:
        email = admin.get("email")
        if not email:
            continue
        ok = await send_email(email, subject, html)
        if ok:
            sent += 1

    logger.info(
        "llm_budget_alert_dispatched",
        admin_count=sent,
        total_admins=len(admins),
    )
