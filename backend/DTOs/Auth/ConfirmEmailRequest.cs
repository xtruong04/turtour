using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Auth
{
    public class ConfirmEmailRequest
    {
        [Required(ErrorMessage = "Token là bắt buộc.")]
        public string Token { get; set; } = string.Empty;
    }
}
