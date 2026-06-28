# Speech MVP Free-First

MVP này dùng browser speech API để test miễn phí trước:

- STT: `SpeechRecognition`
- TTS: `speechSynthesis`

## Cấu hình

Tạo `frontend/.env.local` từ `frontend/.env.example` rồi giữ:

```env
NEXT_PUBLIC_SPEECH_MODE=browser
```

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Cách thử

### Chat

1. Vào trang học/chat.
2. Bấm `mic` để nói câu hỏi.
3. Transcript sẽ đổ vào ô nhập và không tự gửi.
4. Sửa câu nếu cần rồi bấm `send`.
5. Ở tin nhắn AI, bấm `loa` để nghe đọc.
6. Bấm `Đọc chậm` nếu muốn tốc độ chậm hơn.

### Practice

1. Vào `/practice`.
2. Mở một đề bất kỳ.
3. Bấm `Nghe câu hỏi`.
4. Bấm `Nói đáp án`.
5. Nói `A`, `B`, `C`, `D` hoặc `1`, `2`, `3`, `4`.
6. Kiểm tra transcript hiển thị và bấm `Xác nhận đáp án`.
7. Sau khi nộp bài, ở màn hình kết quả bấm `Nghe giải thích`.

## Trình duyệt khuyên dùng

- Chrome
- Edge

## Lưu ý

- Browser sẽ hỏi quyền micro ở lần đầu.
- Nếu máy không hỗ trợ speech browser API, UI sẽ hiện fallback an toàn.
- `server` mode chưa bật trong đợt này, nên muốn test ngay thì dùng `browser`.

## Test đã chạy

```bash
npx tsc --noEmit
npx vitest run src/__tests__/speech.test.ts src/__tests__/PracticeSpeech.test.tsx
```
