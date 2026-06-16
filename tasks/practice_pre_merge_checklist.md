# Practice Pre-Merge Checklist

## Branch Discipline

- [x] Đang làm việc trên `feature-practice-production`
- [x] Chưa merge vào `dev`
- [ ] Không có thay đổi ngoài scope practice bị kéo theo

## Data Pipeline

- [x] Có snapshot thật `backend/data/practice/vi_grade_school_math_mcq_full.json`
- [x] Snapshot lấy từ Hugging Face, không phải seed mẫu
- [x] Curated manifest có đúng `10` ID mỗi lớp
- [x] Chạy validate pipeline và pass
- [ ] Import lên MongoDB thành công

## Backend Contract

- [ ] `GET /practice/grades` trả count active đúng
- [ ] `GET /practice/exams?grade=...` chỉ trả curated active set
- [ ] `GET /practice/attempts/in-progress?exam_id=...` hoạt động đúng
- [ ] `PATCH /practice/attempts/{attempt_id}/draft` lưu được answers + `updated_at`
- [ ] `POST /practice/attempts` xử lý đúng `create_new | resume_existing | restart`
- [ ] `POST /practice/attempts/{attempt_id}/submit` cho phép submit khi còn câu trống
- [ ] Attempt cũ vẫn xem lại được khi đề inactive

## Frontend UI

- [ ] `/practice` render đúng shell theo form UI
- [ ] Sidebar có chọn lớp, danh sách đề, lịch sử
- [ ] Card đề hiển thị đúng trạng thái `Chưa làm / Đang làm dở / Đã nộp gần đây`
- [ ] Mở đề mới được
- [ ] Có bài dở thì hiện modal `Tiếp tục / Làm lại`
- [ ] Autosave nháp hoạt động
- [ ] Confirm submit khi còn câu trống hoạt động
- [ ] Result screen render đầy đủ
- [ ] Mobile usable ở mức cơ bản

## Regression Checks

- [x] Không còn mojibake trên title/question/explanation hiển thị
- [ ] Không vỡ auth flow hiện có
- [ ] Không vỡ route `/practice`
- [ ] Không có thay đổi không cần thiết trong `Navbar`, chat UI, hoặc lesson flow

## Shared Files Risk Review

- [ ] `frontend/src/types.ts` chỉ thêm block practice tối thiểu
- [ ] `backend/src/api/__init__.py` chỉ thêm wiring cần thiết
- [ ] `backend/src/core/database.py` chỉ thêm indexes practice
- [ ] `backend/tests/conftest.py` chỉ thêm fixture cần cho practice

## Merge Readiness

- [ ] Rebase thử lên `origin/dev`
- [ ] Conflict notes đã được ghi lại nếu có
- [ ] Manual acceptance flow đã chạy xong
- [ ] Có thể mở PR draft mà không cần sửa nóng thêm

## Current Snapshot

- [x] Validator thật đã pass với `2733` rows, `590` exam clean, `50` exam active, `10` exam mỗi lớp
- [x] Draft manifest generator chạy được trên full snapshot
- [x] Unit test parser/curation pass: `pytest --noconftest -p no:cacheprovider tests/unit/test_practice_service.py`
- [ ] Integration API test chưa chạy được trong env hiện tại vì thiếu `mongomock_motor`
