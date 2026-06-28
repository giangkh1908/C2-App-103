from unittest.mock import AsyncMock, patch

import pytest
from httpx import Request, Response

from src.core.config import settings
from src.services.speech_service import SpeechService, SpeechServiceError


@pytest.mark.asyncio
async def test_synthesize_uses_openrouter_provider():
    service = SpeechService()

    with patch.object(
        SpeechService,
        "_synthesize_with_openrouter",
        new=AsyncMock(return_value=b"RIFF-openrouter"),
    ) as openrouter_mock:
        audio_bytes = await service.synthesize("Xin chao", slow=False)

    assert audio_bytes == b"RIFF-openrouter"
    openrouter_mock.assert_awaited_once()


@pytest.mark.asyncio
async def test_synthesize_raises_when_openrouter_fails():
    service = SpeechService()

    with patch.object(
        SpeechService,
        "_synthesize_with_openrouter",
        new=AsyncMock(side_effect=SpeechServiceError(502, "openrouter failed")),
    ):
        with pytest.raises(SpeechServiceError) as exc_info:
            await service.synthesize("Xin chao", slow=False)

    assert exc_info.value.status_code == 502


def test_speed_for_request_maps_slow_flag():
    assert SpeechService._speed_for_request(False) == settings.tts_speed_normal
    assert SpeechService._speed_for_request(True) == settings.tts_speed_slow


def test_build_openrouter_payload_uses_minimal_shape_by_default():
    service = SpeechService()

    payload = service._build_openrouter_payload("Xin chao", slow=False, include_optional=False)

    assert payload == {
        "model": settings.tts_model,
        "input": "Xin chao",
        "voice": settings.tts_voice,
    }


def test_build_openrouter_payload_can_include_optional_fields():
    service = SpeechService()

    with (
        patch.object(settings, "tts_send_response_format", True),
        patch.object(settings, "tts_send_speed", True),
        patch.object(settings, "tts_voice", "alloy"),
        patch.object(settings, "tts_response_format", "wav"),
        patch.object(settings, "tts_speed_slow", 0.8),
    ):
        payload = service._build_openrouter_payload("Xin chao", slow=True, include_optional=True)

    assert payload == {
        "model": settings.tts_model,
        "input": "Xin chao",
        "voice": "alloy",
        "response_format": "wav",
        "speed": 0.8,
    }


def test_extract_provider_error_reads_nested_json_message():
    response = Response(
        400,
        request=Request("POST", "https://openrouter.ai/api/v1/audio/speech"),
        json={"error": {"code": "bad_request", "message": "voice is not supported"}},
    )

    code, message = SpeechService._extract_provider_error(response)

    assert code == "bad_request"
    assert message == "voice is not supported"


def test_map_openrouter_error_detects_model_audio_failure():
    service = SpeechService()
    response = Response(
        400,
        request=Request("POST", "https://openrouter.ai/api/v1/audio/speech"),
        json={"error": {"message": "This model does not support audio speech generation."}},
    )

    exc = service._map_openrouter_error(
        response,
        provider_code=None,
        provider_message="This model does not support audio speech generation.",
    )

    assert exc.status_code == 502
    assert "Model TTS cua OpenRouter" in exc.message


def test_map_openrouter_error_detects_missing_voice_requirement():
    service = SpeechService()
    response = Response(
        400,
        request=Request("POST", "https://openrouter.ai/api/v1/audio/speech"),
        json=[{"path": ["voice"], "message": "Invalid input: expected string, received undefined"}],
    )

    exc = service._map_openrouter_error(
        response,
        provider_code=None,
        provider_message='[{"path":["voice"],"message":"Invalid input: expected string, received undefined"}]',
    )

    assert exc.status_code == 502
    assert "voice bat buoc" in exc.message
