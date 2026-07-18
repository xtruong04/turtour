using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.Models.Entities;
using TurTour.Models.Enums;

namespace TurTour.Services
{
    // Logic xác nhận thanh toán dùng chung cho PaymentsController (xác nhận thủ công + webhook
    // SePay) và RegistrationsController (tự động "thanh toán" cho tour miễn phí khi duyệt).
    public class PaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailService _emailService;
        private readonly ILogger<PaymentService> _logger;
        private readonly RealtimeNotifier _realtime;

        public PaymentService(ApplicationDbContext context, EmailService emailService, ILogger<PaymentService> logger, RealtimeNotifier realtime)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
            _realtime = realtime;
        }

        public async Task<Payment> ConfirmPaymentAsync(Registration registration, string paymentMethod, string? transactionCode, string? proofImageUrl, Guid? confirmerId)
        {
            var payment = await _context.Payments.FirstOrDefaultAsync(p => p.RegistrationId == registration.Id);
            if (payment == null)
            {
                payment = new Payment
                {
                    RegistrationId = registration.Id,
                    Amount = registration.Tour?.Fee ?? 0,
                    PaymentMethod = paymentMethod,
                    TransactionCode = transactionCode,
                    ProofImageUrl = proofImageUrl,
                    PaymentStatus = PaymentStatus.Paid,
                    PaidAt = DateTime.UtcNow,
                    ComfirmedBy = confirmerId,
                    ComfirmedAt = DateTime.UtcNow
                };
                _context.Payments.Add(payment);
            }
            else
            {
                payment.PaymentMethod = paymentMethod;
                payment.TransactionCode = transactionCode;
                payment.ProofImageUrl = proofImageUrl;
                payment.PaymentStatus = PaymentStatus.Paid;
                payment.PaidAt = DateTime.UtcNow;
                payment.ComfirmedBy = confirmerId;
                payment.ComfirmedAt = DateTime.UtcNow;
                payment.UpdatedAt = DateTime.UtcNow;
            }

            registration.Status = RegistrationStatus.Paid;
            registration.UpdatedAt = DateTime.UtcNow;

            var notification = new Notification
            {
                UserId = registration.StudentId,
                Title = "Thanh toán đã được xác nhận",
                Content = $"Thanh toán cho tour \"{registration.Tour?.Tittle}\" của bạn đã được xác nhận thành công.",
                Type = "Payment",
                TourId = registration.TourId,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            var checkIn = await CheckInQrHelper.GenerateOrRefreshAsync(_context, registration.Id);

            await _context.SaveChangesAsync();

            await _realtime.NotifyUserAsync(notification);
            await _realtime.NotifyAdminBoardAsync(registration.TourId, "payment-confirmed");

            if (registration.Student != null)
            {
                try
                {
                    await _emailService.SendCheckInQrEmailAsync(
                        registration.Student.Email,
                        registration.Student.FullName,
                        registration.Tour?.Tittle ?? "",
                        checkIn.QrCode);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Gửi email mã check-in thất bại cho registration {RegistrationId}.", registration.Id);
                }
            }

            return payment;
        }
    }
}
