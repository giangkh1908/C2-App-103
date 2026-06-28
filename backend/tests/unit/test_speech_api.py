from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from src.services.speech_service import SpeechServiceError


@pytest.mark.asyncio
class TestSpeechApi:
    async def test_tts_success_returns_audio(self, client: AsyncClient, auth_headers):
        with patch(
            "src.api.speech.SpeechService.synthesize",
            new=AsyncMock(return_value=b"fake-wav"),
        ):
            response = await client.post(
                "/api/v1/speech/tts",
                headers=auth_headers,
                json={"text": "Xin chao", "slow": False},
            )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("audio/wav")
        assert response.content == b"fake-wav"

    async def test_tts_rejects_empty_text(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/speech/tts",
            headers=auth_headers,
            json={"text": ""},
        )

        assert response.status_code == 422

    async def test_tts_rejects_too_long_text(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/speech/tts",
            headers=auth_headers,
            json={"text": "a" * 1500},
        )

        assert response.status_code == 400
        assert "at most" in response.json()["detail"]

    async def test_tts_maps_provider_error(self, client: AsyncClient, auth_headers):
        with patch(
            "src.api.speech.SpeechService.synthesize",
            new=AsyncMock(
                side_effect=SpeechServiceError(
                    502,
                    "He thong chua tao duoc giong doc tu dich vu am thanh luc nay.",
                )
            ),
        ):
            response = await client.post(
                "/api/v1/speech/tts",
                headers=auth_headers,
                json={"text": "Xin chao", "slow": True},
            )

        assert response.status_code == 502
        assert "dich vu am thanh" in response.json()["detail"]
