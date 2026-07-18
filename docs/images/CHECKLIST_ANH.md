# Checklist ảnh chụp màn hình cho HUONG_DAN_NGUOI_DUNG.md

Đặt ảnh (định dạng `.png`, ưu tiên độ rộng ~1280–1600px) đúng tên vào thư mục `docs/images/`. Sau khi thêm, mở lại `docs/HUONG_DAN_NGUOI_DUNG.md` bằng trình xem Markdown (VD: preview trong VS Code) là ảnh sẽ tự hiện.

Mẹo chụp: dùng `Win + Shift + S` (Snipping Tool) để cắt đúng vùng nội dung, tránh lộ thanh địa chỉ trình duyệt/thông tin nhạy cảm khác (token, số điện thoại thật...). Nếu dữ liệu demo dùng email/SĐT thật, nên thay bằng dữ liệu giả trước khi chụp.

## Chuẩn bị tài khoản demo

Trước khi chụp cần có tối thiểu:
- 1 tài khoản **Sinh viên** (đã xác thực email)
- 1 tài khoản **Doanh nghiệp** (đã xác thực email, đã khai tài khoản ngân hàng)
- 1 tài khoản **Admin**
- Ít nhất 1 tour **có phí** và 1 tour **miễn phí** để minh họa cả hai luồng thanh toán
- 1 đăng ký đã đi hết vòng đời: `Pending → Approved → Paid → CheckedIn → Completed` (để chụp được màn hình đánh giá)

## Danh sách ảnh

### Chung (mục 1–2)

| File | Chụp gì |
|---|---|
| `00-trang-chu.png` | Trang chủ công khai (`dewi/index.html` hoặc landing page) |
| `01-dang-ky-chon-hinh-thuc.png` | Màn hình cho chọn đăng ký Sinh viên/Doanh nghiệp/Tổ chức |
| `02-dang-ky-sinh-vien.png` | Form đăng ký tài khoản Sinh viên đã điền (che/làm mờ email thật nếu cần) |
| `03-email-xac-thuc.png` | Email xác thực nhận được trong hộp thư (che địa chỉ email người nhận) |
| `04-xac-thuc-thanh-cong.png` | Thông báo "Xác thực email thành công" sau khi bấm link |
| `05-dang-nhap.png` | Form đăng nhập |
| `06-ho-so-ca-nhan.png` | Trang hồ sơ cá nhân (bất kỳ vai trò nào, ví dụ Sinh viên) |

### Khách / Sinh viên (mục 3)

| File | Chụp gì |
|---|---|
| `10-danh-sach-tour.png` | Trang danh sách tour (`tours.html`) |
| `11-chi-tiet-tour.png` | Trang chi tiết 1 tour (`tour-details.html`), cuộn tới phần đánh giá nếu có |
| `12-tour-da-luu.png` | Trang tour đã lưu (`saved-tours.html`) — cần lưu ít nhất 1 tour trước |
| `13-form-dang-ky.png` | Hộp thoại/form đăng ký tour đang mở, trước khi bấm xác nhận |
| `14-dang-ky-thanh-cong.png` | Thông báo đăng ký thành công (toast/alert) |
| `15-tour-cua-toi.png` | Trang "Tour của tôi" (`my-tours.html`) — nên có nhiều dòng trạng thái khác nhau nếu được (Pending, Approved, Paid...) |
| `16-thanh-toan-qr.png` | Khối hiển thị mã QR chuyển khoản + nội dung chuyển khoản trên "Tour của tôi" |
| `17-ma-qr-checkin.png` | Modal "Mã check-in" hiển thị QR |
| `18-danh-gia-tour.png` | Form đánh giá tour (đang mở, có thể điền sẵn vài sao + nhận xét mẫu) |
| `19-thong-bao.png` | Danh sách thông báo (`notifications.html`) hoặc dropdown chuông thông báo |

### Doanh nghiệp / Tổ chức (mục 4)

| File | Chụp gì |
|---|---|
| `20-dashboard-doi-tac.png` | `/partner/dashboard` |
| `21-tao-tour-thong-tin.png` | `/partner/tours/create` — phần thông tin chung đã điền mẫu |
| `22-tao-tour-upload-anh.png` | Khối upload/crop ảnh đại diện tour đang mở |
| `23-tao-tour-lich-trinh.png` | Khối "Thêm ngày" với ít nhất 2 lịch trình đã thêm |
| `24-tour-cho-duyet.png` | Thông báo/toast "Tour đã được tạo, đang chờ Admin xét duyệt" hoặc badge trạng thái "Chờ duyệt" |
| `25-danh-sach-tour-doi-tac.png` | `/partner/tours` — danh sách tour với nhiều trạng thái khác nhau |
| `26-quan-ly-dang-ky.png` | `/partner/tours/:id/registrations` — bảng danh sách đăng ký với nút thao tác hiện rõ |
| `27-xac-nhan-thanh-toan.png` | Hộp thoại "Xác nhận thanh toán" đang mở, đã điền phương thức + mã giao dịch |
| `28-quet-qr-checkin.png` | Ô quét mã QR (camera đang bật hoặc khung nhập mã tay) trên trang quản lý đăng ký |
| `29-cai-dat-thanh-toan.png` | `/partner/payment-settings` — chế độ xem sau khi đã lưu, có preview mã QR |
| `30-bao-cao-doi-tac.png` | `/partner/reports` |

### Admin (mục 5)

| File | Chụp gì |
|---|---|
| `40-dashboard-admin.png` | `/admin/dashboard` |
| `41-tour-cho-duyet.png` | `/admin/tours/pending-approval` — danh sách tour chờ duyệt |
| `42-tu-choi-tour.png` | Hộp thoại từ chối tour đang mở, có ô nhập lý do |
| `43-quan-ly-tour-admin.png` | `/admin/tours` — danh sách toàn bộ tour |
| `44-quan-ly-doanh-nghiep.png` | `/admin/companies` |
| `45-quan-ly-thanh-toan.png` | `/admin/payments` — có 2 thẻ tổng hợp doanh thu ở đầu trang |
| `46-quan-ly-lien-he.png` | `/admin/contacts` |
| `47-bao-cao-admin.png` | `/admin/reports` |

## Sau khi có đủ ảnh

Không cần sửa gì thêm trong `HUONG_DAN_NGUOI_DUNG.md` — các đường dẫn ảnh đã trỏ sẵn tới `images/<tên-file>.png`. Nếu muốn xuất file này sang PDF/Word để nộp báo cáo, có thể mở bằng VS Code (extension "Markdown PDF") hoặc Pandoc:

```bash
pandoc docs/HUONG_DAN_NGUOI_DUNG.md -o docs/HUONG_DAN_NGUOI_DUNG.pdf --resource-path=docs
```
