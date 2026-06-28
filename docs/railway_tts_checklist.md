# Railway TTS Checklist

Use this checklist after merging `main` or changing deploy settings to keep production TTS on `edge-tts` with `vi-VN-HoaiMyNeural`.

## Frontend build-time variables

Railway must provide these values before the frontend build starts:

- `NEXT_PUBLIC_TTS_MODE=server`
- `NEXT_PUBLIC_BACKEND_URL=https://<your-backend-domain>/api/v1`

`NEXT_PUBLIC_*` values are baked into the Next.js build. Updating them only at runtime is not enough.

## Backend runtime variables

Railway backend service must set:

- `TTS_PROVIDER=edge_tts`
- `TTS_PROVIDER_MODE=edge_tts_only`
- `TTS_MODEL=edge-tts`
- `TTS_VOICE=vi-VN-HoaiMyNeural`
- `TTS_RESPONSE_FORMAT=mp3`

## Post-deploy checks

1. Open chat or practice and click the read-aloud button.
2. Confirm the browser sends `POST /api/v1/speech/tts`.
3. Confirm backend logs contain:
   - `tts_synthesized`
   - `provider=edge_tts`
   - `voice=vi-VN-HoaiMyNeural`
4. Confirm backend logs also contain `tts_response_ready`.

If you hear audio but do not see `/speech/tts` requests or the backend logs above, the frontend is still using browser TTS instead of Hoai My.
