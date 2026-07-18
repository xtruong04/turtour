using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TurTour.Data;
using TurTour.DTOs.Payment;
using TurTour.Helpers;
using TurTour.Models.Entities;
using TurTour.Models.Enums;
using TurTour.Services;

namespace TurTour.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PaymentsController> _logger;
        private readonly IConfiguration _configuration;
        private readonly PaymentService _paymentService;

        public PaymentsController(ApplicationDbContext context, ILogger<PaymentsController> logger, IConfiguration configuration, PaymentService paymentService)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _paymentService = paymentService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> GetAll()
        {
            IQueryable<Payment> query = _context.Payments
                .Include(p => p.Registration)
                .ThenInclude(r => r!.Tour);

            if (User.IsInRole("Company"))
            {
                var companyId = await GetOwnCompanyIdAsync();
                if (companyId == null)
                {
                    return Ok(Array.Empty<Payment>());
                }
                query = query.Where(p => p.Registration != null && p.Registration.Tour != null && p.Registration.Tour.CompanyId == companyId);
            }

            var items = await query.OrderByDescending(p => p.PaidAt).ToListAsync();
            return Ok(items);
        }

        // Công ty chỉ thuộc 1 doanh nghiệp duy nhất gắn với tài khoản — dùng để giới hạn
        // GetAll/Confirm chỉ thấy/đụng được thanh toán của tour thuộc doanh nghiệp đó.
        private async Task<Guid?> GetOwnCompanyIdAsync()
        {
            var userId = CurrentUserHelper.GetUserId(User);
            if (userId == null)
            {
                return null;
            }

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == userId);
            return company?.Id;
        }

        [HttpPost("confirm")]
        [Authorize(Roles = "Admin,Organizator,Company")]
        public async Task<IActionResult> Confirm(ConfirmPaymentRequest request)
        {
            var confirmerId = CurrentUserHelper.GetUserId(User);
            if (confirmerId == null)
            {
                return Unauthorized();
            }

            var registration = await _context.Registrations
                .Include(r => r.Tour)
                .Include(r => r.Student)
                .FirstOrDefaultAsync(r => r.Id == request.RegistrationId);
            if (registration == null)
            {
                return NotFound(new { message = "Registration not found." });
            }

            if (User.IsInRole("Company"))
            {
                var companyId = await GetOwnCompanyIdAsync();
                if (companyId == null || registration.Tour?.CompanyId != companyId)
                {
                    return Forbid();
                }
            }

            var payment = await _paymentService.ConfirmPaymentAsync(registration, request.PaymentMethod, request.TransactionCode, request.ProofImageUrl, confirmerId);
            return Ok(payment);
        }

        // Webhook nhận thông báo giao dịch tự động từ SePay (https://docs.sepay.vn) — dùng để
        // tự xác nhận thanh toán khi sinh viên chuyển khoản đúng nội dung, không cần admin bấm tay.
        // Cấu hình Webhook URL trên SePay Dashboard trỏ về endpoint này.
        [HttpPost("sepay-webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> SepayWebhook(SepayWebhookRequest request)
        {
            var expectedApiKey = _configuration["Sepay:ApiKey"];
            if (!string.IsNullOrWhiteSpace(expectedApiKey))
            {
                var authHeader = Request.Headers["Authorization"].ToString();
                if (authHeader != $"Apikey {expectedApiKey}")
                {
                    return Unauthorized();
                }
            }

            if (!string.Equals(request.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { success = true, message = "Ignored: not an incoming transfer." });
            }

            var content = request.Content ?? request.Description ?? "";
            var codeMatch = Regex.Match(content, "[0-9a-fA-F]{8}");
            if (!codeMatch.Success)
            {
                _logger.LogWarning("SePay webhook: không tìm thấy mã đăng ký trong nội dung chuyển khoản \"{Content}\".", content);
                return Ok(new { success = true, message = "No registration code found in content." });
            }

            var shortCode = codeMatch.Value.ToLowerInvariant();
            var candidates = await _context.Registrations
                .Include(r => r.Tour)
                .Include(r => r.Student)
                .Where(r => r.Status == RegistrationStatus.Approved)
                .ToListAsync();

            var registration = candidates.FirstOrDefault(r => r.Id.ToString("N").Substring(0, 8) == shortCode);
            if (registration == null)
            {
                _logger.LogWarning("SePay webhook: không khớp đăng ký nào với mã \"{Code}\".", shortCode);
                return Ok(new { success = true, message = "No matching registration." });
            }

            if (registration.Tour != null && request.TransferAmount < registration.Tour.Fee)
            {
                _logger.LogWarning("SePay webhook: số tiền chuyển ({Amount}) thấp hơn phí tour ({Fee}) cho đăng ký {RegistrationId}.",
                    request.TransferAmount, registration.Tour.Fee, registration.Id);
                return Ok(new { success = true, message = "Transfer amount is lower than tour fee." });
            }

            await _paymentService.ConfirmPaymentAsync(registration, "SePay", request.ReferenceCode, null, null);
            return Ok(new { success = true, message = "Payment confirmed.", registrationId = registration.Id });
        }

        [HttpGet("revenue")]
        [Authorize(Roles = "Admin,Organizator")]
        public async Task<IActionResult> Revenue()
        {
            var paidPayments = _context.Payments.Where(p => p.PaymentStatus == PaymentStatus.Paid);
            var totalRevenue = await paidPayments.SumAsync(p => p.Amount);
            var totalCount = await paidPayments.CountAsync();

            return Ok(new
            {
                totalRevenue,
                totalCount
            });
        }
    }
}
