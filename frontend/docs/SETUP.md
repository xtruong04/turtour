# Frontend – Hướng dẫn cài đặt & cấu hình

Ứng dụng web viết bằng React 18 + Vite, giao diện dựa trên Material UI (MUI) và Tailwind CSS.

## 1. Yêu cầu

- Node.js 18+ và npm

## 2. Cài đặt

```bash
cd frontend
npm install
```

## 3. Cấu hình biến môi trường

Tạo file `.env` (hoặc `.env.local`) ở thư mục `frontend/` — các file này đã bị `.gitignore`, không commit:

```bash
VITE_API_URL=https://localhost:7186/api
VITE_HUB_URL=https://localhost:7186/hubs
```

| Biến | Ý nghĩa |
|---|---|
| `VITE_API_URL` | Base URL của backend API (phải khớp với nơi backend đang chạy, xem [backend/docs/SETUP.md](../../backend/docs/SETUP.md)) |
| `VITE_HUB_URL` | Base URL của SignalR hub realtime |

Nếu không set, code sẽ fallback về `https://localhost:5000/api` (xem `src/services/apiService.js`, `src/services/realtime.js`).

> Lưu ý: các trang tĩnh trong `public/dewi` không đọc được `import.meta.env` (Vite không xử lý thư mục `public`). Vite plugin `dewi-env-config` trong `vite.config.js` tự sinh file `public/dewi/assets/js/env-config.js` chứa `window.TURTOUR_API_BASE` / `window.TURTOUR_HUB_URL` từ biến `.env` mỗi lần build/dev — không cần chỉnh tay.

## 4. Chạy dự án

```bash
npm run dev       # chạy dev server (mặc định http://localhost:5173)
npm run build     # build production vào thư mục dist/
npm run preview   # preview bản build production
npm run lint      # kiểm tra lỗi ESLint
```

## 5. Cấu trúc thư mục chính

```
frontend/
├── src/
│   ├── components/   Component dùng chung
│   ├── layouts/       Layout trang (dashboard, auth...)
│   ├── routes.jsx     Khai báo route
│   ├── context/       React context (auth, theme...)
│   ├── hooks/         Custom hooks
│   ├── services/      Gọi API, realtime (SignalR)
│   ├── utils/          Hàm tiện ích
│   └── examples/       Component mẫu (theo template Argon Dashboard MUI)
├── public/
│   └── dewi/          Trang tĩnh (landing page) không qua Vite build
└── vite.config.js
```

## 6. Triển khai (deploy)

Dự án có sẵn `vercel.json` cấu hình rewrite SPA (mọi route trả về `index.html`), phù hợp deploy lên Vercel. Khi deploy, khai báo `VITE_API_URL` và `VITE_HUB_URL` trong phần Environment Variables của nền tảng deploy trỏ tới backend đã public.

## 7. Các vấn đề thường gặp

- **Gọi API bị lỗi CORS**: kiểm tra backend đã thêm origin frontend vào `AllowedOrigins` trong `appsettings.json` chưa.
- **Không kết nối được SignalR**: kiểm tra `VITE_HUB_URL` đúng và backend đã bật middleware xác thực cho hub qua query string token.
- **Trang tĩnh `public/dewi` gọi sai API URL**: chạy lại `npm run dev`/`npm run build` để plugin `dewi-env-config` sinh lại file `env-config.js` theo `.env` hiện tại.
