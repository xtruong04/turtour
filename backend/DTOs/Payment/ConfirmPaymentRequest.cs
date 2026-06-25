using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Payment
{
    public class ConfirmPaymentRequest
    {
        [Required(ErrorMessage = "RegistrationId là bắt buộc.")]
        public Guid RegistrationId { get; set; }

        [Required(ErrorMessage = "Phương thức thanh toán là bắt buộc.")]
        [MaxLength(50, ErrorMessage = "Phương thức thanh toán không được vượt quá 50 ký tự.")]
        public string PaymentMethod { get; set; } = string.Empty;

        [MaxLength(100, ErrorMessage = "Mã giao dịch không được vượt quá 100 ký tự.")]
        public string? TransactionCode { get; set; }

        [Url(ErrorMessage = "ProofImageUrl không đúng định dạng URL.")]
        [MaxLength(255, ErrorMessage = "ProofImageUrl không được vượt quá 255 ký tự.")]
        public string? ProofImageUrl { get; set; }
    }
}
