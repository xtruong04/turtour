# CHƯƠNG 3. KẾT QUẢ THỰC HIỆN VÀ ĐÁNH GIÁ

## 3.1. Kết quả triển khai hệ thống

### 3.1.1. Môi trường triển khai

Hệ thống được triển khai trên hai môi trường:

- **Môi trường phát triển (Development)**: backend chạy cục bộ qua Kestrel (`https://localhost:7186`/`7187` theo cấu hình `backend/Properties/launchSettings.json`), frontend chạy bằng Vite dev server, kết nối API qua biến môi trường `VITE_API_URL` và kênh realtime qua `VITE_HUB_URL` (SignalR hub `/hubs/app`).
- **Môi trường production**: backend được đóng gói bằng **Docker** (multi-stage build cho .NET 8, `backend/Dockerfile`) và triển khai trên nền tảng **Railway** (`https://turtour-production.up.railway.app`).

Cấu hình hệ thống được tham số hóa đầy đủ qua biến môi trường/`appsettings`, bao gồm: chuỗi kết nối PostgreSQL, khóa ký JWT (`Jwt.Key/Issuer/Audience/ExpiresInMinutes`), thông tin SMTP gửi email xác thực, thông tin Cloudflare R2 (lưu trữ ảnh), khóa API cổng thanh toán SePay, và danh sách `AllowedOrigins` (CORS) — cho phép tách biệt cấu hình bí mật khỏi mã nguồn (`appsettings.Example.json` chỉ là file mẫu công khai).

### 3.1.2. Cơ sở dữ liệu

Schema cơ sở dữ liệu được quản lý bằng EF Core Migrations, trải qua **11 lần thay đổi** kể từ bản khởi tạo, phản ánh quá trình phát triển lặp của hệ thống:

| Migration | Nội dung thay đổi chính |
|---|---|
| `InitialCreate` | Khởi tạo schema ban đầu |
| `update_users` | Điều chỉnh bảng `Users` |
| `update_organizator` | Điều chỉnh bảng `Organizator` |
| `company_user_link_auth` | Gắn `Company` với `User` để xác thực đăng nhập |
| `AddTourInterest` | Bổ sung chức năng "quan tâm tour" |
| `AddTourIdToNotification` | Bổ sung liên kết `Notification` → `Tour` để điều hướng giao diện |
| `AddBankInfoToCompany` | Bổ sung thông tin tài khoản ngân hàng cho doanh nghiệp (phục vụ thanh toán VietQR) |
| `AddEmailConfirmationToUser` | Bổ sung cơ chế xác thực email |
| `SplitTourStatusIntoApprovalAndPublish` | Tách trạng thái tour thành `ApprovalStatus` và `PublishStatus` độc lập (đã trình bày ở mục 2.2.1) |
| `AddBookingWindowToTour` | Bổ sung khung thời gian mở/đóng đăng ký (`BookingOpenAt`/`BookingCloseAt`) |
| `WipeTestTourData` | Dọn dữ liệu thử nghiệm trước khi đưa vào vận hành |

Lịch sử migration cho thấy hai quyết định thiết kế quan trọng — tách trạng thái phê duyệt/hiển thị của tour và bổ sung khung giờ đăng ký riêng biệt với thời gian diễn ra tour — được rút ra và điều chỉnh trong quá trình phát triển, sau khi mô hình trạng thái đơn giản ban đầu không đáp ứng đủ yêu cầu nghiệp vụ thực tế.

### 3.1.3. Mức độ hoàn thiện giao diện theo module

| Module | Các màn hình đã có | Mức độ hoàn thiện |
|---|---|---|
| Xác thực (đăng nhập/đăng ký/xác thực email) | sign-in, sign-up, confirm-email | Đầy đủ |
| Quản lý tour | danh sách, tạo, sửa, xóa, chi tiết, chờ duyệt, danh sách đăng ký theo tour | Đầy đủ (CRUD + workflow duyệt) |
| Dashboard đối tác (Partner) | dashboard, báo cáo, cấu hình tài khoản nhận thanh toán | Đầy đủ |
| Dashboard quản trị (Admin) | tổng quan, biểu đồ, báo cáo | Đầy đủ |
| Thanh toán | danh sách thanh toán | Cơ bản (chỉ xem danh sách, chưa có màn hình đối soát chi tiết) |
| Quản lý doanh nghiệp | danh sách doanh nghiệp | Cơ bản (chỉ xem danh sách) |
| Hồ sơ cá nhân | thông tin tài khoản, cài đặt | Cơ bản |

Các module nghiệp vụ cốt lõi (quản lý tour, đăng ký, đối tác) đã được xây dựng giao diện đầy đủ vòng đời thao tác; trong khi hai module **Thanh toán** và **Quản lý doanh nghiệp** ở phía Admin hiện chỉ dừng ở mức hiển thị danh sách, các thao tác chi tiết hơn (xác nhận thanh toán thủ công, chỉnh sửa hồ sơ doanh nghiệp) hiện được thực hiện qua API nhưng chưa có giao diện thao tác trực quan tương xứng.

## 3.2. Kết quả các chức năng chính

Đối chiếu với yêu cầu chức năng đã đặt ra ở Chương 1 (mục 1.2.3) và thiết kế ở Chương 2, hệ thống đã hiện thực được:

- **Quản lý tài khoản và phân quyền**: đăng ký theo 3 vai trò (Student/Company/Organizator), xác thực email bắt buộc, đăng nhập bằng JWT, phân quyền API theo vai trò trên toàn bộ 10 controller.
- **Quản lý tour**: tạo/sửa/xóa/lưu trữ tour kèm lịch trình và hình ảnh; cơ chế phê duyệt hai chiều (Admin duyệt/từ chối) gắn với trạng thái hiển thị tự động tính toán theo thời gian thực.
- **Đăng ký và xét duyệt**: đăng ký tour, danh sách chờ tự động khi đầy chỗ, tự động đôn từ danh sách chờ khi có chỗ trống, hủy đăng ký.
- **Thanh toán**: sinh mã VietQR theo thông tin ngân hàng doanh nghiệp, xác nhận thủ công và xác nhận tự động qua webhook SePay.
- **Điểm danh QR**: sinh mã QR theo từng đăng ký, quét mã để check-in.
- **Đánh giá và báo cáo**: gửi đánh giá sau khi hoàn thành tour, dashboard/báo cáo phân theo cấp hệ thống và cấp đối tác.
- **Thông báo thời gian thực**: cập nhật tức thời qua SignalR cho các sự kiện duyệt tour, xử lý đăng ký, xác nhận thanh toán, kèm lưu trữ lịch sử thông báo.

Như vậy, phần lớn các yêu cầu chức năng đặt ra ở Chương 1 đã được hiện thực hóa đầy đủ ở tầng API; một số yêu cầu (quản lý doanh nghiệp, đối soát thanh toán) mới dừng ở mức hỗ trợ qua API mà chưa có giao diện vận hành hoàn chỉnh như đã nêu ở mục 3.1.3.

## 3.3. Kiểm thử hệ thống

### 3.3.1. Phạm vi kiểm thử

Tại thời điểm thực hiện đồ án, hệ thống **chưa xây dựng bộ kiểm thử tự động** (không có dự án unit test/integration test cho backend, không có file kiểm thử cho frontend). Việc kiểm thử được thực hiện theo phương pháp **kiểm thử chức năng thủ công (manual functional testing)**, dựa trên việc thao tác trực tiếp qua giao diện và qua tài liệu API tự sinh (Swagger/OpenAPI, được tích hợp sẵn qua Swashbuckle) để xác minh hành vi của từng endpoint.

### 3.3.2. Kịch bản kiểm thử tiêu biểu

Các luồng nghiệp vụ chính được kiểm thử thủ công theo kịch bản đầu-cuối (end-to-end), bám theo các máy trạng thái đã thiết kế ở Chương 2:

| Kịch bản | Các bước chính | Kết quả mong đợi |
|---|---|---|
| Tạo và duyệt tour | Company tạo tour → Admin xem danh sách chờ duyệt → Admin duyệt | Tour chuyển `Pending → Approved`, `Hidden → Published`, sinh viên thấy tour trên trang công khai |
| Từ chối tour | Admin từ chối tour kèm lý do | Tour chuyển `Rejected`, đối tác nhận được thông báo kèm lý do |
| Đăng ký khi còn chỗ | Sinh viên đăng ký tour còn chỗ trống | Đăng ký ở trạng thái `Pending`, đối tác nhận thông báo có đăng ký mới |
| Đăng ký khi đã đầy | Sinh viên đăng ký tour đã đủ số lượng duyệt | Đăng ký vào thẳng `Waitinglisted` |
| Hủy đăng ký đã duyệt | Sinh viên hủy đăng ký đang `Approved` | Đăng ký chuyển `Rejected`, người đầu danh sách chờ được tự động đôn lên `Approved` |
| Thanh toán thủ công | Sinh viên tải minh chứng → đối tác xác nhận | Đăng ký chuyển `Paid`, mã QR check-in được sinh ra |
| Điểm danh | Quét mã QR của một đăng ký `Paid` | Đăng ký chuyển `CheckedIn`, đối tác đánh dấu `Completed` |
| Đánh giá tour | Sinh viên gửi đánh giá sau khi `Completed` | Lưu đánh giá thành công; thử gửi khi chưa `Completed` → bị từ chối |
| Phân quyền API | Gọi API quản trị (vd. duyệt tour) bằng tài khoản Student | Hệ thống trả về lỗi từ chối truy cập (403) |

### 3.3.3. Hạn chế của quá trình kiểm thử

Do không có bộ test tự động, việc kiểm thử phụ thuộc vào thao tác thủ công nên:
- Không đảm bảo được việc phát hiện hồi quy (regression) khi có thay đổi mã nguồn sau này.
- Chưa kiểm thử được các tình huống đồng thời/tải cao (ví dụ nhiều sinh viên cùng đăng ký vào suất cuối cùng của một tour — rủi ro race-condition khi kiểm tra và cập nhật `CurrentParticipants`).
- Chưa có kiểm thử bảo mật chuyên sâu (chỉ kiểm thử thủ công cơ chế phân quyền theo vai trò).

## 3.4. Đánh giá kết quả

### 3.4.1. Kết quả đạt được

- Hệ thống đã số hóa toàn bộ quy trình tổ chức tour tham quan doanh nghiệp đã khảo sát ở Chương 1, thay thế các công cụ rời rạc (Google Form, chat nhóm, chuyển khoản thủ công, điểm danh giấy) bằng một nền tảng tập trung.
- Cơ chế phê duyệt tập trung và danh sách chờ tự động giải quyết trực tiếp hai hạn chế nổi bật của hiện trạng: thiếu kiểm soát nội dung tour trước khi công bố, và khó quản lý số lượng đăng ký theo thời gian thực.
- Việc tích hợp xác nhận thanh toán tự động qua webhook và điểm danh bằng mã QR giúp giảm đáng kể thao tác thủ công và sai sót so với phương pháp đối soát sao kê/gọi tên truyền thống.
- Thông báo thời gian thực qua SignalR giúp các bên (sinh viên, đối tác, quản trị viên) cập nhật trạng thái ngay lập tức mà không cần làm mới trang hoặc tra cứu thủ công.
- Hệ thống đã được triển khai thực tế (Docker + Railway), chứng tỏ tính khả thi vận hành ngoài môi trường phát triển cục bộ.

### 3.4.2. Hạn chế còn tồn tại

- **Thiếu kiểm thử tự động**: không có unit test/integration test cho cả backend lẫn frontend, không có pipeline CI/CD (không có `.github/workflows` hay tương đương) để tự động kiểm tra chất lượng mã nguồn trước khi triển khai.
- **Một số giao diện quản trị chưa hoàn chỉnh**: module Thanh toán và Quản lý doanh nghiệp ở phía Admin mới dừng ở mức xem danh sách, chưa có thao tác chi tiết/đối soát trực quan trên giao diện.
- **Thiếu tài liệu vận hành**: chưa có `README` hướng dẫn cài đặt/chạy cho backend; `README` của frontend vẫn là bản mặc định của Vite, chưa được cập nhật theo đặc thù dự án.
- **Rủi ro tương tranh (concurrency)**: logic kiểm tra số chỗ còn trống và cập nhật `CurrentParticipants` chưa được kiểm chứng dưới tải đồng thời cao, có khả năng xảy ra tình trạng vượt số lượng tối đa nếu nhiều yêu cầu duyệt đăng ký xảy ra gần như đồng thời.
- **Thiếu môi trường phát triển đóng gói đầy đủ**: có `Dockerfile` cho backend nhưng chưa có `docker-compose` để dựng nhanh toàn bộ môi trường (API + PostgreSQL) cho người phát triển mới.

### 3.4.3. Định hướng phát triển

- Xây dựng bộ kiểm thử tự động (unit test cho tầng Service/Controller bằng xUnit, kiểm thử tích hợp cho các luồng trạng thái Tour/Registration) và thiết lập pipeline CI/CD để tự động build – test – triển khai.
- Hoàn thiện giao diện quản trị cho module Thanh toán (đối soát giao dịch, lọc theo trạng thái) và module Doanh nghiệp (chỉnh sửa, kích hoạt/ngưng hoạt động trực tiếp trên giao diện).
- Bổ sung cơ chế khóa/giao dịch (transaction, hoặc kiểm tra điều kiện nguyên tử ở tầng cơ sở dữ liệu) khi cập nhật số lượng đăng ký để loại bỏ rủi ro tương tranh.
- Viết tài liệu vận hành (README, hướng dẫn cấu hình biến môi trường, hướng dẫn triển khai) và bổ sung `docker-compose.yml` để chuẩn hóa môi trường phát triển cục bộ.
- Mở rộng thống kê báo cáo (xuất file Excel/PDF) và bổ sung kiểm thử bảo mật, kiểm thử hiệu năng trước khi đưa hệ thống vào sử dụng chính thức ở quy mô lớn hơn.

## 3.5. Kết luận chương

Chương này đã trình bày kết quả triển khai thực tế của hệ thống TurTour, bao gồm môi trường vận hành, lịch sử phát triển cơ sở dữ liệu qua các migration, mức độ hoàn thiện của từng module chức năng, và kết quả kiểm thử thủ công theo các kịch bản nghiệp vụ trọng yếu. Kết quả cho thấy hệ thống đã đáp ứng được phần lớn yêu cầu đặt ra, giải quyết hiệu quả các hạn chế của phương pháp quản lý thủ công đã khảo sát ở Chương 1. Đồng thời, chương cũng chỉ ra một cách trung thực các hạn chế còn tồn tại — đặc biệt là việc thiếu kiểm thử tự động và một số giao diện quản trị chưa hoàn chỉnh — làm cơ sở cho định hướng hoàn thiện hệ thống trong giai đoạn tiếp theo.
