using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Contact
{
    public class CreateContactRequest
    {
        [Required(ErrorMessage = "Họ và tên là bắt buộc.")]
        [StringLength(100, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tiêu đề là bắt buộc.")]
        [StringLength(200, MinimumLength = 2)]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Nội dung là bắt buộc.")]
        [StringLength(2000, MinimumLength = 5)]
        public string Message { get; set; } = string.Empty;
    }
}
