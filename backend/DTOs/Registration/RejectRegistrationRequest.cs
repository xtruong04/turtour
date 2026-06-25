using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Registration
{
    public class RejectRegistrationRequest
    {
        [Required(ErrorMessage = "Lý do từ chối là bắt buộc.")]
        [MinLength(3, ErrorMessage = "Lý do từ chối phải có ít nhất 3 ký tự.")]
        [MaxLength(500, ErrorMessage = "Lý do từ chối không được vượt quá 500 ký tự.")]
        public string Reason { get; set; } = string.Empty;
    }
}
