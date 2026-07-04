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

            builder.HtmlBody = $@"
                <div style=""font-family: Arial, sans-serif; color: #212529;"">
                  <h2>Thanh toán thành công!</h2>
                  <p>Xin chào {studentName},</p>
                  <p>Bạn đã thanh toán thành công cho tour <strong>{tourTitle}</strong>.</p>
                  <p>Vui lòng xuất trình mã QR dưới đây cho ban tổ chức để check-in khi tham gia tour:</p>
                  <img src=""cid:{image.ContentId}"" alt=""Mã check-in"" style=""width:220px;height:220px;"" />
                  <p style=""font-size:12px;color:#6c757d;"">Mã check-in: {qrCodeText}</p>
                </div>";

            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);

            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            if (!string.IsNullOrWhiteSpace(username))
            {
                await client.AuthenticateAsync(username, password ?? string.Empty);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
