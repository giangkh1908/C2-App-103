import httpx

from src.core.config import settings
from src.core.logging import get_logger

RESEND_API_URL = "https://api.resend.com/emails"
logger = get_logger("toan_truc_quan.email")


async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.resend_api_key:
        logger.info("email_disabled", email_to=to, email_subject=subject)
        return True

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.email_from,
                    "to": [to],
                    "subject": subject,
                    "html": html,
                },
            )
            if res.status_code == 200:
                logger.info("email_sent", email_to=to, email_subject=subject)
                return True

            logger.warning(
                "email_send_failed",
                email_to=to,
                email_subject=subject,
                status_code=res.status_code,
            )
            return False
    except Exception:
        logger.exception("email_send_exception", email_to=to, email_subject=subject)
        return False


async def send_reset_password_email(to: str, token: str) -> bool:
    reset_link = f"{settings.frontend_url}/reset-password?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4A6741;">Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới:</p>
        <a href="{reset_link}"
           style="display: inline-block; background: #4A6741; color: white; padding: 12px 24px;
                  border-radius: 9999px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Đặt lại mật khẩu
        </a>
        <p style="color: #666; font-size: 13px;">Link này sẽ hết hạn sau 1 giờ.</p>
        <p style="color: #666; font-size: 13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </div>
    """
    return await send_email(to, "Đặt lại mật khẩu - Toán Trực Quan AI", html)


async def send_verify_email(to: str, token: str) -> bool:
    verify_link = f"{settings.frontend_url}/verify-email?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4A6741;">Xác thực email</h2>
        <p>Chào mừng bạn đến với Toán Trực Quan AI! Nhấn nút bên dưới để xác thực email:</p>
        <a href="{verify_link}"
           style="display: inline-block; background: #4A6741; color: white; padding: 12px 24px;
                  border-radius: 9999px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Xác thực email
        </a>
        <p style="color: #666; font-size: 13px;">Link này sẽ hết hạn sau 24 giờ.</p>
    </div>
    """
    return await send_email(to, "Xác thực email - Toán Trực Quan AI", html)
