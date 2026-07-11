# TurTour — Tổng hợp dự án (dùng để làm slide)

## 1. Giới thiệu chung
- **Tên dự án:** TurTour
- **Loại:** Đồ án tốt nghiệp / chuyên đề tốt nghiệp (CĐTN)
- **Bài toán:** Số hóa quy trình tổ chức **tour tham quan doanh nghiệp** cho sinh viên đại học. Hiện tại quy trình đăng ký/xác nhận/thanh toán đang làm thủ công qua Google Form, Zalo, Facebook — rời rạc, khó theo dõi, khó thống kê.
- **Mục tiêu:** Xây dựng hệ thống tập trung quản lý toàn bộ vòng đời một tour: tạo tour → duyệt → công bố → sinh viên đăng ký → xác nhận → thanh toán → check-in tại doanh nghiệp → đánh giá sau tour.

## 2. Đối tượng người dùng (4 vai trò)
| Vai trò | Chức năng chính |
|---|---|
| **Sinh viên (Student)** | Tìm/xem tour, đăng ký tham gia, thanh toán, quét QR check-in, đánh giá sau tour |
| **Doanh nghiệp (Company)** | Cung cấp thông tin, phối hợp tổ chức tour tại đơn vị mình |
| **Đơn vị tổ chức (Organizator)** | Tạo và quản lý tour, lịch trình, duyệt đăng ký, xem thống kê |
| **Quản trị viên (Admin)** | Quản trị toàn hệ thống, duyệt tour, quản lý người dùng/doanh nghiệp |

## 3. Kiến trúc hệ thống
Mô hình **2 lớp tách biệt**, giao tiếp qua REST API + WebSocket (real-time):

```
Frontend (React SPA)  <-- REST API / SignalR -->  Backend (ASP.NET Core Web API)  <-->  PostgreSQL
```

- **Backend:** ASP.NET Core 8.0 Web API — kiến trúc phân lớp Controller → Repository/Service → EF Core → PostgreSQL.
- **Frontend:** React 18 + Vite, nền UI Material/Soft UI Dashboard + Tailwind CSS 4.
- **Realtime:** SignalR Hub (`/hubs`) cho thông báo tức thời (đăng ký, thanh toán, trạng thái tour).

## 4. Công nghệ sử dụng
- **Backend:** ASP.NET Core 8, Entity Framework Core 8 (code-first), Npgsql (PostgreSQL), JWT Bearer Authentication, BCrypt.Net (hash mật khẩu), SignalR, Swashbuckle/Swagger, QRCoder, AWSSDK.S3 (Cloudflare R2), MailKit + Resend (email).
- **Frontend:** React 18, Vite, Material UI / Soft UI Dashboard, Tailwind CSS 4, React-Leaflet (bản đồ), TinyMCE (rich text editor), html5-qrcode (quét QR), Chart.js (biểu đồ thống kê), Axios/SignalR client.
- **Database:** PostgreSQL, quản lý schema qua 26 migration EF Core.

## 5. Cơ sở dữ liệu — Entity chính
- `User`, `Role` / `UserRole` (quan hệ nhiều-nhiều phân quyền)
- `Company`, `Organizator`
- `Tour`, `TourSchedule` (lịch trình), `TourImage`, `TourInterest` (wishlist/quan tâm)
- `Registration` (đăng ký tham gia tour)
- `Payment`, `CheckIn`, `Feedback`, `Notification`, `Contact`

**Vòng đời trạng thái (state machine):**
`Tour`: chờ duyệt → được duyệt → công bố
`Registration`: đăng ký → chờ xử lý → xác nhận/từ chối → hoàn thành
`Payment`: chờ thanh toán → đã xác nhận

## 6. Tính năng nổi bật
- **Xác thực & tài khoản:** đăng ký riêng theo vai trò (student/company/organizator/admin), xác thực email (confirm/resend), quản lý hồ sơ cá nhân.
- **Quản lý tour:** CRUD tour, lịch trình, thư viện ảnh, đánh dấu quan tâm, bản đồ vị trí (Leaflet), mô tả rich text (TinyMCE).
- **Đăng ký tham gia:** đăng ký, danh sách chờ, duyệt/từ chối, thông báo thanh toán.
- **Thanh toán:** tích hợp cổng **SePay** qua webhook, xác nhận thanh toán, thống kê doanh thu.
- **Check-in bằng QR:** sinh mã QR (QRCoder) và quét QR xác nhận tham gia (html5-qrcode).
- **Đánh giá (Feedback):** thu thập phản hồi sinh viên sau tour.
- **Thông báo thời gian thực:** qua SignalR — cập nhật tức thì khi trạng thái tour/đăng ký/thanh toán thay đổi.
- **Dashboard thống kê:** biểu đồ (Chart.js) cho admin/organizator.
- **Phân quyền giao diện:** `RoleGate` — ẩn/hiện route và tính năng theo vai trò, có trang 403 (forbidden) riêng.

## 7. Bảo mật / Xác thực
- **JWT Bearer Token** cho REST API.
- Token truyền qua query string khi kết nối SignalR (do WebSocket không hỗ trợ header Authorization).
- Mật khẩu hash bằng **BCrypt**.
- **RBAC** 4 vai trò, kiểm soát ở cả backend (`[Authorize]`/policy) lẫn frontend (route guard).

## 8. Tích hợp bên thứ ba
| Dịch vụ | Mục đích |
|---|---|
| **Cloudflare R2** (S3-compatible) | Lưu trữ ảnh tour, minh chứng thanh toán |
| **Resend** + SMTP (Gmail/MailKit) | Gửi email xác thực tài khoản, thông báo |
| **SePay** | Cổng thanh toán/webhook chuyển khoản QR |
| **API địa chỉ hành chính VN** (tinhthanhpho.com) | Chọn tỉnh/thành, quận/huyện |
| **Leaflet** | Bản đồ vị trí tour |
| **TinyMCE** | Soạn thảo mô tả tour |

## 9. Tài liệu API
- Tích hợp sẵn **Swagger/OpenAPI** (Swashbuckle), bật ở môi trường Development, hỗ trợ nhập JWT để test trực tiếp.
- Có file `backend/TurTour.http` để test API thủ công (không có Postman collection riêng).

## 10. Gợi ý cấu trúc slide
1. Trang bìa
2. Đặt vấn đề — thực trạng quản lý tour thủ công
3. Mục tiêu & phạm vi đề tài
4. Đối tượng người dùng & vai trò
5. Kiến trúc hệ thống (sơ đồ Frontend–Backend–DB)
6. Công nghệ sử dụng
7. Mô hình dữ liệu (ERD rút gọn)
8. Quy trình nghiệp vụ (luồng: tạo tour → đăng ký → thanh toán → check-in → đánh giá)
9. Các tính năng nổi bật (demo/screenshot)
10. Bảo mật & phân quyền
11. Tích hợp bên thứ ba
12. Kết quả đạt được / Hướng phát triển
