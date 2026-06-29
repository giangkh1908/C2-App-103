from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from src.services.speech_service import SpeechService, SpeechServiceError


@pytest.mark.asyncio
async def test_synthesize_uses_edge_tts_provider():
    service = SpeechService()

    with patch.object(
        SpeechService,
        "_synthesize_with_edge_tts",
        new=AsyncMock(return_value=b"ID3-edge-tts"),
    ) as edge_tts_mock:
        audio_bytes = await service.synthesize("Xin chao", slow=False)

    assert audio_bytes == b"ID3-edge-tts"
    edge_tts_mock.assert_awaited_once()


@pytest.mark.asyncio
async def test_synthesize_raises_when_edge_tts_fails():
    service = SpeechService()

    with patch.object(
        SpeechService,
        "_synthesize_with_edge_tts",
        new=AsyncMock(side_effect=SpeechServiceError(502, "edge tts failed")),
    ):
        with pytest.raises(SpeechServiceError) as exc_info:
            await service.synthesize("Xin chao", slow=False)

    assert exc_info.value.status_code == 502


def test_rate_for_request_maps_slow_flag():
    assert SpeechService._rate_for_request(False) == "0%"
    assert SpeechService._rate_for_request(True) == "-15%"


@pytest.mark.asyncio
async def test_synthesize_with_edge_tts_returns_audio_bytes():
    service = SpeechService()
    fake_audio = b"ID3-audio"

    class FakeCommunicate:
        async def save(self, path: str) -> None:
            Path(path).write_bytes(fake_audio)

    fake_edge_tts = type(
        "FakeEdgeTtsModule", (), {"Communicate": lambda *args, **kwargs: FakeCommunicate()}
    )()

    with patch.object(SpeechService, "_edge_tts_module", return_value=fake_edge_tts):
        audio_bytes = await service._synthesize_with_edge_tts("Xin chao", slow=True)

    assert audio_bytes == fake_audio


@pytest.mark.asyncio
async def test_synthesize_with_edge_tts_maps_provider_failure():
    service = SpeechService()

    class FailingEdgeTtsModule:
        def Communicate(self, *args, **kwargs):
            raise RuntimeError("boom")

    with patch.object(SpeechService, "_edge_tts_module", return_value=FailingEdgeTtsModule()):
        with pytest.raises(SpeechServiceError) as exc_info:
            await service._synthesize_with_edge_tts("Xin chao", slow=False)

    assert exc_info.value.status_code == 503
