# CHƯƠNG 2. PHÂN TÍCH, THIẾT KẾ VÀ XÂY DỰNG HỆ THỐNG

## 2.1. Phân tích yêu cầu nghiệp vụ

### 2.1.1. Xác định tác nhân (Actor)

Hệ thống TurTour có 4 nhóm tác nhân, tương ứng với 4 vai trò (Role) được lưu trong cơ sở dữ liệu và dùng để phân quyền theo cơ chế RBAC:

| Tác nhân | Vai trò (Role) | Mô tả |
|---|---|---|
| Sinh viên | `Student` | Người dùng cuối, xem và đăng ký tour, thanh toán, check-in, đánh giá |
| Doanh nghiệp | `Company` | Tạo và quản lý tour của chính doanh nghiệp mình, duyệt đăng ký, xác nhận thanh toán, quản lý tài khoản nhận tiền |
| Đơn vị tổ chức | `Organizator` | Tương tự Company nhưng đại diện cho đơn vị tổ chức (không gắn 1-1 với 1 doanh nghiệp cụ thể), có thể tạo tour và có quyền xem báo cáo toàn hệ thống ở một số chức năng (doanh thu, dashboard tổng quan) |
| Quản trị viên | `Admin` | Phê duyệt/từ chối tour, quản lý doanh nghiệp, xác nhận thanh toán, xem toàn bộ báo cáo hệ thống |

### 2.1.2. Danh sách use case theo tác nhân

**Sinh viên (Student):**
- Đăng ký tài khoản, xác thực email, đăng nhập/đăng xuất
- Xem danh sách tour đã công bố, xem chi tiết tour
- Đánh dấu "quan tâm" tour chưa mở đăng ký
- Đăng ký tham gia tour (trong khung giờ mở đăng ký)
- Hủy đăng ký
- Báo đã chuyển khoản, tải minh chứng thanh toán
- Nhận thông báo thời gian thực (tour được duyệt, đăng ký được xử lý, thanh toán được xác nhận)
- Đánh giá (feedback) tour sau khi hoàn thành tham gia

**Doanh nghiệp (Company) / Đơn vị tổ chức (Organizator):**
- Tạo, cập nhật, xóa tour (kèm lịch trình chi tiết – schedule, hình ảnh)
- Lưu trữ (archive) tour
- Xem danh sách đăng ký theo tour, duyệt/từ chối đăng ký
- Xác nhận thanh toán thủ công, sinh/làm mới mã QR check-in
- Quét mã QR để check-in người tham gia
- Đánh dấu hoàn thành tour (chuyển trạng thái Completed)
- Xem báo cáo, dashboard riêng của đối tác (Company quản lý thêm tài khoản ngân hàng nhận thanh toán)

**Quản trị viên (Admin):**
- Phê duyệt hoặc từ chối tour do doanh nghiệp/đơn vị tổ chức tạo
- Quản lý danh sách doanh nghiệp (CRUD, kích hoạt/ngưng hoạt động)
- Xác nhận thanh toán, xem doanh thu toàn hệ thống
- Xem dashboard và báo cáo tổng quan toàn hệ thống

### 2.1.3. Yêu cầu nghiệp vụ nổi bật cần xử lý trong thiết kế

- Một tour vừa có trạng thái **phê duyệt nội dung** (Approval) vừa có trạng thái **hiển thị công khai** (Publish), hai trạng thái này độc lập nhưng phụ thuộc lẫn nhau theo quy tắc nghiệp vụ.
- Một lượt đăng ký phải đi qua nhiều bước xác nhận (duyệt → thanh toán → check-in → hoàn thành), có nhánh từ chối/danh sách chờ tại mỗi bước.
- Khi tour đã đủ số lượng, đăng ký mới phải tự động vào **danh sách chờ (waitlist)**, và khi có người hủy, hệ thống phải tự động đẩy người đầu danh sách chờ lên trạng thái đã duyệt.
- Việc xác nhận thanh toán phải hỗ trợ cả thao tác thủ công (doanh nghiệp xác nhận) và tự động (webhook ngân hàng).

## 2.2. Mô hình hóa xử lý nghiệp vụ

### 2.2.1. Máy trạng thái của Tour (ApprovalStatus & PublishStatus)

Tour được kiểm soát bởi hai thuộc tính trạng thái độc lập:

- **ApprovalStatus**: `Pending → Approved | Rejected`
- **PublishStatus**: `Hidden → Published → Expired`, hoặc `* → Archived` (trạng thái kết thúc, không quay lại)

```
[Tạo tour bởi Company/Organizator]
        │
        ▼
ApprovalStatus = Pending, PublishStatus = Hidden
        │
        ├── Admin approve ──► ApprovalStatus = Approved
        │                       │
        │                       ├─ StartDate > hiện tại  → PublishStatus = Published
        │                       └─ StartDate ≤ hiện tại  → PublishStatus = Expired
        │
        └── Admin reject ───► ApprovalStatus = Rejected, PublishStatus = Hidden

[Khi đang Published]
        │
        └── EndDate < hiện tại (tự động, không cần hành động) → PublishStatus = Expired

[Company/Organizator sửa nội dung tour đã Approved]
        │
        └── Nếu thay đổi nội dung (tên, mô tả, địa điểm, phí, lịch trình...)
              → ApprovalStatus = Pending, PublishStatus = Hidden (phải duyệt lại)
            Nếu chỉ đổi ngày/sức chứa
              → giữ ApprovalStatus, tính lại PublishStatus

[Bất kỳ trạng thái nào]
        └── archive() → PublishStatus = Archived (trạng thái kết thúc)
```

Đặc điểm thiết kế quan trọng: **PublishStatus = Published/Expired không được lưu cứng mà được tính toán động** mỗi khi truy vấn (hàm `ComputeEffectivePublishStatus`), dựa trên so sánh thời gian hiện tại (quy đổi giờ Việt Nam, UTC+7) với `StartDate`/`EndDate` của tour. Cách thiết kế này tránh phải chạy một tiến trình nền (background job) để cập nhật trạng thái hết hạn, đơn giản hóa hệ thống.

### 2.2.2. Máy trạng thái của Registration (đăng ký tham gia)

```
                    ┌──────────┐
        ┌──────────►│ Pending  │
        │           └────┬─────┘
        │                │
   (đăng ký mới)     duyệt│        từ chối
   nếu còn chỗ            │             │
        │                ▼             ▼
        │           ┌─────────┐   ┌──────────┐
        │           │Approved │   │ Rejected │ (trạng thái kết thúc)
        │           └────┬────┘   └──────────┘
        │                │  ▲
   (đăng ký mới)          │  │ promote khi có chỗ trống
   nếu đã đầy chỗ         │  │ (người hủy/bị từ chối)
        │                │  │
        ▼                │  │
 ┌───────────────┐        │  │
 │ Waitinglisted │────────┘──┘
 └───────────────┘   (duyệt thủ công hoặc tự promote)
                                │
                          xác nhận thanh toán
                                ▼
                            ┌───────┐
                            │ Paid  │
                            └───┬───┘
                                │ quét mã QR check-in
                                ▼
                          ┌───────────┐
                          │ CheckedIn │
                          └─────┬─────┘
                                │ Company/Organizator đánh dấu hoàn thành
                                ▼
                          ┌───────────┐
                          │ Completed │  (chỉ sau đó mới được gửi Feedback)
                          └───────────┘
```

Các quy tắc nghiệp vụ chính được cài đặt tại tầng Controller:

- Khi duyệt một đăng ký `Pending`, hệ thống kiểm tra số lượng đăng ký đã `Approved/Paid/CheckedIn/Completed` của tour; nếu đã đạt `MaxParticipants` thì chuyển sang `Waitinglisted` thay vì `Approved`.
- Khi một đăng ký đang ở trạng thái `Approved`/`Paid` bị hủy (do sinh viên hủy hoặc bị từ chối), hệ thống tự động tìm đăng ký `Waitinglisted` cũ nhất (theo `RegistrationDate`) để đẩy lên `Approved`, đồng thời gửi thông báo cho người được đôn lên danh sách tham gia.
- Sinh viên chỉ được hủy khi đăng ký chưa ở trạng thái `CheckedIn`/`Completed`; nếu hủy lúc còn `Pending`/`Waitinglisted` thì xóa bản ghi, còn nếu đã `Approved`/`Paid` thì chuyển sang `Rejected` để lưu vết.
- Sinh viên chỉ được gửi **Feedback** khi đăng ký đã ở trạng thái `Completed`, đảm bảo chỉ người thực sự tham gia mới được đánh giá.

### 2.2.3. Quy trình thanh toán

Hệ thống hỗ trợ song song hai cơ chế xác nhận thanh toán:

1. **Xác nhận thủ công**: sinh viên chuyển khoản theo mã QR VietQR sinh từ thông tin ngân hàng của doanh nghiệp (`BankBin`, `BankAccountNo`), tải ảnh minh chứng lên hệ thống và bấm "báo đã thanh toán"; doanh nghiệp/đơn vị tổ chức (hoặc Admin) kiểm tra và xác nhận thủ công qua API xác nhận thanh toán.
2. **Xác nhận tự động qua webhook**: hệ thống tích hợp webhook của cổng thanh toán SePay; khi có giao dịch chuyển tiền vào đúng tài khoản với nội dung chuyển khoản chứa mã định danh đăng ký (8 ký tự đầu của `RegistrationId`) và số tiền lớn hơn hoặc bằng phí tour, hệ thống tự động đối soát và xác nhận thanh toán mà không cần con người can thiệp.

Khi thanh toán được xác nhận (bằng cả hai cách), đăng ký chuyển từ `Approved` sang `Paid`, và hệ thống sinh (hoặc làm mới) **mã QR check-in** gắn với đăng ký đó để phục vụ bước điểm danh tại sự kiện.

### 2.2.4. Quy trình điểm danh bằng mã QR

```
Company/Organizator → POST /check-ins/generate/{registrationId}
        → sinh mã QR (yêu cầu Registration ở trạng thái Approved hoặc Paid)

Tại sự kiện: nhân sự quét mã QR của người tham gia
        → POST /check-ins/scan { QrCode }
        → hệ thống xác thực mã, đối chiếu Registration tương ứng
        → Registration.Status: Paid → CheckedIn
        → CheckIn.IsCheckedIn = true, CheckedInAt = thời điểm quét
```

## 2.3. Thiết kế cơ sở dữ liệu

### 2.3.1. Lựa chọn hệ quản trị cơ sở dữ liệu

Hệ thống sử dụng **PostgreSQL**, truy cập qua Entity Framework Core (Npgsql provider), quản lý phiên bản schema bằng Code-First Migration. Tất cả các thực thể (entity) đều kế thừa từ `BaseEntity` với `Id` (kiểu `Guid`, khóa chính), `CreatedAt`, `UpdatedAt` để thống nhất việc theo dõi thời điểm tạo/sửa.

### 2.3.2. Mô hình thực thể – quan hệ (ERD)

Hệ thống gồm 14 thực thể chính, được nhóm theo 4 miền nghiệp vụ:

**Nhóm Người dùng & Phân quyền**
- `User` (1) — (N) `UserRole` (N) — (1) `Role`: quan hệ nhiều-nhiều giữa người dùng và vai trò, thông qua bảng trung gian `UserRole` với khóa duy nhất `(UserId, RoleId)`.

**Nhóm Đối tác tổ chức**
- `Company` (1) — (1) `User`: một tài khoản người dùng vai trò Company gắn với đúng một hồ sơ doanh nghiệp (`UserId` UNIQUE).
- `Organizator` (1) — (1) `User`: tương tự, dành cho vai trò Organizator.
- `Company` (1) — (N) `Tour`, `Organizator` (1) — (N) `Tour` (qua `CreatedBy`): một doanh nghiệp/đơn vị tổ chức có thể tạo nhiều tour.

**Nhóm Tour**
- `Tour` (1) — (N) `TourSchedule`: chi tiết lịch trình từng tour (xóa cascade khi xóa tour).
- `Tour` (1) — (N) `TourImage`: hình ảnh minh họa tour (xóa cascade khi xóa tour).
- `Tour` (1) — (N) `TourInterest` (N) — (1) `User`: sinh viên đánh dấu quan tâm tour, khóa duy nhất `(TourId, StudentId)`.

**Nhóm Đăng ký – Thanh toán – Điểm danh – Đánh giá**
- `Tour` (1) — (N) `Registration` (N) — (1) `User`: một sinh viên chỉ đăng ký một tour đúng một lần (khóa duy nhất `(TourId, StudentId)`).
- `Registration` (1) — (1) `Payment`: thông tin thanh toán gắn theo từng đăng ký (cascade khi xóa đăng ký).
- `Registration` (1) — (1) `CheckIn`: thông tin điểm danh gắn theo từng đăng ký (cascade khi xóa đăng ký).
- `Tour` (1) — (N) `Feedback` (N) — (1) `User`: một sinh viên chỉ đánh giá một tour đúng một lần (khóa duy nhất `(TourId, StudentId)`).
- `User` (1) — (N) `Notification`, tùy chọn liên kết tới `Tour` (`TourId` nullable) để điều hướng giao diện khi người dùng click vào thông báo.

**Bảng tổng hợp các ràng buộc khóa chính/khóa ngoại/duy nhất quan trọng:**

| Thực thể | Ràng buộc |
|---|---|
| User | `Email` UNIQUE |
| Role | `Name` UNIQUE |
| UserRole | `(UserId, RoleId)` UNIQUE |
| Company | `UserId` UNIQUE, FK→User (Restrict) |
| Organizator | `UserId` UNIQUE, `Name` UNIQUE, FK→User (Restrict) |
| Tour | FK→Company (Restrict), FK→User (CreatedBy) |
| TourSchedule, TourImage | FK→Tour (Cascade) |
| TourInterest | `(TourId, StudentId)` UNIQUE, FK→Tour (Cascade) |
| Registration | `(TourId, StudentId)` UNIQUE, FK→Tour (Cascade), FK→User (Restrict) |
| Payment, CheckIn | FK→Registration (Cascade), quan hệ 1–1 |
| Feedback | `(TourId, StudentId)` UNIQUE, FK→Tour (Cascade), FK→User (Restrict) |
| Notification | FK→User (Cascade), FK→Tour (nullable) |
| Tour.Fee, Payment.Amount | `decimal(18,2)` |

Việc dùng `OnDelete: Restrict` cho các quan hệ gắn với `User` (Company, Organizator, Registration, Feedback) nhằm ngăn việc xóa nhầm người dùng khi vẫn còn dữ liệu nghiệp vụ phụ thuộc, trong khi `OnDelete: Cascade` được dùng cho các dữ liệu phụ thuộc chặt vào Tour/Registration (lịch trình, ảnh, thanh toán, điểm danh) để tránh dữ liệu rác khi tour/đăng ký bị xóa.

### 2.3.3. Danh mục giá trị liệt kê (Enum)

| Enum | Giá trị | Ý nghĩa |
|---|---|---|
| `ApprovalStatus` | Draft, Pending, Approved, Rejected | Trạng thái phê duyệt nội dung tour |
| `PublishStatus` | Hidden, Published, Expired, Archived | Trạng thái hiển thị công khai của tour |
| `RegistrationStatus` | Pending, Approved, Rejected, Waitinglisted, Paid, CheckedIn, Completed | Trạng thái xử lý của một lượt đăng ký |
| `PaymentStatus` | Pending, Paid, Failed, Refunded | Trạng thái giao dịch thanh toán |

## 2.4. Kiến trúc hệ thống

### 2.4.1. Kiến trúc tổng thể

Hệ thống được xây dựng theo mô hình **client–server** với backend cung cấp REST API và giao tiếp thời gian thực qua SignalR, frontend gồm hai phần tách biệt theo mục đích sử dụng:

```
┌────────────────────────────┐      ┌────────────────────────────┐
│  React SPA (khu vực quản   │      │  Trang HTML tĩnh "dewi"     │
│  trị: Admin / Partner)     │      │  (landing page công khai)   │
│  - apiService.js (REST)    │      │  - notifications-badge.js   │
│  - realtime.js (SignalR)   │      │  - realtime.js              │
└──────────────┬─────────────┘      └──────────────┬──────────────┘
               │ HTTPS REST + WebSocket             │ HTTPS REST + WebSocket
               └───────────────┬─────────────────────┘
                                ▼
                  ┌───────────────────────────┐
                  │   ASP.NET Core 8 Web API  │
                  │ ┌───────────────────────┐ │
                  │ │ Controllers (10)      │ │  ← tiếp nhận request, kiểm tra [Authorize(Roles=...)]
                  │ ├───────────────────────┤ │
                  │ │ Services              │ │  ← JwtService, EmailService, R2StorageService,
                  │ │                       │ │     RealtimeNotifier, CheckInQrHelper
                  │ ├───────────────────────┤ │
                  │ │ Hubs/AppHub (SignalR) │ │  ← phát sự kiện realtime tới client
                  │ ├───────────────────────┤ │
                  │ │ ApplicationDbContext  │ │  ← EF Core, ánh xạ Entities ↔ bảng PostgreSQL
                  │ └───────────────────────┘ │
                  └─────────────┬──────────────┘
                                ▼
                      ┌───────────────────┐        ┌─────────────────────┐
                      │ PostgreSQL (DB)   │        │ Cloudflare R2 (S3)   │ ← lưu ảnh upload
                      └───────────────────┘        └─────────────────────┘
                                ▲
                      ┌───────────────────┐        ┌─────────────────────┐
                      │ SMTP (MailKit)    │        │ SePay Webhook        │ ← xác nhận thanh toán
                      └───────────────────┘        └─────────────────────┘
```

### 2.4.2. Kiến trúc backend

Backend tổ chức theo các thư mục chức năng rõ ràng, ánh xạ với mô hình phân lớp đã trình bày ở Chương 1:

- **Controllers/**: 10 controller (`AuthController`, `ToursController`, `RegistrationsController`, `PaymentsController`, `CheckInsController`, `FeedbacksController`, `CompaniesController`, `DashboardController`, `UploadsController`, `NotificationsController`) — tiếp nhận HTTP request, xác thực quyền qua `[Authorize(Roles = "...")]`, gọi xuống DbContext/Services và trả về DTO.
- **Services/**: chứa nghiệp vụ kỹ thuật dùng lại nhiều nơi — `JwtService` (sinh/giải mã JWT), `EmailService` (gửi email qua SMTP bằng MailKit), `R2StorageService` (upload file lên Cloudflare R2 tương thích S3), `RealtimeNotifier` (gửi sự kiện qua SignalR đến người dùng/đơn vị tổ chức/admin).
- **Hubs/AppHub**: SignalR hub, là điểm kết nối WebSocket giữa client và server để đẩy thông báo thời gian thực.
- **Models/Entities, Models/Enums, Models/Base**: định nghĩa cấu trúc dữ liệu nghiệp vụ.
- **DTOs/**: tách biệt theo từng nhóm nghiệp vụ (`Auth`, `Tour`, `Company`, `Registration`, `Payment`, `Feedback`, `CheckIn`), đảm bảo dữ liệu trả ra client không lộ trực tiếp cấu trúc entity nội bộ (ví dụ không trả `PasswordHash`).
- **Helpers/**: các hàm hỗ trợ tái sử dụng như `CurrentUserHelper` (lấy thông tin người dùng hiện tại từ JWT claims) và `CheckInQrHelper` (sinh/làm mới mã QR check-in).
- **Data/ApplicationDbContext**: cấu hình quan hệ, ràng buộc, chỉ mục duy nhất thông qua Fluent API trong `OnModelCreating`.

Một điểm thiết kế kỹ thuật đáng chú ý là việc xử lý thời gian: do dữ liệu thời gian (`StartDate`, `EndDate`, `BookingOpenAt/CloseAt`) được frontend gửi lên dưới dạng giờ địa phương Việt Nam mà không quy đổi UTC, backend định nghĩa hằng số `VietnamNow = DateTime.UtcNow.AddHours(7)` để đảm bảo nhất quán khi so sánh thời gian phía server, tránh sai lệch 7 giờ giữa giờ hệ thống và giờ nhập liệu.

### 2.4.3. Kiến trúc frontend

Frontend gồm hai phần phục vụ hai mục đích khác nhau:

1. **React SPA** (thư mục `frontend/src/`): khu vực quản trị/vận hành dành cho Admin và Partner (Company/Organizator), xây dựng trên React 18 + Vite, sử dụng bộ giao diện Material UI (nền Soft UI Dashboard). Cấu trúc chính:
   - `routes.jsx`: khai báo toàn bộ route, mỗi route gắn `roles: [...]` để kiểm soát truy cập theo vai trò ở tầng client (kết hợp với việc backend luôn kiểm tra lại quyền ở tầng API).
   - `layouts/`: các trang nghiệp vụ, tách theo khu vực — `layouts/tours/` (tours, create, edit, delete, details, registrations, pending-approval) dùng chung cho cả Admin và Partner; `layouts/partner/` (dashboard, reports, payment-settings) dành riêng cho đối tác; `layouts/authentication/` (sign-in, sign-up, confirm-email).
   - `services/apiService.js`: lớp giao tiếp HTTP duy nhất với backend, chuẩn hóa dữ liệu trả về (các hàm `normalizeTour`, `normalizeRegistration`...).
   - `services/realtime.js`: thiết lập kết nối SignalR, lắng nghe các sự kiện `onNotification`, `onTourUpdated`, `onAdminBoardUpdated` để cập nhật giao diện theo thời gian thực không cần tải lại trang.

2. **Trang HTML tĩnh "dewi"** (thư mục `frontend/public/dewi/`): landing page công khai (giới thiệu hệ thống, danh sách tour, chi tiết tour, hồ sơ, thông báo) phục vụ người dùng truy cập trực tiếp hoặc chưa đăng nhập, vẫn có thể gọi cùng REST API và kết nối SignalR (`notifications-badge.js`, `realtime.js`) để hiển thị thông báo thời gian thực.

## 2.5. Thiết kế giao diện

Giao diện hệ thống được thiết kế theo nguyên tắc phân tách rõ giữa khu vực **công khai** (landing, xem tour, đăng ký/đăng nhập) và khu vực **quản trị/vận hành** (dashboard, quản lý tour, đăng ký, thanh toán, báo cáo):

- **Khu vực công khai**: trang chủ giới thiệu hệ thống, danh sách tour công bố, trang chi tiết tour (lịch trình, hình ảnh, điều kiện đăng ký), trang hồ sơ cá nhân và thông báo của người dùng đã đăng nhập.
- **Khu vực Admin** (`/admin/...`): dashboard tổng quan hệ thống, danh sách tour kèm khu vực riêng cho "tour chờ duyệt", quản lý doanh nghiệp, danh sách thanh toán toàn hệ thống, báo cáo thống kê.
- **Khu vực Partner** (`/partner/...`, dùng chung cho Company và Organizator): dashboard riêng của đối tác (chỉ số liệu liên quan tour của họ), quản lý tour của mình (tạo/sửa/xóa/xem đăng ký), báo cáo riêng, và trang cấu hình tài khoản nhận thanh toán (`payment-settings`, chỉ Company vì Organizator không gắn tài khoản ngân hàng nhận tiền).
- **Khu vực xác thực** (`/auth/...`): đăng nhập, đăng ký (có phân biệt đăng ký Student/Company/Organizator), xác thực email.

Việc bảo vệ route theo vai trò được thực hiện ở tầng client (route khai báo `roles` tương ứng) kết hợp kiểm tra quyền chặt ở tầng server thông qua `[Authorize(Roles = "...")]` trên từng action — đảm bảo dù người dùng truy cập trực tiếp một URL không thuộc quyền, dữ liệu nhạy cảm vẫn không bị lộ vì API sẽ từ chối yêu cầu.

## 2.6. Xây dựng các chức năng chính

### 2.6.1. Quản lý người dùng và xác thực

Chức năng đăng ký được tách thành ba luồng riêng theo vai trò đăng ký (`/api/auth/register`, `/register-company`, `/register-organizator`), vì mỗi vai trò cần thu thập thông tin hồ sơ khác nhau (Company cần địa chỉ, ngành nghề, tài khoản ngân hàng; Organizator cần tên đơn vị duy nhất). Sau khi đăng ký, hệ thống sinh token xác thực email (hết hạn sau 24 giờ) và gửi email xác nhận qua MailKit; người dùng phải xác thực email trước khi đăng nhập đầy đủ chức năng. Đăng nhập sử dụng JWT Bearer Token, token mang theo claim vai trò để backend kiểm tra quyền trên mọi action mà không cần lưu session.

### 2.6.2. Quản lý doanh nghiệp đối tác

Admin quản lý danh sách doanh nghiệp (CRUD), trong đó việc xóa được thiết kế an toàn: nếu doanh nghiệp chưa có tour nào, hệ thống xóa hẳn; nếu đã có tour, hệ thống chỉ chuyển `IsActive = false` (ngưng hoạt động) để giữ nguyên vẹn dữ liệu lịch sử các tour đã tổ chức. Doanh nghiệp tự quản lý hồ sơ của mình qua endpoint `/companies/me`, bao gồm cấu hình tài khoản ngân hàng nhận thanh toán (`BankBin`, `BankAccountNo`, `BankAccountName`) dùng để sinh mã QR VietQR khi sinh viên thanh toán phí tour.

### 2.6.3. Quản lý tour tham quan

Đây là chức năng trung tâm của hệ thống, hiện thực hóa máy trạng thái đã trình bày ở mục 2.2.1. Khi tạo/sửa tour, hệ thống phân biệt rõ "thay đổi nội dung" (tên, mô tả, địa điểm, phí, lịch trình, ảnh — bắt buộc duyệt lại) và "thay đổi không ảnh hưởng nội dung" (ngày tổ chức, sức chứa — chỉ cần tính lại trạng thái hiển thị), tránh việc đối tác phải chờ Admin duyệt lại không cần thiết với các chỉnh sửa nhỏ. Tour có thể có nhiều lịch trình con (`TourSchedule`, có `OrderIndex` để sắp xếp) và nhiều hình ảnh (`TourImage`, có cờ `Isthumbnail` xác định ảnh đại diện).

### 2.6.4. Đăng ký tham gia và xét duyệt

Chức năng đăng ký hiện thực đầy đủ máy trạng thái mục 2.2.2, với điểm nhấn kỹ thuật là cơ chế **danh sách chờ tự động** (waitlist): số lượng `Approved/Paid/CheckedIn/Completed` được tính động để so với `MaxParticipants` mỗi khi có hành động duyệt hoặc đăng ký mới, và khi có chỗ trống (do hủy hoặc bị từ chối), hệ thống tự tìm người đợi lâu nhất trong danh sách chờ để đôn lên `Approved`, đồng thời gửi thông báo thời gian thực cho người được đôn — giảm thiểu việc đối tác phải theo dõi và xử lý thủ công danh sách chờ.

### 2.6.5. Quản lý thanh toán

Chức năng thanh toán được thiết kế hỗ trợ song song xác nhận thủ công và xác nhận tự động (mục 2.2.3). Với xác nhận tự động, hệ thống đối soát giao dịch dựa trên nội dung chuyển khoản (chứa mã định danh rút gọn của đăng ký) và số tiền chuyển khoản, giảm phụ thuộc vào việc đối tác phải kiểm tra sao kê thủ công như trong hiện trạng đã khảo sát ở Chương 1.

### 2.6.6. Điểm danh bằng mã QR

Khi một đăng ký được xác nhận thanh toán, hệ thống tự động sinh mã QR gắn với đăng ký đó (entity `CheckIn`). Tại sự kiện, đối tác sử dụng chức năng quét mã (tích hợp thư viện quét QR ở frontend) gọi API xác thực mã và cập nhật trạng thái `CheckedIn` ngay lập tức — thay thế hoàn toàn cách điểm danh thủ công bằng gọi tên/ký giấy đã nêu trong khảo sát hiện trạng.

### 2.6.7. Đánh giá tour và thống kê báo cáo

Sinh viên chỉ được gửi đánh giá (rating 1–5 kèm bình luận) sau khi đăng ký đã chuyển sang trạng thái `Completed`, đảm bảo dữ liệu đánh giá phản ánh đúng người đã thực sự tham gia. Dữ liệu đánh giá được tổng hợp theo tour (điểm trung bình) phục vụ chức năng thống kê. Chức năng dashboard/báo cáo (`DashboardController`) cung cấp số liệu tổng quan (số tour, số sinh viên, số đăng ký, số tour hoàn thành, doanh thu, danh sách doanh nghiệp nổi bật) ở hai cấp độ: toàn hệ thống (dành cho Admin/Organizator) và riêng theo đối tác (dành cho Company/Organizator quản lý tour của mình) — giải quyết trực tiếp hạn chế "báo cáo thủ công, phân tán" đã khảo sát ở Chương 1.

### 2.6.8. Thông báo thời gian thực

Mọi thay đổi trạng thái quan trọng (tour được duyệt/từ chối, đăng ký được duyệt/từ chối/đôn từ danh sách chờ, thanh toán được xác nhận) đều được phát đi qua `RealtimeNotifier` tới đúng người dùng liên quan thông qua SignalR, đồng thời lưu lại thành bản ghi `Notification` (có cờ `IsRead`, liên kết tới `Tour` nếu có để điều hướng) để người dùng xem lại lịch sử thông báo ngay cả khi không online vào thời điểm sự kiện xảy ra.

## 2.7. Kết luận chương

Chương này đã trình bày quá trình phân tích yêu cầu nghiệp vụ theo từng vai trò người dùng, mô hình hóa các máy trạng thái cốt lõi của hệ thống (Tour và Registration), thiết kế cơ sở dữ liệu quan hệ với 14 thực thể và các ràng buộc đảm bảo tính toàn vẹn dữ liệu, cùng kiến trúc tổng thể phân lớp rõ ràng giữa backend ASP.NET Core và hai phần frontend phục vụ hai mục đích khác nhau. Trên cơ sở thiết kế đó, các chức năng chính của hệ thống — quản lý tour, đăng ký, thanh toán, điểm danh, đánh giá và báo cáo — đã được xây dựng nhằm giải quyết trực tiếp các hạn chế của phương pháp quản lý thủ công đã khảo sát ở Chương 1. Kết quả triển khai và đánh giá hệ thống sẽ được trình bày ở chương tiếp theo.
