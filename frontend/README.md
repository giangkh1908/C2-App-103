# Frontend — Visual Math AI

Frontend Next.js cho ứng dụng Visual Math AI.

## Yêu cầu

- **Node.js** >= 18

## Biến môi trường

Tạo file `.env.local` từ template:

```env
# ── FastAPI Backend (client-side) ──
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api/v1

# ── Google OAuth (Client ID for frontend SDK) ──
# Cùng giá trị với GOOGLE_CLIENT_ID bên backend
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# ── App Config ──
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Toán Trực Quan AI
```

## Cài đặt & chạy

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Dev server (Webpack, port 3000) |
| `npm run build` | Build production |
| `npm start` | Chạy production build |
| `npm run lint` | Kiểm tra ESLint |

## Cấu trúc

```
src/
├── app/[locale]/    # Pages theo locale (vi, en)
├── components/      # React components
├── i18n/            # next-intl config
├── messages/        # File dịch (en.json, vi.json)
└── middleware.ts    # Locale redirect
```
