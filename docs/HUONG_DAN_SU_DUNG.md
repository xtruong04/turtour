# TurTour – Hướng dẫn sử dụng & luồng chức năng

Tài liệu này mô tả các vai trò người dùng trong hệ thống TurTour và luồng nghiệp vụ của từng chức năng, dùng làm tài liệu tham chiếu khi vận hành, kiểm thử hoặc giới thiệu sản phẩm. Về cài đặt/cấu hình kỹ thuật, xem [backend/docs/README.md](../backend/docs/README.md) và [frontend/docs/SETUP.md](../frontend/docs/SETUP.md).

## 1. Tổng quan hệ thống

TurTour là nền tảng quản lý & đặt tour du lịch/dã ngoại gồm hai phần:

- **Trang công khai** (`frontend/public/dewi/*.html`) – nơi khách/sinh viên tìm, xem và đăng ký tour. Đây là các trang tĩnh, không qua React Router, gọi thẳng API bằng `window.TURTOUR_API_BASE`.
- **Khu vực quản trị** (`frontend/src` – SPA React, route theo `/admin/...` và `/partner/...`) – nơi Admin và Doanh nghiệp/Tổ chức quản lý tour, đăng ký, thanh toán, báo cáo.

Backend là một API dùng chung cho cả hai (ASP.NET Core), xác thực bằng JWT, có kênh realtime qua SignalR để đẩy thông báo tức thời (đăng ký mới, duyệt tour, xác nhận thanh toán...).

## 2. Vai trò người dùng (roles)

| Role (hệ thống) | Gọi trong UI | Mô tả |
|---|---|---|
| `Student` | Khách / Sinh viên | Người dùng cuối: tìm tour, đăng ký, thanh toán, check-in, đánh giá. Đăng ký tự do qua `/auth/register`. |
| `Company` | Doanh nghiệp | Đối tác tổ chức tour dạng công ty. Có thêm hồ sơ doanh nghiệp, tài khoản ngân hàng nhận thanh toán, chỉ quản lý được tour/đăng ký/thanh toán **của chính công ty mình**. |
| `Organizator` | Tổ chức/Đơn vị tổ chức | Đối tác tổ chức tour dạng tổ chức (không phải công ty pháp nhân). Không bị giới hạn theo công ty khi thao tác trên đăng ký/thanh toán (khác `Company`). |
| `Admin` | Quản trị viên | Duyệt/từ chối tour, quản lý doanh nghiệp, xem toàn bộ thanh toán, xử lý liên hệ, xem báo cáo toàn hệ thống. |

`Company` và `Organizator` dùng chung khái niệm "Đối tác" (Partner) ở khu vực `/partner/*` trên frontend, nhưng khác nhau về phạm vi dữ liệu: `Company` bị giới hạn theo `CompanyId` sở hữu, `Organizator` thì không.

Một tài khoản có thể có nhiều role (bảng `UserRoles`), nhưng theo luồng đăng ký hiện tại mỗi tài khoản chỉ được gán đúng 1 role tương ứng với hình thức đăng ký đã chọn.

## 3. Đăng ký, đăng nhập & xác thực email

**Đăng ký** – 3 hình thức, tương ứng 3 endpoint và 3 trang UI:

- `POST /api/auth/register` – tài khoản Khách/Sinh viên (role `Student`).
- `POST /api/auth/register-company` – tài khoản Doanh nghiệp (role `Company`), kèm hồ sơ công ty (tên, địa chỉ, ngành nghề, logo...).
- `POST /api/auth/register-organizator` – tài khoản Tổ chức (role `Organizator`).

Sau khi đăng ký, hệ thống gửi email xác thực (link trỏ tới `/auth/confirm-email?token=...`). Tài khoản **không đăng nhập được** cho tới khi bấm xác thực (`POST /api/auth/confirm-email`). Nếu link hết hạn (24h) hoặc chưa nhận được mail, người dùng có thể yêu cầu gửi lại qua `POST /api/auth/resend-confirmation`.

**Đăng nhập** – `POST /api/auth/login`: hệ thống tìm theo email ở cả 3 bảng (User trực tiếp, Company, Organizator), kiểm tra mật khẩu (BCrypt), kiểm tra email đã xác thực và tài khoản chưa bị khóa (`IsActive`), rồi phát hành JWT chứa danh sách role. Frontend lưu token và dùng để gọi các API cần `Authorize`.

**Hồ sơ cá nhân** – `GET/PUT /api/auth/me`: xem/cập nhật tên, số điện thoại, avatar; nếu tài khoản là Company/Organizator thì đồng bộ luôn tên/số điện thoại sang hồ sơ doanh nghiệp/tổ chức.

## 4. Luồng Khách/Sinh viên (Student)

Thực hiện trên trang công khai `frontend/public/dewi/`:

1. **Tìm tour** (`tours.html`) – liệt kê tour đang mở (`GET /api/tours`, chỉ trả tour có trạng thái hiệu lực `Published`/`OnGoing` với người không đăng nhập hoặc không thuộc vai trò quản lý).
2. **Xem chi tiết tour** (`tour-details.html`) – `GET /api/tours/{id}`: mô tả, lịch trình, ảnh, giá, số chỗ còn lại, đánh giá công khai (`GET /api/feedbacks/tour/{tourId}/public`).
3. **Lưu tour quan tâm** (`saved-tours.html`) – `POST/DELETE /api/tours/{id}/interest`, xem danh sách đã lưu qua `GET /api/tours/interested`.
4. **Đăng ký tour** – `POST /api/registrations` (role `Student`). Điều kiện:
   - Tour phải ở trạng thái hiệu lực `Published` (đã duyệt và còn trong cửa sổ nhận đăng ký `BookingOpenAt`–`BookingCloseAt`).
   - Mỗi sinh viên chỉ đăng ký 1 lần/tour.
   - Nếu tour đã đủ số lượng (`MaxParticipants`), đăng ký tự động vào **danh sách chờ** (`Waitinglisted`) thay vì `Pending`.
   - Doanh nghiệp/tổ chức sở hữu tour nhận thông báo realtime "Có đăng ký mới".
5. **Theo dõi đăng ký của mình** (`my-tours.html`) – `GET /api/registrations/my`: xem trạng thái (`Pending` → `Approved`/`Rejected`/`Waitinglisted` → `Paid` → `CheckedIn` → `Completed`).
6. **Hủy đăng ký** – `DELETE /api/registrations/{id}` (chỉ khi chưa check-in/hoàn thành). Nếu suất bị hủy từng được tính vào số chỗ đã duyệt, hệ thống tự động **đôn** người kế tiếp trong danh sách chờ lên `Approved`.
7. **Thanh toán**:
   - Sau khi đăng ký được **duyệt** (`Approved`), sinh viên chuyển khoản theo hướng dẫn hiển thị, sau đó có thể bấm "Báo đã chuyển khoản" – `POST /api/registrations/{id}/notify-payment` – để nhắc doanh nghiệp kiểm tra.
   - Thanh toán được xác nhận bằng 1 trong 2 cách: doanh nghiệp/Admin xác nhận thủ công, hoặc **tự động qua webhook SePay** khi nội dung chuyển khoản khớp mã đăng ký (8 ký tự đầu của `RegistrationId`) và số tiền ≥ phí tour. Khi xác nhận thành công, đăng ký chuyển sang `Paid`, hệ thống tự sinh mã QR check-in và gửi email QR cho sinh viên.
8. **Check-in tại điểm tập trung** – sinh viên xem mã QR của mình (`GET /api/check-ins/my/{registrationId}`, khả dụng khi đăng ký ở trạng thái `Approved`/`Paid`/`CheckedIn`), xuất trình cho ban tổ chức quét.
9. **Đánh giá sau khi tham gia** (`my-reviews.html`) – `POST /api/feedbacks` (role `Student`), mỗi sinh viên đánh giá 1 lần/tour, có thể kèm ảnh.
10. **Thông báo** (`notifications.html`) – `GET /api/notifications/my`, đánh dấu đã đọc qua `PUT /api/notifications/{id}/read`; nhận đẩy realtime qua SignalR khi có cập nhật (duyệt đăng ký, xác nhận thanh toán, đôn từ danh sách chờ...).

## 5. Luồng Doanh nghiệp / Tổ chức (Company / Organizator – khu vực `/partner`)

Sau khi đăng nhập, đối tác vào Dashboard riêng (`/partner/dashboard`, dữ liệu từ `GET /api/dashboard/partner-overview`).

1. **Tạo tour** (`/partner/tours/create` → `POST /api/tours`, role `Organizator`/`Company`) – nhập thông tin tour, lịch trình, ảnh, giá, số lượng tối đa, cửa sổ mở/đóng đăng ký. Tour mới tạo ở trạng thái kiểm duyệt `Pending` (`ApprovalStatus`) và hiển thị `Hidden` (`PublishStatus`) – **chưa hiển thị công khai** cho tới khi Admin duyệt.
2. **Quản lý tour của mình** (`/partner/tours`) – `GET /api/tours/mine`: gồm cả tour đang chờ duyệt, bị từ chối, đang chạy. Sửa (`PUT /api/tours/{id}`), thêm/sửa/xóa lịch trình con (`/schedules`), thêm ảnh (`/images`).
3. **Hủy tour** – `PATCH /api/tours/{id}/archive` (Admin/Organizator/Company đều gọi được) chuyển tour sang `Archived` — trạng thái chấm hết do hủy thủ công, khác với `Completed` (tour tự nhiên kết thúc theo lịch, do `TourLifecycleService` cập nhật định kỳ mỗi giờ).
4. **Quản lý danh sách đăng ký** (`/partner/tours/:id/registrations`) – `GET /api/registrations/tour/{tourId}`:
   - **Duyệt** (`PUT /api/registrations/{id}/approve`) – nếu đã đủ chỗ thì tự chuyển sang danh sách chờ thay vì duyệt; ngược lại duyệt và tăng `CurrentParticipants`.
   - **Từ chối** (`PUT /api/registrations/{id}/reject`, kèm lý do) – không áp dụng được nếu đã `Paid`/`CheckedIn`/`Completed`. Nếu suất bị từ chối từng chiếm chỗ đã duyệt, hệ thống tự đôn người chờ kế tiếp.
   - Với role `Company`: chỉ thấy/thao tác được đăng ký của tour **thuộc công ty mình** (kiểm tra qua `CompanyId`); role `Organizator` không bị giới hạn này.
5. **Xác nhận thanh toán thủ công** (trang Thanh toán) – `POST /api/payments/confirm` khi sinh viên báo đã chuyển khoản nhưng chưa khớp webhook tự động (ví dụ chuyển khoản sai nội dung). Sau khi xác nhận, đăng ký chuyển `Paid`, sinh mã QR check-in, gửi email cho sinh viên.
6. **Cài đặt tài khoản thanh toán** (`/partner/payment-settings`, chỉ role `Company`) – khai báo thông tin ngân hàng nhận tiền, dùng để build nội dung/QR chuyển khoản hiển thị cho sinh viên.
7. **Check-in tại sự kiện** – `POST /api/check-ins/generate/{registrationId}` để tạo/làm mới mã QR (áp dụng cho đăng ký `Approved`/`Paid`), và `POST /api/check-ins/scan` để quét mã QR sinh viên xuất trình, đánh dấu `CheckedIn`. Company chỉ quét được cho tour của công ty mình.
8. **Báo cáo** (`/partner/reports` → `GET /api/dashboard/partner-reports`) – doanh thu, số lượt đăng ký/tour theo thời gian, giới hạn trong phạm vi tour của mình.

## 6. Luồng Admin

Khu vực `/admin`, dashboard tổng quan tại `GET /api/dashboard/overview`.

1. **Duyệt tour** (`/admin/tours/pending-approval`):
   - **Duyệt** (`PATCH /api/tours/{id}/approve`) – chuyển `ApprovalStatus` sang `Approved`; `PublishStatus` được tính lại tự động dựa trên mốc thời gian hiện tại so với `BookingCloseAt`/`EndDate` của tour (có thể ra `Published`, `OnGoing`, hoặc thẳng `Completed` nếu duyệt trễ).
   - **Từ chối** (`PATCH /api/tours/{id}/reject`, kèm lý do) – tour vẫn ở trạng thái `Hidden`, không hiển thị công khai.
2. **Quản lý tour** (`/admin/tours`) – xem toàn bộ tour mọi trạng thái, có thể hủy (`archive`) bất kỳ tour nào.
3. **Quản lý doanh nghiệp** (`/admin/companies`) – `GET/PUT/DELETE /api/companies/{id}`: xem, cập nhật, hoặc xóa hồ sơ doanh nghiệp (không có endpoint tạo mới qua Admin — doanh nghiệp luôn tự đăng ký).
4. **Quản lý thanh toán** (`/admin/payments`) – `GET /api/payments` thấy toàn bộ giao dịch hệ thống (không giới hạn theo công ty như role `Company`); có thể tự xác nhận thanh toán thay đối tác qua `POST /api/payments/confirm`. Xem tổng doanh thu qua `GET /api/payments/revenue`.
5. **Xử lý liên hệ** (`/admin/contacts`) – khách truy cập gửi form liên hệ công khai (`POST /api/contacts`, không cần đăng nhập), Admin xem/xử lý trong danh sách.
6. **Báo cáo toàn hệ thống** (`/admin/reports` → `GET /api/dashboard/reports`) – tổng hợp doanh thu, số tour, số đăng ký toàn nền tảng.

## 7. Vòng đời của Tour

Hai trục trạng thái tách biệt trên mỗi tour:

**Kiểm duyệt nội dung** (`ApprovalStatus`): `Draft` (chưa dùng ở luồng hiện tại) → `Pending` (mới tạo, chờ Admin) → `Approved` / `Rejected`.

**Hiển thị/bán tour** (`PublishStatus`), chỉ có ý nghĩa khi `ApprovalStatus = Approved`, được tính lại mỗi lần đọc dựa trên thời gian thực tế (và đồng bộ xuống DB mỗi giờ bởi `TourLifecycleService`):

```
Hidden ──(Admin duyệt)──▶ Published ──(qua BookingCloseAt)──▶ OnGoing ──(qua EndDate)──▶ Completed
   │                         │                                    │
   └────────────(huỷ thủ công bởi Company/Organizator/Admin)──────┴──▶ Archived
```

- `Published`: đang trong cửa sổ nhận đăng ký, hiển thị công khai, sinh viên đăng ký được.
- `OnGoing`: đã đóng nhận đăng ký (qua `BookingCloseAt`) nhưng tour chưa kết thúc (`EndDate`).
- `Completed`: tour đã qua `EndDate` một cách tự nhiên.
- `Archived`: bị hủy thủ công — trạng thái chấm hết, không tính lại theo thời gian nữa.

## 8. Vòng đời của một Đăng ký (Registration)

```
Pending ──(duyệt)──▶ Approved ──(xác nhận thanh toán)──▶ Paid ──(quét QR)──▶ CheckedIn ──(tour qua EndDate)──▶ Completed
   │                     │
   ├──(từ chối)────▶ Rejected ◀──(sinh viên tự hủy, nếu chưa Paid/CheckedIn)
   │
   └──(tour đầy chỗ)──▶ Waitinglisted ──(có người hủy/bị từ chối, tự động đôn)──▶ Approved
```

Ghi chú quan trọng:
- Đăng ký tự vào `Waitinglisted` ngay từ đầu nếu số suất `Approved/Paid/CheckedIn/Completed` đã đạt `MaxParticipants`.
- Khi một suất `Approved`/`Paid` bị hủy hoặc từ chối, hệ thống tự động duyệt người đầu tiên trong danh sách chờ (theo thứ tự đăng ký sớm nhất) nếu còn chỗ trống.
- Không thể hủy hoặc từ chối đăng ký đã `CheckedIn`/`Completed`; không thể từ chối đăng ký đã `Paid`.
- Bước cuối `CheckedIn → Completed` **không xảy ra ngay khi quét QR** — `TourLifecycleService` (background service chạy mỗi giờ) mới là nơi tự động chuyển, và chỉ chuyển khi `Tour.EndDate` đã qua. Đây là điều kiện bắt buộc để sinh viên gửi được đánh giá (mục 17) — cùng một đợt chạy nền này cũng chuyển `Tour.PublishStatus`: `Published → OnGoing` (khi `BookingCloseAt` đã qua) và `Published/OnGoing → Completed` (khi `EndDate` đã qua).
- **Tour miễn phí (`Fee = 0`) bỏ qua bước "chờ thanh toán"**: ngay khi đăng ký chuyển `Approved` (dù duyệt tay hay tự động đôn từ danh sách chờ), hệ thống tự gọi luôn `ConfirmPaymentAsync` với `Amount = 0` → nhảy thẳng `Approved → Paid`, tự sinh mã QR check-in và gửi email, không cần đối tác xác nhận thanh toán thủ công. Xem chi tiết ở mục 9.

## 9. Thanh toán

Ba đường xác nhận thanh toán, cùng đổ về một hàm xử lý chung (`PaymentService.ConfirmPaymentAsync`) nên hiệu ứng như nhau: chuyển đăng ký sang `Paid`, sinh mã QR check-in, gửi email QR, đẩy thông báo realtime.

- **Xác nhận thủ công**: `POST /api/payments/confirm` — Admin/Organizator/Company kiểm tra và xác nhận sau khi sinh viên báo đã chuyển khoản (`notify-payment`) hoặc gửi ảnh chứng từ.
- **Xác nhận tự động qua SePay**: `POST /api/payments/sepay-webhook` (endpoint công khai, xác thực bằng API key trong header `Authorization: Apikey ...`, cấu hình trên SePay Dashboard). SePay gọi webhook mỗi khi có giao dịch chuyển khoản đến; hệ thống trích mã đăng ký (8 ký tự đầu của GUID) từ nội dung chuyển khoản, đối chiếu số tiền ≥ phí tour, rồi tự xác nhận — không cần thao tác tay.
- **Tự động cho tour miễn phí**: khi `Tour.Fee == 0`, `RegistrationsController.Approve` (và `PromoteFromWaitlistAsync` khi tự đôn từ danh sách chờ) tự gọi `ConfirmPaymentAsync` với phương thức `"Miễn phí"` ngay khi đăng ký được duyệt — sinh viên không cần chuyển khoản, đối tác không cần bấm "Xác nhận thanh toán". Trang thanh toán (`my-tours.html`) cũng không hiện mã VietQR cho các tour này (`fee > 0` là điều kiện hiện nút "Thanh toán").

## 10. Thông báo realtime (SignalR)

Hub kết nối tại `VITE_HUB_URL` (`/hubs/...`), xác thực qua query string `?access_token=` (WebSocket không gửi được header). Các sự kiện được đẩy realtime:

- Tới **từng người dùng** (`NotifyUserAsync`): đăng ký mới/được duyệt/bị từ chối/đôn từ danh sách chờ, thanh toán được xác nhận, sinh viên báo đã chuyển khoản.
- Tới **bảng điều khiển đối tác** (`NotifyAdminBoardAsync`, theo `tourId`): cập nhật danh sách đăng ký/thanh toán để trang quản lý tự refresh mà không cần tải lại (dùng ở trang `/partner/tours/:id/registrations` và `/admin/payments`).

## 11. Bảng route frontend theo vai trò

| Route | Vai trò | Chức năng |
|---|---|---|
| `/auth/sign-in`, `/auth/sign-up`, `/auth/confirm-email` | Công khai | Đăng nhập, đăng ký, xác thực email (khu vực quản trị) |
| `frontend/public/dewi/*.html` | Công khai / Student | Landing page, tìm tour, chi tiết tour, tour của tôi, tour đã lưu, đánh giá, thông báo, hồ sơ |
| `/admin/dashboard` | Admin | Tổng quan hệ thống |
| `/admin/tours`, `/admin/tours/pending-approval`, `/admin/tours/:id(/edit,/delete,/registrations)` | Admin | Quản lý & duyệt tour |
| `/admin/companies` | Admin | Quản lý doanh nghiệp |
| `/admin/contacts` | Admin | Xử lý liên hệ |
| `/admin/payments` | Admin | Quản lý thanh toán toàn hệ thống |
| `/admin/reports` | Admin | Báo cáo toàn hệ thống |
| `/partner/dashboard` | Company, Organizator | Tổng quan đối tác |
| `/partner/tours`, `/partner/tours/create`, `/partner/tours/:id(/edit,/delete,/registrations)` | Company, Organizator | Tạo & quản lý tour của mình, duyệt/từ chối đăng ký |
| `/partner/reports` | Company, Organizator | Báo cáo doanh thu của mình |
| `/partner/payment-settings` | Company | Cài đặt tài khoản ngân hàng nhận thanh toán |

## 12. Chi tiết: Tạo tour

Áp dụng cho `Admin`, `Organizator`, `Company` — form tạo tour dùng chung một component (`frontend/src/layouts/tours/create.jsx`), truy cập qua `/admin/tours/create` hoặc `/partner/tours/create`, gửi về `POST /api/tours`.

### 12.1 Ai tạo được, tạo cho ai

- **Company**: chỉ tạo tour cho **công ty của chính mình** — hệ thống tự lấy `CompanyId` từ tài khoản đang đăng nhập (không hiển thị ô chọn doanh nghiệp trên form).
- **Organizator** và **Admin**: phải **chọn doanh nghiệp** từ danh sách thả xuống (`GET /api/companies`) trước khi tạo — tour được gắn vào doanh nghiệp đó, không phải vào tài khoản người tạo.
- Trường `CreatedBy` luôn lưu người bấm nút tạo (dùng để phân biệt "chủ doanh nghiệp" và "người tạo hộ", phục vụ gửi thông báo đúng người ở bước duyệt đăng ký sau này).

### 12.2 Trạng thái ngay sau khi tạo — điểm khác biệt quan trọng

| Người tạo | `ApprovalStatus` | `PublishStatus` | Hiển thị công khai? |
|---|---|---|---|
| **Admin** | `Approved` ngay lập tức | Tính luôn theo ngày (`Published`/`OnGoing`/`Completed`) | Có, ngay khi tạo |
| **Organizator / Company** | `Pending` (chờ duyệt) | `Hidden` | Không — phải chờ Admin duyệt ở `/admin/tours/pending-approval` |

Khi Organizator/Company tạo tour, hệ thống tự động:
- Gửi thông báo (trong app + realtime) tới **tất cả tài khoản Admin**: "Có tour mới đang chờ duyệt".
- Gửi thông báo cho chính người tạo: "Tour đã được tạo và đang chờ Admin xét duyệt".

### 12.3 Các trường thông tin trên form

| Trường | Bắt buộc | Ghi chú / ràng buộc |
|---|---|---|
| Mã tour (`Code`) | Có | Tối đa 50 ký tự, dùng làm mã định danh nội bộ (VD: `TOUR-HCM-001`) |
| Tiêu đề (`Tittle`) | Có | 3–200 ký tự |
| Thumbnail | Không | Xem quy trình upload ở mục 12.4 |
| Mô tả (`Decriptions`) | Có | Tối thiểu 10 ký tự (tính trên text thuần, bỏ thẻ HTML) — nhập qua trình soạn thảo rich text `TourDescriptionEditor` (TinyMCE): định dạng chữ, chèn bảng, chèn link, chèn ảnh trực tiếp vào nội dung |
| Địa điểm (`Location`) | Có | Chọn qua `AddressPicker` (tỉnh/thành → phường/xã theo dữ liệu hành chính VN, có ô nhập địa chỉ chi tiết) |
| Doanh nghiệp (`CompanyId`) | Chỉ Admin/Organizator | Company không thấy trường này (tự động gán) |
| Ngày bắt đầu / kết thúc (`StartDate`/`EndDate`) | Có | `EndDate` phải ≥ `StartDate` |
| Mở đăng ký từ / Đóng đăng ký lúc (`BookingOpenAt`/`BookingCloseAt`) | Có | `BookingCloseAt` phải > `BookingOpenAt` **và** ≤ `StartDate`. Ngoài khoảng này, khách chỉ xem được tour, không đăng ký được |
| Sức chứa (`MaxParticipants`) | Có | Số nguyên > 0 |
| Chi phí (`Fee`) | Có | ≥ 0, đơn vị VNĐ — để `0` nếu muốn tạo **tour miễn phí** |
| Yêu cầu (`Requirement`) | Không | Tối đa 1000 ký tự (VD: "Mang thẻ sinh viên khi tham gia") |

Nút "Tạo Tour" chỉ bật khi đủ các trường bắt buộc và dữ liệu hợp lệ; validate được chạy cả ở frontend (phản hồi tức thì) lẫn backend (nguồn sự thật cuối cùng, không thể bỏ qua bằng cách gọi thẳng API).

### 12.4 Upload thumbnail

Component `TourThumbnailField` cho 2 cách nhập:
1. **Kéo-thả hoặc chọn file ảnh từ máy** — sau khi chọn, hiện khung xem trước, cho phép kéo để định vị và dùng thanh trượt để zoom (1x–3x). Bấm **"Áp dụng zoom và vị trí"** sẽ crop ảnh về khung 1280×720 ngay trên trình duyệt (canvas), rồi upload lên Cloudflare R2 qua `POST /api/uploads/image`; URL trả về được điền vào `ThumbnailUrl`.
2. **Dán URL ảnh có sẵn** — chấp nhận URL `http`/`https` hoặc `data:image/...` (data URL).

Nếu không chọn thumbnail, tour vẫn tạo được (trường không bắt buộc).

### 12.5 Lịch trình tour (Schedules)

Bấm **"Thêm ngày"** để thêm từng mốc lịch trình con, mỗi mốc gồm:
- Tiêu đề (bắt buộc, 3–200 ký tự, VD: "Tham quan nhà máy A")
- Mô tả hoạt động (rich text, không bắt buộc)
- Thời gian bắt đầu / kết thúc (bắt buộc) — **phải nằm trong khoảng `StartDate`–`EndDate` của tour**, và giờ kết thúc ≥ giờ bắt đầu
- Thứ tự hiển thị (`OrderIndex`) — tự tăng theo thứ tự thêm/xóa

Toàn bộ tour + danh sách lịch trình được gửi trong **một request duy nhất** (`POST /api/tours`, mảng `Schedules` kèm theo) và được lưu trong **một transaction** ở backend: nếu bất kỳ lịch trình nào lỗi (VD: nằm ngoài khoảng ngày tour), toàn bộ thao tác tạo tour bị rollback — không có chuyện tour được tạo nhưng thiếu/lỗi lịch trình.

### 12.6 Sau khi tạo

- Được chuyển tới trang chi tiết tour vừa tạo (`/admin/tours/:id` hoặc `/partner/tours/:id`), kèm thông báo phù hợp với vai trò (Admin: "Tạo tour thành công"; Organizator/Company: "Tạo tour thành công, đang chờ Admin xét duyệt").
- Có thể tiếp tục chỉnh sửa qua `PUT /api/tours/{id}` (chỉ `Organizator`/`Company`, Admin không sửa nội dung — Admin chỉ Duyệt/Từ chối/Hủy; nếu nội dung sai, Admin từ chối kèm lý do để đối tác tự sửa và nộp lại).
- Có thể thêm ảnh khác ngoài thumbnail qua `POST /api/tours/{id}/images`, hoặc sửa/xóa từng lịch trình riêng lẻ qua `PUT`/`DELETE /api/tours/{id}/schedules/{scheduleId}`.

## 13. Chi tiết: Đăng ký tour & quản lý đăng ký

### 13.1 Sinh viên đăng ký

Trên `tour-details.html`/`tours.html`, sinh viên bấm "Đăng ký" → `POST /api/registrations` với `TourId` và `Notes` (ghi chú tùy chọn, tối đa 1000 ký tự). Điều kiện đã nêu ở mục 4; kết quả trả về ngay trạng thái `Pending` hoặc `Waitinglisted` tùy còn chỗ hay không.

### 13.2 Đối tác quản lý đăng ký (`/partner/tours/:id/registrations` hoặc `/admin/tours/:id/registrations`)

Trang hiển thị bảng đăng ký của một tour cụ thể (Sinh viên, Email, Ngày đăng ký, Trạng thái, Thanh toán, Ghi chú, Thao tác) và **tự làm mới realtime** khi có đăng ký/thanh toán mới cho tour này (không cần F5). Nút thao tác hiện theo trạng thái hiện tại của từng dòng:

| Trạng thái đăng ký | Nút hiện ra |
|---|---|
| `Pending`, `Waitinglisted` | Duyệt, Từ chối |
| `Approved` (tour có phí) | Từ chối, Xác nhận thanh toán |
| Đã thanh toán (`Paid`/`CheckedIn`/`Completed`) | Tạo mã QR |

- **Duyệt** — mở dialog nhỏ, gọi thẳng `PUT /api/registrations/{id}/approve`. Với **tour miễn phí** (`Fee = 0`), backend tự chuyển thẳng `Approved → Paid` ngay trong request này — sau khi duyệt, dòng đăng ký hiện luôn nút "Tạo mã QR", **không** hiện "Xác nhận thanh toán" (xem mục 9).
- **Từ chối** — bắt buộc nhập lý do trong hộp thoại, gọi `PUT /api/registrations/{id}/reject`.
- **Xác nhận thanh toán** — chỉ xuất hiện với tour có phí và đăng ký đang `Approved`. Mở dialog nhập Phương thức thanh toán (bắt buộc), Mã giao dịch (tùy chọn), và Ảnh chứng minh thanh toán (dán URL hoặc bấm "Upload ảnh" để tải file lên R2 qua `POST /api/uploads/image` rồi hiện preview). Gọi `POST /api/payments/confirm`.
- **Tạo mã QR** — gọi `POST /api/check-ins/generate/{registrationId}`, hiển thị chuỗi mã QR trong hộp thoại để gửi tay cho sinh viên nếu cần (bình thường mã đã tự gửi qua email lúc xác nhận thanh toán, kể cả xác nhận tự động cho tour miễn phí).

Ngoài ra trang còn có:
- **Ô quét mã check-in** ở đầu trang: nhập tay mã QR hoặc bấm "Quét bằng camera" (dùng `QrCameraScanner`, thư viện `html5-qrcode`) → gọi `POST /api/check-ins/scan`.
- **Xuất CSV** danh sách đăng ký (họ tên, email, SĐT, ngày đăng ký, trạng thái, tình trạng thanh toán, ngày thanh toán, ghi chú) — xử lý hoàn toàn phía trình duyệt, không gọi API riêng.
- **Khối phản hồi từ sinh viên**: hiển thị điểm trung bình và danh sách đánh giá (`GET /api/feedbacks/tour/{tourId}`) ngay dưới bảng đăng ký.

## 14. Chi tiết: Thanh toán

### 14.1 Sinh viên xem thông tin chuyển khoản

Ở `my-tours.html`, khi đăng ký đã ở trạng thái `Approved` **và tour có phí** (`fee > 0`, đủ điều kiện `canPay`), trang tự dựng:
- **Nội dung chuyển khoản** theo mẫu cố định: `TT <mã tour hoặc 8 ký tự đầu TourId> <8 ký tự đầu RegistrationId>` — đây chính là chuỗi mà webhook SePay dò tìm để khớp đăng ký (xem mục 9).
- **Mã QR VietQR** dựng từ `https://img.vietqr.io/image/{bankBin}-{accountNo}-compact2.png` kèm số tiền và nội dung chuyển khoản đã điền sẵn — lấy `bankBin`/`bankAccountNo`/`bankAccountName` từ hồ sơ công ty sở hữu tour (mục 15). Sinh viên chỉ cần quét bằng app ngân hàng, mọi thông tin đã tự động khớp.
- Nút **"Báo đã chuyển khoản"** (`POST /api/registrations/{id}/notify-payment`) để chủ động nhắc đối tác kiểm tra, dùng khi webhook SePay không tự khớp được (ví dụ ngân hàng không hỗ trợ SePay, hoặc sinh viên chuyển sai nội dung).

Nếu tour **miễn phí** (`fee = 0`), khối thanh toán này không hiển thị — đăng ký được backend tự chuyển sang `Paid` ngay khi đối tác duyệt, sinh viên chỉ cần chờ email mã QR check-in.

### 14.2 Ba đường xác nhận thanh toán (nhắc lại, xem chi tiết code ở mục 9)

- **Tự động qua SePay**: SePay gọi `POST /api/payments/sepay-webhook` mỗi khi có tiền vào tài khoản đã đăng ký webhook trên SePay Dashboard — khớp theo nội dung chuyển khoản + số tiền, không cần ai bấm tay.
- **Thủ công**: đối tác/Admin xác nhận qua dialog "Xác nhận thanh toán" ở mục 13.2 (chỉ áp dụng cho tour có phí).
- **Tự động cho tour miễn phí**: `RegistrationsController` tự gọi `PaymentService.ConfirmPaymentAsync` ngay khi đăng ký chuyển `Approved`, không cần webhook hay thao tác tay.

Cả ba đường đều: đánh dấu `Registration.Status = Paid` → sinh mã QR check-in → gửi email QR cho sinh viên → đẩy thông báo realtime.

### 14.3 Trang quản lý thanh toán

- **Admin** (`/admin/payments`) — xem **toàn bộ** giao dịch hệ thống: Tour, Số tiền, Phương thức, Mã giao dịch, Trạng thái (Chờ thanh toán/Đã thanh toán/Thất bại/Đã hoàn tiền), Thời gian. Có 2 thẻ tổng hợp ở đầu trang: **Tổng doanh thu** và **Số giao dịch đã thanh toán** (`GET /api/payments/revenue`). Trang tự làm mới khi có sự kiện `payment-confirmed` đẩy về qua realtime.
- **Company/Organizator** (`GET /api/payments`) — chỉ thấy giao dịch của tour thuộc doanh nghiệp mình (Company) hoặc do mình phụ trách (Organizator không giới hạn theo công ty).

## 15. Chi tiết: Cài đặt tài khoản thanh toán (Company)

Route `/partner/payment-settings`, chỉ role `Company` (Organizator không có trang này). Mục đích: khai báo tài khoản ngân hàng để hệ thống **tự sinh QR chuyển khoản đúng cho từng đăng ký**.

- **Thiết lập lần đầu**: chọn ngân hàng từ danh sách rút gọn 12 ngân hàng phổ biến (Vietcombank, VietinBank, BIDV, Agribank, Techcombank, VPBank, TPBank, ACB, MBBank, VIB, Sacombank, PVcomBank — theo mã BIN chuẩn VietQR/Napas), hoặc chọn "Ngân hàng khác" để tự nhập mã BIN. Nhập thêm **Số tài khoản** và **Tên chủ tài khoản** (tự động viết hoa). Lưu qua `PUT /api/companies/{id}` (cập nhật 3 trường `BankBin`, `BankAccountNo`, `BankAccountName` trong `CompanyUpsertRequest`).
- **Xem lại**: sau khi lưu, trang chuyển sang chế độ xem — hiện thông tin ngân hàng, số tài khoản (có nút sao chép nhanh), và **preview trực tiếp mã VietQR** sẽ dùng để thu tiền, để đối tác tự kiểm tra đúng trước khi vận hành thật. Có thể bấm "Sửa" để cập nhật lại bất cứ lúc nào.
- Không thiết lập tài khoản này thì sinh viên vẫn đăng ký được tour bình thường, nhưng màn hình thanh toán sẽ thiếu QR (không có `bankBin`/`bankAccountNo`) — đối tác cần xác nhận thủ công theo cách khác (chuyển khoản ngoài hoặc tiền mặt) rồi bấm "Xác nhận thanh toán".

## 16. Chi tiết: Check-in bằng QR

- **Tạo mã**: sau khi đăng ký ở trạng thái `Approved` hoặc `Paid`, đối tác/Admin tạo mã qua `POST /api/check-ins/generate/{registrationId}` (tự động chạy khi xác nhận thanh toán thành công, hoặc tạo tay từ nút "Tạo mã QR"). Mã được gửi email trực tiếp cho sinh viên kèm tên tour.
- **Sinh viên xem mã của mình**: `GET /api/check-ins/my/{registrationId}` trong modal "Mã check-in" ở `my-tours.html`, chỉ khả dụng khi đăng ký đang `Approved`/`Paid`/`CheckedIn`.
- **Quét check-in tại sự kiện**: đối tác/Admin nhập tay mã hoặc dùng **camera quét trực tiếp** (`QrCameraScanner`, thư viện `html5-qrcode`) ở trang quản lý đăng ký → `POST /api/check-ins/scan`. Mỗi mã chỉ dùng được **một lần** (báo lỗi nếu quét lại mã đã check-in). Company chỉ quét được cho tour thuộc công ty mình.
- Sau khi check-in, đăng ký chuyển `CheckedIn`; khi tour kết thúc thật sự (`EndDate` đã qua), `TourLifecycleService` (chạy nền mỗi giờ) tự động chuyển tiếp `CheckedIn → Completed` — đây là điều kiện bắt buộc để sinh viên được đánh giá tour (mục 17), tách biệt với việc quét check-in tại chỗ.

## 17. Chi tiết: Đánh giá (Feedback)

- Sinh viên chỉ đánh giá được khi **cả 3 điều kiện** đều đúng: đã đăng ký tour đó, đăng ký đã `Paid`, và trạng thái đăng ký đã lên `Completed` (tức tour đã thực sự kết thúc theo `EndDate`, do `TourLifecycleService` tự chuyển — không phải ngay sau khi check-in). Với tour miễn phí, điều kiện `Paid` được hệ thống tự đáp ứng ngay lúc duyệt (mục 9) nên không phát sinh trở ngại gì thêm.
- Nội dung gồm điểm sao (`Rating`, 1–5, bắt buộc), nhận xét (`Comment`, tối đa 1000 ký tự, tùy chọn), và tối đa 4 ảnh đính kèm (`PhotoUrls`, tùy chọn — upload từng ảnh qua `POST /api/uploads/image` trước khi gửi form).
- Mỗi sinh viên chỉ đánh giá **một lần** cho mỗi tour (`POST /api/feedbacks` chặn nếu đã tồn tại).
- Đối tác xem đánh giá của tour mình tại `GET /api/feedbacks/tour/{tourId}` (trang quản lý đăng ký, mục 13.2). Đánh giá công khai hiển thị ở trang chi tiết tour (`GET /api/feedbacks/tour/{tourId}/public`) và trang landing (`GET /api/feedbacks/all/public`).

## 18. Chi tiết: Liên hệ & Quản lý doanh nghiệp (Admin)

### 18.1 Form liên hệ công khai

Bất kỳ ai (kể cả chưa đăng nhập) đều gửi được qua `POST /api/contacts` (Họ tên, Email, Chủ đề, Nội dung). Ngay khi gửi: toàn bộ Admin nhận thông báo realtime "Liên hệ mới từ ..."; nếu người gửi đang đăng nhập, họ cũng nhận thông báo xác nhận đã gửi thành công.

### 18.2 Admin xử lý liên hệ (`/admin/contacts`)

`GET /api/contacts` liệt kê tất cả (mới nhất trước), `PATCH /api/contacts/{id}/read` đánh dấu đã đọc/xử lý.

### 18.3 Admin quản lý doanh nghiệp (`/admin/companies`)

Không có chức năng "tạo doanh nghiệp" ở phía Admin — doanh nghiệp luôn tự tạo qua `register-company` (mục 3). Admin chỉ:
- Xem danh sách/chi tiết (`GET /api/companies`, `GET /api/companies/{id}`).
- Cập nhật hồ sơ thay đối tác nếu cần (`PUT /api/companies/{id}`, cùng DTO với trang cài đặt thanh toán ở mục 15 — có thể sửa cả thông tin công ty lẫn tài khoản ngân hàng).
- Xóa doanh nghiệp (`DELETE /api/companies/{id}`) — thao tác nhạy cảm, ảnh hưởng tới toàn bộ tour/đăng ký/thanh toán liên quan, cần cân nhắc kỹ trước khi dùng.

## 19. Tham khảo thêm

- Cài đặt & cấu hình kỹ thuật: [backend/docs/README.md](../backend/docs/README.md), [frontend/docs/SETUP.md](../frontend/docs/SETUP.md)
- Định nghĩa route đầy đủ (khu vực quản trị): `frontend/src/routes.jsx`
- Enum trạng thái: `backend/Models/Enums/{PublishStatus,ApprovalStatus,RegistrationStatus,PaymentStatus}.cs`
