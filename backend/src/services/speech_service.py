import re

import httpx

from src.core.config import settings
from src.core.logging import get_logger

_TTS_UNAVAILABLE_MESSAGE = "He thong chua tao duoc giong doc tu dich vu am thanh luc nay."
_TTS_NOT_READY_MESSAGE = "Dich vu giong doc chua san sang."
_URL_PATTERN = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_MARKDOWN_LINK_PATTERN = re.compile(r"\[(.*?)\]\((.*?)\)")
_WHITESPACE_PATTERN = re.compile(r"\s+")

logger = get_logger("toan_truc_quan.speech")


class SpeechServiceError(Exception):
    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class SpeechService:
    def sanitize_text(self, text: str) -> str:
        stripped = _MARKDOWN_LINK_PATTERN.sub(r"\1", text)
        stripped = _URL_PATTERN.sub(" ", stripped)
        replacements = {
            "`": " ",
            "*": " ",
            "_": " ",
            "#": " ",
            ">": " lon hon ",
            "<": " nho hon ",
            "=": " bang ",
            "+": " cong ",
            "-": " tru ",
            "/": " chia ",
            "%": " phan tram ",
            "\r": " ",
            "\n": " ",
        }
        for source, target in replacements.items():
            stripped = stripped.replace(source, target)

        stripped = re.sub(r"(\d)\s*x\s*(\d)", r"\1 nhan \2", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\bcm\b", " xen ti met ", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\bmm\b", " mi li met ", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\bkg\b", " ki lo gam ", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\bg\b", " gam ", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\bml\b", " mi li lit ", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\bl\b", " lit ", stripped, flags=re.IGNORECASE)
        stripped = re.sub(r"\bm\b", " met ", stripped, flags=re.IGNORECASE)
        return _WHITESPACE_PATTERN.sub(" ", stripped).strip()

    @staticmethod
    def _speed_for_request(slow: bool) -> float:
        return settings.tts_speed_slow if slow else settings.tts_speed_normal

    @staticmethod
    def _is_audio_response(response: httpx.Response, audio_bytes: bytes) -> bool:
        content_type = (response.headers.get("content-type") or "").lower()
        return bool(audio_bytes) and (
            content_type.startswith("audio/") or content_type.startswith("application/octet-stream")
        )

    @staticmethod
    def _truncate_for_log(value: str, limit: int = 240) -> str:
        compact = _WHITESPACE_PATTERN.sub(" ", value).strip()
        if len(compact) <= limit:
            return compact
        return f"{compact[:limit]}..."

    @staticmethod
    def _extract_provider_error(response: httpx.Response) -> tuple[str | None, str | None]:
        try:
            payload = response.json()
        except ValueError:
            return None, None

        if isinstance(payload, dict):
            error = payload.get("error")
            if isinstance(error, dict):
                code = error.get("code")
                message = error.get("message") or error.get("detail")
                return (
                    str(code) if code is not None else None,
                    str(message) if message is not None else None,
                )
            message = payload.get("message") or payload.get("detail")
            code = payload.get("code")
            return (
                str(code) if code is not None else None,
                str(message) if message is not None else None,
            )

        return None, None

    def _build_openrouter_payload(self, plain_text: str, slow: bool, *, include_optional: bool) -> dict[str, object]:
        payload: dict[str, object] = {
            "model": settings.tts_model,
            "input": plain_text,
            "voice": settings.tts_voice,
        }

        if include_optional and settings.tts_send_response_format and settings.tts_response_format:
            payload["response_format"] = settings.tts_response_format
        if include_optional and settings.tts_send_speed:
            payload["speed"] = self._speed_for_request(slow)

        return payload

    @staticmethod
    def _openrouter_endpoint() -> str:
        return f"{settings.openrouter_base_url.rstrip('/')}/{settings.openrouter_tts_path.lstrip('/')}"

    def _map_openrouter_error(
        self,
        response: httpx.Response,
        provider_code: str | None,
        provider_message: str | None,
    ) -> SpeechServiceError:
        if response.status_code in {401, 403}:
            return SpeechServiceError(503, _TTS_NOT_READY_MESSAGE)

        if response.status_code == 400:
            lowered = (provider_message or "").lower()
            if '"voice"' in lowered and "expected string" in lowered:
                return SpeechServiceError(502, "OpenRouter yeu cau voice bat buoc cho TTS.")
            if "model" in lowered and ("audio" in lowered or "speech" in lowered):
                return SpeechServiceError(502, "Model TTS cua OpenRouter chua ho tro audio.")
            if "voice" in lowered or "speed" in lowered or "response_format" in lowered:
                return SpeechServiceError(502, "OpenRouter TTS khong chap nhan mot so truong cau hinh hien tai.")
            return SpeechServiceError(502, _TTS_UNAVAILABLE_MESSAGE)

        if response.status_code >= 500:
            return SpeechServiceError(503, _TTS_NOT_READY_MESSAGE)

        return SpeechServiceError(502, _TTS_UNAVAILABLE_MESSAGE)

    async def _post_openrouter_tts(
        self,
        client: httpx.AsyncClient,
        plain_text: str,
        slow: bool,
        *,
        include_optional: bool,
    ) -> bytes:
        payload = self._build_openrouter_payload(plain_text, slow, include_optional=include_optional)
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.openrouter_site_url,
            "X-Title": settings.openrouter_app_name,
        }
        response = await client.post(
            self._openrouter_endpoint(),
            headers=headers,
            json=payload,
        )
        audio_bytes = response.content
        content_type = (response.headers.get("content-type") or "").lower()
        provider_code, provider_message = self._extract_provider_error(response)

        logger.info(
            "tts_openrouter_response",
            provider="openrouter_gpt_tts",
            model=settings.tts_model,
            voice=settings.tts_voice,
            slow=slow,
            include_optional_payload=include_optional,
            status_code=response.status_code,
            content_type=content_type,
            provider_error_code=provider_code,
            provider_error_message=self._truncate_for_log(provider_message or response.text),
        )

        if response.is_success and self._is_audio_response(response, audio_bytes):
            logger.info(
                "tts_synthesized",
                provider="openrouter_gpt_tts",
                model=settings.tts_model,
                slow=slow,
                include_optional_payload=include_optional,
            )
            return audio_bytes

        if response.is_success:
            raise SpeechServiceError(502, _TTS_UNAVAILABLE_MESSAGE)

        raise self._map_openrouter_error(response, provider_code, provider_message)

    async def synthesize(self, text: str, slow: bool = False) -> bytes:
        plain_text = self.sanitize_text(text)
        if not plain_text:
            raise SpeechServiceError(400, "Text to speech cannot be empty.")

        if len(plain_text) > settings.tts_max_chars:
            raise SpeechServiceError(
                400,
                f"Text to speech must be at most {settings.tts_max_chars} characters.",
            )

        return await self._synthesize_with_openrouter(plain_text, slow)

    async def _synthesize_with_openrouter(self, plain_text: str, slow: bool) -> bytes:
        if not settings.openrouter_api_key:
            raise SpeechServiceError(503, _TTS_NOT_READY_MESSAGE)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                try:
                    return await self._post_openrouter_tts(
                        client,
                        plain_text,
                        slow,
                        include_optional=False,
                    )
                except SpeechServiceError as exc:
                    optional_enabled = any(
                        (
                            settings.tts_send_response_format,
                            settings.tts_send_speed,
                        )
                    )
                    if exc.status_code != 502 or not optional_enabled:
                        raise
                    logger.info(
                        "tts_openrouter_retrying_with_optional_payload",
                        provider="openrouter_gpt_tts",
                        model=settings.tts_model,
                        slow=slow,
                    )
                    return await self._post_openrouter_tts(
                        client,
                        plain_text,
                        slow,
                        include_optional=True,
                    )
        except SpeechServiceError:
            raise
        except httpx.TimeoutException as exc:
            raise SpeechServiceError(503, _TTS_NOT_READY_MESSAGE) from exc
        except Exception as exc:
            raise SpeechServiceError(503, _TTS_UNAVAILABLE_MESSAGE) from exc
