# Speech Eval Plan for G1-G2

## Current baseline
- `STT`: browser-native Web Speech API on the frontend
- `TTS`: server-side `POST /api/v1/speech/tts`
- `TTS voice`: `edge-tts` with `vi-VN-HoaiMyNeural`
- `Eval workbench`: authenticated page at `/[locale]/speech-eval`

## Metrics

### STT
- `recognition_success_rate`: microphone sessions that return a non-empty transcript
- `math_intent_preservation`: transcript still preserves the math concept after normalization
- `choice_mapping_accuracy`: spoken `A/B/C/D` mapped correctly in practice-style prompts
- `latency_ms`: time from mic start to transcript result

### TTS
- `synthesis_success_rate`: requests that return playable audio
- `audio_readiness_latency_ms`: request-to-playback timing, captured by frontend/backend telemetry
- `intelligibility`: manual score 1-5
- `pronunciation_fidelity`: manual score 1-5 for numbers, operators, and units
- `kid_friendly_score`: manual score 1-5 for classroom suitability

## Dataset
- `chat math prompts`: comparison, place value, addition, time, measurement
- `practice choice prompts`: `Đáp án B`, `Chọn phương án C`, similar variants
- `edge prompts`: short utterances, fast speech, mild noise, mixed-language phrasing
- The canonical dataset is embedded in `frontend/src/lib/speechEval.ts`

## How to run
1. Start the app normally with the current speech baseline.
2. Log in and open `/vi/speech-eval` or `/en/speech-eval`.
3. Run all STT benchmark cases.
4. Run all TTS benchmark cases in both normal and slow modes.
5. Save TTS ratings after listening.
6. Click `Export JSON` to produce a local evidence file.

## Evidence checklist
- Exported JSON from the eval workbench
- Browser console logs with `[speech-eval]`
- Backend logs showing `tts_synthesized` and `tts_response_ready`
- Manual notes for top recurring STT/TTS issues

## Acceptance baseline
- STT should be usable after light edit for core G1-G2 prompts
- Practice choice mapping should be near-perfect for `A/B/C/D`
- TTS should remain on Hoai My voice and produce stable audio
- Chat and practice flows should still work with speech enabled
