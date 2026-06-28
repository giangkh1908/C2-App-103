# Cost Report — Ước tính chi phí LLM / user / tháng

## 1. Model & Pricing

**Model hiện tại:** `deepseek/deepseek-v4-flash` (OpenRouter)

| Loại | Giá / 1M tokens (USD) |
|------|----------------------|
| Prompt tokens | $0.09 |
| Completion tokens | $0.18 |

## 2. Chi phí trung bình một request

Từ baseline metric (đo ngày 2026-06-01, n=50 requests):

| Metric | Giá trị |
|--------|---------|
| Cost trung bình / request | **$0.000042** |
| Prompt tokens / request ~ | ~500 |
| Completion tokens / request ~ | ~200 |
| Tokens / request ~ | ~700 |

## 3. Kịch bản sử dụng theo gói

### Free (10 chat turns / ngày, giới hạn rolling 24h)

| Kịch bản | Turns/tháng | Cost/user/tháng |
|----------|-------------|-----------------|
| Dùng tối đa (10 turns/ngày × 30 ngày) | 300 | **$0.0126** |
| Dùng trung bình ~3 turns/ngày | 90 | **$0.0038** |

### Plus (unlimited — 49.000 VND/tháng ~ $2)

| Kịch bản | Turns/tháng | Cost/user/tháng | Gross margin |
|----------|-------------|-----------------|--------------|
| Nhẹ (~10 turns/ngày) | 300 | $0.0126 | **~99.4%** |
| Trung bình (~30 turns/ngày) | 900 | $0.0378 | **~98.1%** |
| Nặng (~100 turns/ngày) | 3000 | $0.126 | **~93.7%** |
| Rất nặng (~300 turns/ngày) | 9000 | $0.378 | **~81.1%** |

### Premium (unlimited — 99.000 VND/tháng ~ $4)

| Kịch bản | Turns/tháng | Cost/user/tháng | Gross margin |
|----------|-------------|-----------------|--------------|
| Trung bình (~30 turns/ngày) | 900 | $0.0378 | **~99.1%** |
| Nặng (~100 turns/ngày) | 3000 | $0.126 | **~96.9%** |
| Rất nặng (~300 turns/ngày) | 9000 | $0.378 | **~90.6%** |
| Siêu nặng (~30k tokens/turn, 100 turns/ngày) | 3000 | ~$1.50 | **~62.5%** |

## 4. Chi phí vận hành theo số lượng user

| Users | Phân bổ gói | Cost LLM/tháng | Doanh thu/tháng |
|-------|-------------|----------------|-----------------|
| 100 | 80% Free, 15% Plus, 5% Premium | ~$1.5 | ~$50 |
| 1.000 | 80% Free, 15% Plus, 5% Premium | ~$15 | ~$500 |
| 10.000 | 80% Free, 15% Plus, 5% Premium | ~$150 | ~$5.000 |
| 100.000 | 80% Free, 15% Plus, 5% Premium | ~$1.500 | ~$50.000 |

> **Giả định:** Free user dùng ~5 turns/ngày, Plus ~20 turns/ngày, Premium ~50 turns/ngày.

## 5. Dự phòng cho các chi phí khác

| Hạng mục | Ước tính |
|----------|----------|
| OpenRouter margin (~10-15% trên API cost) | +15% |
| TTS/STT (nếu dùng API ngoài) | +$0.001-0.01 / request |
| Hosting (Railway) | ~$5-20 / tháng |
| MongoDB Atlas (serverless) | ~$0-10 / tháng |

## 6. Kết luận

- **Cost LLP cực kỳ thấp** nhờ deepseek-v4-flash ($0.000042/request)
- **Gross margin > 90%** ở mọi kịch bản usage hợp lý
- **Rủi ro** chỉ xảy ra nếu user abuse (hàng nghìn turns/ngày) — lúc đó cần rate limit hoặc cap
- **Đề xuất:** Giữ nguyên pricing hiện tại, không cần tăng giá

---

*Cập nhật lần cuối: 2026-06-28 — Model: deepseek/deepseek-v4-flash*
