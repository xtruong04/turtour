using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Auth
{
    public class UpdateProfileRequest
    {
        [Required(ErrorMessage = "Họ và tên là bắt buộc.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ và tên phải từ 2 đến 100 ký tự.")]
        public string FullName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ.")]
        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        [Url(ErrorMessage = "URL ảnh đại diện không hợp lệ.")]
        [StringLength(500)]
        public string? AvatarUrl { get; set; }
    }
}
