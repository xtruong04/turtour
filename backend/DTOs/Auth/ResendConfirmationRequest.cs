using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Auth
{
    public class ResendConfirmationRequest
    {
        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = string.Empty;
    }
}
