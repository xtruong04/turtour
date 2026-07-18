# TurTour

Nền tảng quản lý & đặt tour du lịch: backend API bằng ASP.NET Core (.NET 8) + PostgreSQL, frontend bằng React (Vite) + Material UI.

## Cấu trúc dự án

```
TurTour/
├── backend/        API ASP.NET Core (.NET 8, EF Core, PostgreSQL, SignalR)
│   └── docs/
│       └── SETUP.md
├── frontend/       Ứng dụng React (Vite, MUI, Tailwind)
│   └── docs/
│       └── SETUP.md
└── README.md       (file này)
```

## Yêu cầu hệ thống

- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) và npm
- PostgreSQL 14+ (local hoặc container)
- (Tùy chọn) Docker, nếu muốn chạy backend bằng container

## Chạy nhanh (quickstart)

Mở hai terminal riêng cho backend và frontend.

### 1. Backend (API)

```bash
cd backend
cp appsettings.Example.json appsettings.json
# Sửa appsettings.json: chuỗi kết nối PostgreSQL, JWT key, v.v.
dotnet restore
dotnet ef database update   # tạo database theo Migrations
dotnet run
```

Mặc định API chạy tại `https://localhost:7186` (hoặc `http://localhost:5000`, tùy `launchSettings.json`). Swagger UI có ở `/swagger` khi chạy ở môi trường Development.

Chi tiết cấu hình đầy đủ (JWT, R2/S3, SMTP, Sepay...): xem [backend/docs/SETUP.md](backend/docs/SETUP.md).

### 2. Frontend (Web app)

```bash
cd frontend
npm install
cp .env.example .env   # tạo nếu chưa có, xem frontend/docs/SETUP.md
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173` mặc định (Vite).

Chi tiết: xem [frontend/docs/SETUP.md](frontend/docs/SETUP.md).

## Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| [backend/docs/SETUP.md](backend/docs/SETUP.md) | Cài đặt & cấu hình backend: database, JWT, storage (R2/S3), email, thanh toán Sepay, chạy migration, Docker |
| [frontend/docs/SETUP.md](frontend/docs/SETUP.md) | Cài đặt & cấu hình frontend: biến môi trường, scripts, cấu trúc thư mục |
| [docs/HUONG_DAN_SU_DUNG.md](docs/HUONG_DAN_SU_DUNG.md) | Hướng dẫn sử dụng & luồng chức năng: vai trò người dùng, đăng ký/đăng nhập, đặt tour, thanh toán, check-in, duyệt tour, báo cáo |

## Công nghệ sử dụng

**Backend:** ASP.NET Core 8, Entity Framework Core (Npgsql/PostgreSQL), JWT Authentication, SignalR (realtime), AWS S3 SDK (tương thích Cloudflare R2), MailKit/Resend (email), QRCoder, BCrypt.

**Frontend:** React 18, Vite, Material UI (MUI), Tailwind CSS, React Router, Chart.js, Leaflet (bản đồ), TinyMCE (rich text), SignalR client.

## Đóng góp

Xem `.github/` để biết quy ước PR/issue nếu có. Nhánh chính để tạo PR: `main`.
