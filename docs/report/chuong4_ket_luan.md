# CHƯƠNG 4. KẾT LUẬN

## 4.1. Kết quả đạt được

Đồ án đã xây dựng thành công **TurTour** — hệ thống quản lý tour tham quan doanh nghiệp dành cho sinh viên, doanh nghiệp/đơn vị tổ chức và quản trị viên trong môi trường đại học, với các kết quả cụ thể sau:

- **Về lý thuyết và khảo sát**: hệ thống hóa được cơ sở lý thuyết về hệ thống thông tin quản lý nhiều lớp, phân quyền theo vai trò (RBAC), và quy trình nghiệp vụ tổ chức tour tham quan thực tế. Khảo sát chỉ ra các hạn chế cốt lõi của phương pháp quản lý thủ công hiện nay: thông tin phân tán, không có cơ chế phê duyệt tập trung, đăng ký và thanh toán không đồng bộ, điểm danh và thu thập phản hồi thủ công.
- **Về phân tích, thiết kế**: xây dựng được mô hình dữ liệu quan hệ với 14 thực thể đảm bảo toàn vẹn dữ liệu, thiết kế hai máy trạng thái cốt lõi (Tour và Registration) phản ánh đúng vòng đời nghiệp vụ, cùng kiến trúc phân lớp rõ ràng (Controller – Service – DTO – Entity ở backend; SPA quản trị tách biệt với trang công khai ở frontend).
- **Về xây dựng hệ thống**: hiện thực đầy đủ các chức năng cốt lõi — quản lý tài khoản và phân quyền, quản lý tour kèm cơ chế phê duyệt, đăng ký với danh sách chờ tự động, thanh toán (thủ công và tự động qua webhook), điểm danh bằng mã QR, đánh giá tour, dashboard/báo cáo hai cấp độ, và thông báo thời gian thực qua SignalR.
- **Về triển khai**: hệ thống đã được đóng gói bằng Docker và vận hành thử nghiệm trên nền tảng Railway, chứng minh tính khả thi ngoài môi trường phát triển cục bộ.

Nhìn chung, hệ thống đã đáp ứng được các yêu cầu chức năng và phần lớn yêu cầu phi chức năng đặt ra ban đầu, giải quyết trực tiếp những hạn chế của phương pháp quản lý thủ công đã khảo sát, đồng thời thể hiện được năng lực vận dụng các công nghệ hiện đại (ASP.NET Core, EF Core, PostgreSQL, JWT, SignalR, React) vào một bài toán quản lý có nghiệp vụ trạng thái phức tạp.

## 4.2. Hạn chế

Bên cạnh kết quả đạt được, hệ thống còn một số hạn chế đã được phân tích cụ thể ở Chương 3:

- Chưa có bộ kiểm thử tự động (unit test/integration test) và pipeline CI/CD, nên việc đảm bảo chất lượng khi mã nguồn thay đổi vẫn phụ thuộc vào kiểm thử thủ công.
- Một số giao diện quản trị (quản lý thanh toán, quản lý doanh nghiệp ở phía Admin) mới dừng ở mức hiển thị danh sách, chưa có thao tác chi tiết trực quan.
- Logic cập nhật số lượng đăng ký chưa được kiểm chứng dưới điều kiện tương tranh cao, tiềm ẩn rủi ro vượt số lượng tối đa khi có nhiều yêu cầu xảy ra đồng thời.
- Tài liệu vận hành (hướng dẫn cài đặt, cấu hình, triển khai) còn sơ sài, gây khó khăn cho việc bàn giao hoặc tiếp nhận bảo trì về sau.

## 4.3. Hướng phát triển

Trên cơ sở các hạn chế đã nêu, hệ thống có thể được tiếp tục hoàn thiện theo các hướng sau:

1. Xây dựng bộ kiểm thử tự động và pipeline CI/CD nhằm đảm bảo chất lượng mã nguồn lâu dài.
2. Hoàn thiện giao diện quản trị cho các module còn ở mức cơ bản, bổ sung công cụ đối soát thanh toán trực quan.
3. Bổ sung cơ chế xử lý tương tranh an toàn (transaction/khóa) cho các thao tác cập nhật số lượng đăng ký, đảm bảo tính nhất quán dữ liệu khi tải cao.
4. Hoàn chỉnh tài liệu kỹ thuật và vận hành, chuẩn hóa môi trường phát triển (docker-compose) để dễ dàng mở rộng đội ngũ phát triển.
5. Mở rộng tính năng theo nhu cầu thực tế: xuất báo cáo (Excel/PDF), tìm kiếm/lọc tour nâng cao, đánh giá doanh nghiệp đối tác, tích hợp thêm các cổng thanh toán khác, và tối ưu trải nghiệm di động.

## 4.4. Lời kết

Quá trình thực hiện đồ án đã giúp vận dụng kiến thức về phân tích thiết kế hệ thống, lập trình backend/frontend hiện đại và quản lý dữ liệu quan hệ vào một bài toán quản lý có tính thực tiễn cao trong môi trường đại học. Hệ thống TurTour, dù còn một số hạn chế cần tiếp tục hoàn thiện, đã chứng minh được khả năng số hóa hiệu quả quy trình tổ chức tour tham quan doanh nghiệp, đặt nền tảng vững chắc cho các giai đoạn phát triển và đưa vào sử dụng thực tế tiếp theo.
