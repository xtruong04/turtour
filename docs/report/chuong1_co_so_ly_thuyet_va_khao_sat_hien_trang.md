# CHƯƠNG 1. CƠ SỞ LÝ THUYẾT VÀ KHẢO SÁT HIỆN TRẠNG

## 1.1. Cơ sở lý thuyết

### 1.1.1. Hệ thống thông tin quản lý

Hệ thống thông tin quản lý (Management Information System – MIS) là tập hợp các thành phần phần cứng, phần mềm, dữ liệu, con người và quy trình được tổ chức nhằm thu thập, lưu trữ, xử lý và cung cấp thông tin phục vụ cho hoạt động ra quyết định, điều hành và kiểm soát của một tổ chức. Một hệ thống thông tin quản lý hiện đại thường được xây dựng theo mô hình nhiều lớp (multi-layer architecture), trong đó tách biệt rõ giữa:

- **Lớp giao diện (Presentation Layer)**: nơi người dùng tương tác trực tiếp với hệ thống.
- **Lớp xử lý nghiệp vụ (Business Logic Layer)**: nơi các quy tắc, ràng buộc nghiệp vụ được thực thi.
- **Lớp dữ liệu (Data Access Layer)**: nơi dữ liệu được lưu trữ và truy xuất.

Việc phân lớp này giúp hệ thống dễ bảo trì, mở rộng và kiểm thử độc lập từng thành phần. Đối với hệ thống quản lý có nhiều nhóm người dùng với quyền hạn khác nhau (như sinh viên, doanh nghiệp, quản trị viên), cơ chế **phân quyền theo vai trò (Role-Based Access Control – RBAC)** là một thành phần lý thuyết quan trọng, đảm bảo mỗi vai trò chỉ được phép thực hiện các hành động phù hợp với chức năng của mình trong hệ thống.

### 1.1.2. Quy trình tổ chức tour tham quan doanh nghiệp trong môi trường đại học

Hoạt động tổ chức cho sinh viên tham quan thực tế tại doanh nghiệp là một hình thức kết nối giữa đào tạo và thực tiễn, giúp sinh viên tiếp cận môi trường làm việc thật trước khi ra trường. Về mặt quy trình, hoạt động này thường bao gồm các giai đoạn:

1. **Khởi tạo tour**: Doanh nghiệp hoặc đơn vị tổ chức đề xuất một chương trình tham quan, xác định thời gian, địa điểm, số lượng người tham gia tối đa, cũng như các mốc thời gian mở/đóng đăng ký.
2. **Phê duyệt**: Đơn vị quản lý (nhà trường/quản trị hệ thống) xét duyệt nội dung tour trước khi công bố công khai, nhằm đảm bảo tính xác thực và an toàn cho sinh viên.
3. **Công bố và đăng ký**: Tour được công bố để sinh viên đăng ký tham gia trong khoảng thời gian mở đăng ký.
4. **Xác nhận và thanh toán** (nếu có chi phí): Doanh nghiệp/đơn vị tổ chức xác nhận danh sách tham gia; nếu tour có thu phí, sinh viên thực hiện thanh toán và cung cấp minh chứng giao dịch.
5. **Check-in tại thời điểm tham quan**: Xác nhận sự có mặt thực tế của người tham gia, thường thông qua các phương thức định danh nhanh như mã QR.
6. **Hoàn thành và đánh giá**: Sau khi tour kết thúc, người tham gia có thể đánh giá, phản hồi về chất lượng chương trình, làm cơ sở cải thiện cho các tour tiếp theo.

Quy trình trên cho thấy đặc điểm nghiệp vụ có **tính trạng thái (state-driven)** rõ rệt: mỗi tour và mỗi lượt đăng ký đều di chuyển qua một chuỗi trạng thái xác định (chờ duyệt → đã duyệt/từ chối, chờ xử lý → đã xác nhận → đã thanh toán → đã check-in → hoàn thành), đây là cơ sở lý thuyết quan trọng cho việc thiết kế mô hình dữ liệu và máy trạng thái (state machine) của hệ thống.

### 1.1.3. Công nghệ và mô hình kiến trúc được áp dụng

Trên cơ sở lý thuyết về hệ thống thông tin quản lý nhiều lớp, hệ thống lựa chọn các công nghệ sau:

**Backend – ASP.NET Core 8.0 (Web API):**
ASP.NET Core là framework mã nguồn mở của Microsoft cho phép xây dựng REST API theo mô hình MVC (Model – View – Controller), trong đó tầng View được thay thế bằng các DTO (Data Transfer Object) trả về dữ liệu dạng JSON. Hệ thống sử dụng:
- **Entity Framework Core (EF Core)** làm công cụ ORM (Object-Relational Mapping), cho phép thao tác với cơ sở dữ liệu thông qua các đối tượng .NET thay vì viết SQL thủ công, đồng thời hỗ trợ quản lý phiên bản schema qua cơ chế Migration.
- **PostgreSQL** làm hệ quản trị cơ sở dữ liệu quan hệ, phù hợp với dữ liệu có cấu trúc và các mối quan hệ ràng buộc chặt giữa tour, đăng ký, thanh toán, check-in.
- **JWT (JSON Web Token)** cho cơ chế xác thực không trạng thái (stateless authentication), cho phép client đính kèm token đã được ký số trong mỗi yêu cầu để xác minh danh tính mà không cần lưu session phía server.
- **SignalR** – thư viện hỗ trợ giao tiếp thời gian thực hai chiều giữa server và client qua WebSocket, làm nền tảng lý thuyết cho cơ chế thông báo (notification) tức thời khi trạng thái tour/đăng ký thay đổi.
- **QRCoder** – thư viện sinh mã QR, áp dụng lý thuyết mã hóa thông tin định danh (registration ID) thành hình ảnh ma trận hai chiều, phục vụ việc xác minh nhanh tại điểm check-in.

**Frontend – React và kiến trúc Single Page Application (SPA):**
React là thư viện JavaScript theo mô hình component-based, cho phép xây dựng giao diện như tập hợp các thành phần độc lập, tái sử dụng được, quản lý trạng thái cục bộ/toàn cục một cách tường minh. Kết hợp với:
- **Vite** làm công cụ build, tận dụng ES Module gốc của trình duyệt để tăng tốc độ phát triển và biên dịch.
- **Material UI (Soft UI Dashboard)** cung cấp hệ thống thiết kế (design system) nhất quán cho khu vực quản trị/dashboard.
- **React Router** triển khai định tuyến phía client, kết hợp với cơ chế bảo vệ route theo vai trò người dùng (role-based routing), là minh chứng áp dụng thực tế của lý thuyết RBAC ở tầng giao diện.

Song song với SPA quản trị, hệ thống còn duy trì một **trang giới thiệu/landing page tĩnh** (HTML/CSS/JS) phục vụ mục đích truyền thông, hiển thị thông tin công khai cho người dùng chưa đăng nhập – một mô hình phổ biến trong các hệ thống quản lý có nhu cầu vừa quảng bá vừa vận hành nghiệp vụ.

**Lưu trữ và dịch vụ phụ trợ:** hệ thống áp dụng mô hình lưu trữ đối tượng (object storage) tương thích S3 để lưu file/ảnh tải lên (minh chứng thanh toán, ảnh đại diện…), và dịch vụ gửi email (SMTP) cho việc xác thực tài khoản – đây là các thành phần lý thuyết thuộc nhóm dịch vụ hạ tầng (infrastructure services) hỗ trợ cho nghiệp vụ chính.

## 1.2. Khảo sát hiện trạng

### 1.2.1. Hiện trạng quản lý tour tham quan doanh nghiệp

Trước khi có một hệ thống chuyên biệt, hoạt động tổ chức tour tham quan doanh nghiệp tại các trường đại học/khoa thường được thực hiện theo phương pháp thủ công hoặc bán thủ công, cụ thể:

- **Thông tin tour** được thông báo rời rạc qua nhiều kênh khác nhau như email, nhóm chat (Zalo, Facebook), bảng tin khoa/phòng công tác sinh viên, dẫn đến thông tin dễ bị thất lạc, không đồng bộ và khó tra cứu lại khi cần.
- **Đăng ký tham gia** thường thực hiện qua biểu mẫu trực tuyến rời rạc (Google Form) hoặc đăng ký trực tiếp, không liên kết với một hệ thống quản lý chung, khiến đơn vị tổ chức khó kiểm soát số lượng đăng ký theo thời gian thực, khó xử lý các trường hợp vượt quá sức chứa (cần danh sách chờ).
- **Phê duyệt nội dung tour** trước khi công bố hầu như không có quy trình chính thức, dễ dẫn đến rủi ro về thông tin sai lệch hoặc tour không phù hợp được công bố rộng rãi.
- **Thanh toán** (đối với các tour có thu phí) được thực hiện thủ công bằng chuyển khoản trực tiếp và xác minh bằng cách kiểm tra sao kê hoặc ảnh chụp màn hình gửi qua tin nhắn, dễ xảy ra sai sót, khó truy vết và đối soát.
- **Xác nhận tham gia thực tế (check-in)** tại địa điểm tham quan thường dựa vào việc gọi tên/ký danh sách giấy, tốn thời gian, dễ nhầm lẫn hoặc bỏ sót.
- **Thu thập phản hồi sau tour** gần như không được thực hiện có hệ thống, hoặc nếu có thì dữ liệu phản hồi nằm rời rạc, không gắn liền với lịch sử tham gia của từng người, gây khó khăn cho việc đánh giá chất lượng tour theo thời gian.
- **Báo cáo, thống kê** (số lượng tour, số lượt đăng ký, doanh thu nếu có…) phải tổng hợp thủ công từ nhiều nguồn dữ liệu phân tán, tốn nhiều thời gian và dễ sai lệch.

### 1.2.2. Hạn chế của phương pháp quản lý hiện tại

Từ khảo sát trên, có thể tổng hợp các hạn chế chính như sau:

| STT | Hạn chế | Hệ quả |
|---|---|---|
| 1 | Thông tin tour phân tán trên nhiều kênh | Người dùng khó tiếp cận đầy đủ, kịp thời thông tin |
| 2 | Không có cơ chế phê duyệt tập trung | Rủi ro công bố thông tin sai lệch, thiếu kiểm soát |
| 3 | Đăng ký không đồng bộ, không real-time | Khó quản lý số lượng, không tự động xử lý danh sách chờ |
| 4 | Thanh toán và đối soát thủ công | Tốn thời gian, thiếu minh bạch, dễ tranh chấp |
| 5 | Check-in bằng phương pháp thủ công | Tốn nhân lực, độ chính xác thấp, không có dữ liệu thời gian thực |
| 6 | Không thu thập phản hồi có hệ thống | Thiếu cơ sở dữ liệu để cải thiện chất lượng tour |
| 7 | Không có thông báo tức thời | Người dùng không được cập nhật kịp thời về thay đổi trạng thái |
| 8 | Báo cáo thủ công, phân tán | Tốn thời gian tổng hợp, khó hỗ trợ ra quyết định nhanh |

### 1.2.3. Yêu cầu đối với hệ thống

Từ các hạn chế đã phân tích, hệ thống cần xây dựng đáp ứng các yêu cầu sau:

**Yêu cầu chức năng:**
- Cho phép doanh nghiệp/đơn vị tổ chức tạo, cập nhật thông tin tour tham quan (thời gian, địa điểm, số lượng, thời gian mở/đóng đăng ký).
- Cung cấp cơ chế phê duyệt tour bởi quản trị viên trước khi công bố công khai, cùng khả năng từ chối hoặc lưu trữ (archive) tour.
- Cho phép sinh viên xem danh sách tour đã công bố, đăng ký tham gia, và theo dõi trạng thái đăng ký của bản thân theo thời gian thực.
- Hỗ trợ quy trình duyệt đăng ký, đưa vào danh sách chờ khi vượt số lượng cho phép.
- Hỗ trợ thanh toán trực tuyến (tạo mã thanh toán/QR chuyển khoản), tải minh chứng thanh toán và xác nhận thanh toán bởi đơn vị tổ chức/quản trị viên.
- Cung cấp cơ chế check-in bằng mã QR để xác nhận sự tham gia thực tế.
- Cho phép người tham gia gửi phản hồi, đánh giá sau khi tour hoàn thành.
- Gửi thông báo thời gian thực đến người dùng khi có thay đổi liên quan (tour được duyệt, đăng ký được xác nhận, thanh toán được ghi nhận…).
- Cung cấp số liệu thống kê, báo cáo tổng quan cho quản trị viên và đơn vị tổ chức.

**Yêu cầu phi chức năng:**
- Đảm bảo phân quyền rõ ràng theo vai trò (sinh viên, doanh nghiệp/đơn vị tổ chức, quản trị viên), mỗi vai trò chỉ truy cập được chức năng phù hợp.
- Đảm bảo an toàn thông tin tài khoản thông qua xác thực bằng JWT và xác thực email khi đăng ký.
- Hệ thống phải có khả năng mở rộng, dễ bảo trì nhờ kiến trúc phân lớp (Controller – Service – DTO – Entity).
- Đảm bảo tính tức thời trong việc cập nhật trạng thái và thông báo cho người dùng.
- Giao diện thân thiện, phù hợp cho cả người dùng quản trị (dashboard) và người dùng cuối truy cập từ nhiều thiết bị.

## 1.3. Kết luận chương

Chương này đã trình bày cơ sở lý thuyết về hệ thống thông tin quản lý, quy trình nghiệp vụ tổ chức tour tham quan doanh nghiệp trong môi trường đại học, cùng các công nghệ nền tảng (ASP.NET Core, EF Core, PostgreSQL, JWT, SignalR, React) được lựa chọn để xây dựng hệ thống. Kết quả khảo sát hiện trạng cho thấy phương pháp quản lý thủ công hiện nay còn nhiều hạn chế về tính tập trung, minh bạch và hiệu quả vận hành. Từ đó, các yêu cầu chức năng và phi chức năng đối với hệ thống đã được xác định, làm cơ sở cho việc phân tích, thiết kế hệ thống được trình bày ở các chương tiếp theo.
