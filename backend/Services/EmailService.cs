using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Utils;
using QRCoder;

namespace TurTour.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private static byte[] GenerateQrPng(string text)
        {
            using var generator = new QRCodeGenerator();
            using var qrData = generator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
            var pngQrCode = new PngByteQRCode(qrData);
            return pngQrCode.GetGraphic(20);
        }

        // Khung email dùng chung cho mọi mail hệ thống — bố cục bảng (table) thay vì flex/grid vì
        // Outlook desktop render bằng engine Word, không hỗ trợ CSS hiện đại; toàn bộ style inline
        // vì Gmail/một số client strip thẻ <style>. Màu #e84545 là accent chính của TurTour (đồng bộ
        // với public/dewi/assets/css/main.css).
        private static string BuildEmailShell(string title, string bodyHtml, string footerNote)
        {
            return $@"
            <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#f1f3f5;padding:32px 16px;"">
              <tr>
                <td align=""center"">
                  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;"">
                    <tr>
                      <td style=""background:#e84545;padding:24px 32px;"">
                        <span style=""font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.02em;"">TurTour</span>
                      </td>
                    </tr>
                    <tr>
                      <td style=""padding:36px 32px 8px 32px;"">
                        <h1 style=""margin:0 0 16px 0;font-size:21px;line-height:1.3;color:#1a1a2e;"">{title}</h1>
                        {bodyHtml}
                      </td>
                    </tr>
                    <tr>
                      <td style=""padding:24px 32px 32px 32px;"">
                        <p style=""margin:0;font-size:12px;line-height:1.6;color:#adb5bd;border-top:1px solid #f1f3f5;padding-top:16px;"">{footerNote}</p>
                      </td>
                    </tr>
                  </table>
                  <p style=""margin:16px 0 0 0;font-size:11px;color:#adb5bd;font-family:Helvetica,Arial,sans-serif;"">
                    Email này được gửi tự động từ TurTour, vui lòng không trả lời trực tiếp email này.
                  </p>
                </td>
              </tr>
            </table>";
        }

        public async Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmUrl)
        {
            var host = _configuration["Smtp:Host"];
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(toEmail))
            {
                return;
            }

            var port = int.TryParse(_configuration["Smtp:Port"], out var parsedPort) ? parsedPort : 587;
            var useSsl = !bool.TryParse(_configuration["Smtp:UseSsl"], out var parsedSsl) || parsedSsl;
            var fromEmail = _configuration["Smtp:FromEmail"] ?? host;
            var fromName = _configuration["Smtp:FromName"] ?? "TurTour";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(fullName, toEmail));
            message.Subject = "Xác thực email tài khoản TurTour";

            var body = $@"
                <p style=""margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#495057;"">
                  Xin chào <strong>{fullName}</strong>,
                </p>
                <p style=""margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#495057;"">
                  Cảm ơn bạn đã đăng ký tài khoản TurTour. Bấm nút dưới đây để xác thực email và hoàn tất đăng ký.
                </p>
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" style=""margin:0 0 28px 0;"">
                  <tr>
                    <td style=""border-radius:8px;background:#e84545;"">
                      <a href=""{confirmUrl}"" style=""display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;"">
                        Xác thực email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style=""margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#8392ab;"">
                  Nếu nút không hoạt động, dán đường dẫn này vào trình duyệt:
                </p>
                <p style=""margin:0;font-size:13px;line-height:1.6;word-break:break-all;""><a href=""{confirmUrl}"" style=""color:#e84545;"">{confirmUrl}</a></p>";

            var builder = new BodyBuilder
            {
                HtmlBody = BuildEmailShell(
                    "Xác thực email của bạn",
                    body,
                    "Liên kết có hiệu lực trong 24 giờ. Nếu bạn không thực hiện yêu cầu đăng ký này, hãy bỏ qua email này.")
            };

            message.Body = builder.ToMessageBody();

            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(12));
            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto, cts.Token);

            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            if (!string.IsNullOrWhiteSpace(username))
            {
                await client.AuthenticateAsync(username, password ?? string.Empty, cts.Token);
            }

            await client.SendAsync(message, cancellationToken: cts.Token);
            await client.DisconnectAsync(true, cts.Token);
        }

        public async Task SendCheckInQrEmailAsync(string toEmail, string studentName, string tourTitle, string qrCodeText)
        {
            var host = _configuration["Smtp:Host"];
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(toEmail))
            {
                // Chưa cấu hình SMTP hoặc không có email người nhận — bỏ qua, không chặn luồng xác nhận thanh toán.
                return;
            }

            var port = int.TryParse(_configuration["Smtp:Port"], out var parsedPort) ? parsedPort : 587;
            var useSsl = !bool.TryParse(_configuration["Smtp:UseSsl"], out var parsedSsl) || parsedSsl;
            var fromEmail = _configuration["Smtp:FromEmail"] ?? host;
            var fromName = _configuration["Smtp:FromName"] ?? "TurTour";

            var qrBytes = GenerateQrPng(qrCodeText);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress(studentName, toEmail));
            message.Subject = $"Mã check-in cho tour \"{tourTitle}\"";

            var builder = new BodyBuilder();
            var image = builder.LinkedResources.Add("qrcode.png", qrBytes, new ContentType("image", "png"));
            image.ContentId = MimeUtils.GenerateMessageId();

            var body = $@"
                <p style=""margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#495057;"">
                  Xin chào <strong>{studentName}</strong>,
                </p>
                <p style=""margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#495057;"">
                  Bạn đã thanh toán thành công cho tour <strong>{tourTitle}</strong>. Vui lòng xuất trình mã QR dưới đây cho ban tổ chức để check-in khi tham gia tour.
                </p>
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" style=""margin:0 0 20px 0;"">
                  <tr>
                    <td style=""padding:16px;background:#f1f3f5;border-radius:12px;"">
                      <img src=""cid:{image.ContentId}"" alt=""Mã check-in"" width=""200"" height=""200"" style=""display:block;width:200px;height:200px;border-radius:8px;background:#ffffff;"" />
                    </td>
                  </tr>
                </table>
                <p style=""margin:0;font-size:13px;line-height:1.6;color:#8392ab;"">
                  Mã check-in: <span style=""font-family:monospace;color:#1a1a2e;"">{qrCodeText}</span>
                </p>";

            builder.HtmlBody = BuildEmailShell(
                "Thanh toán thành công!",
                body,
                "Vui lòng giữ email này hoặc lưu lại mã QR để xuất trình khi check-in tại sự kiện.");

            message.Body = builder.ToMessageBody();

            using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(12));
            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto, cts.Token);

            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            if (!string.IsNullOrWhiteSpace(username))
            {
                await client.AuthenticateAsync(username, password ?? string.Empty, cts.Token);
            }

            await client.SendAsync(message, cancellationToken: cts.Token);
            await client.DisconnectAsync(true, cts.Token);
        }
    }
}
