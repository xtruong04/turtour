# Backend – Hướng dẫn cài đặt & cấu hình

API viết bằng ASP.NET Core (.NET 8), dùng Entity Framework Core với PostgreSQL, xác thực JWT, realtime qua SignalR.

## 1. Yêu cầu

- .NET SDK 8.0
- PostgreSQL 14+ (local, Docker, hoặc dịch vụ managed)
- Công cụ `dotnet-ef` (cài nếu chưa có: `dotnet tool install --global dotnet-ef`)

## 2. Cấu hình

Copy file mẫu và điền giá trị thật (file `appsettings.json` bị `.gitignore`, không commit):

```bash
cd backend
cp appsettings.Example.json appsettings.json
```

Các mục cần điền trong `appsettings.json`:

| Mục | Ý nghĩa |
|---|---|
| `ConnectionStrings.DefaultConnection` | Chuỗi kết nối PostgreSQL, ví dụ: `Host=localhost;Port=5432;Database=turtourdb;Username=postgres;Password=xxx` |
| `Jwt.Key` | Chuỗi bí mật ký JWT, nên dài & ngẫu nhiên (>= 32 ký tự) |
| `Jwt.Issuer` / `Jwt.Audience` | Định danh issuer/audience cho token |
| `Jwt.ExpiresInMinutes` | Thời gian sống của access token |
| `Frontend.BaseUrl` | URL của frontend (dùng để build link trong email, redirect...) |
| `R2.*` | Thông tin Cloudflare R2 (tương thích S3) để lưu ảnh/tệp: `AccountId`, `AccessKey`, `SecretKey`, `BucketName`, `PublicBaseUrl` |
| `Smtp.*` | Cấu hình SMTP gửi email (mặc định ví dụ dùng Gmail SMTP) |
| `Sepay.ApiKey` | API key cổng thanh toán Sepay |
| `AllowedOrigins` | Danh sách origin frontend được phép gọi CORS, ví dụ `["http://localhost:5173"]` |

> Môi trường Development có thể dùng `appsettings.Development.json` (đã có sẵn, không commit giá trị nhạy cảm thật).

## 3. Cài đặt database

```bash
dotnet restore
dotnet ef database update
```

Lệnh này áp toàn bộ migrations trong thư mục `Migrations/` lên database đã cấu hình trong `ConnectionStrings.DefaultConnection`.

Nếu cần tạo migration mới sau khi sửa Model:

```bash
dotnet ef migrations add <TenMigration>
dotnet ef database update
```

## 4. Chạy ứng dụng

```bash
dotnet run
```

- API mặc định lắng nghe theo cấu hình trong `Properties/launchSettings.json` (thường `https://localhost:7186` và `http://localhost:5000`).
- Swagger UI: `/swagger` (chỉ bật ở môi trường Development).
- SignalR hub realtime tại `/hubs/...` (client lấy token qua query string `?access_token=` vì WebSocket không gửi được header Authorization).

Biến môi trường `PORT` (dùng khi deploy trên Railway/PaaS) sẽ ép Kestrel bind vào `http://0.0.0.0:$PORT` thay vì cấu hình mặc định.

## 5. Chạy bằng Docker

```bash
cd backend
docker build -t turtour-api .
docker run -p 8080:8080 --env-file .env turtour-api
```

Image build theo 2 stage: SDK để publish, ASP.NET runtime để chạy. Cần truyền cấu hình qua biến môi trường hoặc mount `appsettings.json` vào container.

## 6. Cấu trúc thư mục chính

```
backend/
├── Controllers/     API endpoints
├── Services/        Business logic
├── Repositories/    Truy cập dữ liệu
├── Models/          Entities & DTO liên quan model
├── DTOs/            Request/response DTO
├── Data/            DbContext
├── Migrations/       EF Core migrations
├── Hubs/            SignalR hubs (realtime)
├── Middleware/      Middleware tùy chỉnh
├── Helpers/         Hàm tiện ích dùng chung
└── Configurations/  Cấu hình khởi tạo (DI, options...)
```

## 7. Các vấn đề thường gặp

- **Lỗi kết nối PostgreSQL**: kiểm tra service Postgres đang chạy và `ConnectionStrings.DefaultConnection` đúng host/port/user/password.
- **401/JWT lỗi**: đảm bảo `Jwt.Key` giống nhau giữa các lần chạy nếu đã phát hành token trước đó (đổi key sẽ làm mọi token cũ vô hiệu).
- **CORS bị chặn**: thêm origin của frontend vào `AllowedOrigins` trong `appsettings.json`.
