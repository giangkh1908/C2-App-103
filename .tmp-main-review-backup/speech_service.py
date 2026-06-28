import re
from importlib import import_module
from pathlib import Path
from tempfile import NamedTemporaryFile

from src.core.config import settings
from src.core.logging import get_logger

_TTS_UNAVAILABLE_MESSAGE = "He thong chua tao duoc giong doc tu dich vu am thanh luc nay."
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
    media_type = "audio/mpeg"

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
    def _rate_for_request(slow: bool) -> str:
        rate = settings.tts_speed_slow if slow else settings.tts_speed_normal
        prefix = "+" if rate > 0 else ""
        return f"{prefix}{int(rate)}%"

    @staticmethod
    def _edge_tts_module():
        try:
            return import_module("edge_tts")
        except ModuleNotFoundError as exc:
            raise SpeechServiceError(503, _TTS_UNAVAILABLE_MESSAGE) from exc

    async def synthesize(self, text: str, slow: bool = False) -> bytes:
        plain_text = self.sanitize_text(text)
        if not plain_text:
            raise SpeechServiceError(400, "Text to speech cannot be empty.")

        if len(plain_text) > settings.tts_max_chars:
            raise SpeechServiceError(
                400,
                f"Text to speech must be at most {settings.tts_max_chars} characters.",
            )

        return await self._synthesize_with_edge_tts(plain_text, slow)

    async def _synthesize_with_edge_tts(self, plain_text: str, slow: bool) -> bytes:
        rate = self._rate_for_request(slow)

        try:
            edge_tts = self._edge_tts_module()
            communicate = edge_tts.Communicate(
                text=plain_text,
                voice=settings.tts_voice,
                rate=rate,
            )
            with NamedTemporaryFile(suffix=f".{settings.tts_response_format}", delete=False) as tmp_file:
                temp_path = Path(tmp_file.name)

            try:
                await communicate.save(str(temp_path))
                audio_bytes = temp_path.read_bytes()
            finally:
                temp_path.unlink(missing_ok=True)

            if not audio_bytes:
                raise SpeechServiceError(502, _TTS_UNAVAILABLE_MESSAGE)

            logger.info(
                "tts_synthesized",
                provider="edge_tts",
                model=settings.tts_model,
                voice=settings.tts_voice,
                slow=slow,
                rate=rate,
                media_type=self.media_type,
            )
            return audio_bytes
        except SpeechServiceError:
            raise
        except Exception as exc:
            logger.warning(
                "tts_provider_failed",
                provider="edge_tts",
                model=settings.tts_model,
                voice=settings.tts_voice,
                slow=slow,
                rate=rate,
                error_message=str(exc),
            )
            raise SpeechServiceError(503, _TTS_UNAVAILABLE_MESSAGE) from exc
