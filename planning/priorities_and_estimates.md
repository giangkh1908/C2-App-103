# Priorities And Estimates

## Mục tiêu

Tài liệu này chuẩn hóa cách dùng `priority` và `estimate` trong toàn bộ `planning/` và `tasks/` để nhóm 3 người có cùng cách đọc backlog.

## Priority framework

### P0

`P0` là đầu việc bắt buộc để MVP chạy end-to-end.

Ví dụ:

- auth cơ bản
- topic list
- `/lessons/generate`
- visual rendering
- `/practice/submit`
- progress persistence
- deploy FE/BE

### P1

`P1` là đầu việc quan trọng để MVP usable, ổn định và demo tốt hơn, nhưng không phải luôn là blocker tuyệt đối cho skeleton đầu tiên.

Ví dụ:

- TTS trigger
- retry-safe AI flow
- progress view
- demo readiness checklist

### P2

`P2` là phần nice-to-have trong phạm vi MVP, chỉ nên làm khi toàn bộ `P0` và phần lớn `P1` đã ổn.

Planning hiện tại hạn chế tối đa `P2` để tránh feature creep.

## Estimate framework

### S

- nhỏ
- ít phụ thuộc
- thường do một owner làm độc lập được

### M

- vừa
- có 1-2 dependency
- có thể cần phối hợp ngắn giữa 2 vai trò

### L

- phức tạp hơn
- thường cắt qua nhiều layer FE/BE/AI
- cần sequencing rõ

### XL

- quá lớn cho một task triển khai
- phải được tách tiếp trong `tasks/`

## Cách dùng với team 3 người

- Backlog item hoặc user story thường ở mức `M/L`
- Task triển khai nên ưu tiên giữ ở `S/M`
- Nếu một task chạm mức `XL`, phải tách nhỏ theo subsystem, API boundary hoặc done criteria

## Quy tắc ra quyết định

- Ưu tiên công việc mở đường trước công việc polish
- Không ưu tiên visual polish trước shared contracts, auth và API foundation
- Không ước lượng theo giờ/ngày để tránh tạo cảm giác chính xác giả
- Khi có nghi ngờ giữa `P0` và `P1`, ưu tiên tự hỏi: bỏ phần này đi thì MVP có chạy full flow được không?

## Anti-pattern cần tránh

- Gắn `P0` cho mọi việc
- Dùng `XL` nhưng không tách task
- Ước lượng task chưa có done criteria
- Ưu tiên feature mới trong Sprint 3 thay vì hardening và deploy

---

## Thực tế triển khai

### P0 — Kết quả
Tất cả P0 đã hoàn thành ✅:
- auth cơ bản: ✅ register, login, JWT, Google OAuth, refresh token, forgot/reset, email verification
- topic list: ✅ 4 topics
- `/lessons/generate`: ✅ với guardrails và fallback
- visual rendering: ✅ Visual Card + 5 simulation types
- `/practice/submit`: ✅ với scoring và retry hint
- progress persistence: ✅ topics_learned, correct/incorrect
- deploy: ✅ Railway (thay vì Vercel/VPS như kế hoạch)

### P1 — Kết quả
- TTS trigger: ⬜ chưa implement
- retry-safe AI flow: ✅ đã làm (fallback + error handling)
- progress view: ✅ PracticeResultView hiển thị
- demo readiness: ⬜ chưa có script

### P2 — Thực tế
Không có P2 nào được làm trong MVP. P2 hiện tại bao gồm:
- Error state audit: ⬜ cần làm
- Mobile responsiveness audit: 🔶 cơ bản có, chưa tối ưu

### XL task — Thực tế
`BL-303 Domain simulations` và `BL-202 /lessons/generate` không còn XL nữa — cả hai đều đã hoàn thành trong Sprint 2.

### Estimate — Thực tế
Ước lượng trong backlog khớp với thực tế:
- S/M task: đúng sizing
- L task (AI adapter, `/lessons/generate`): đúng phức tạp
- Không có task nào vượt XL trong thực tế

### Số lượng task thực tế
| Sprint | Kế hoạch | Thực tế |
|--------|---------|---------|
| Sprint 1 | 13 | 13 ✅ |
| Sprint 2 | 14 | 14 ✅ |
| Sprint 3 | 12 | 9 ✅ + 3 ⬜ |
