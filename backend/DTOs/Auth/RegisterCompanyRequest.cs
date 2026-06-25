using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Auth
{
    public class RegisterCompanyRequest
    {
        // Company info
        [Required(ErrorMessage = "Tên công ty là bắt buộc.")]
        [MinLength(2, ErrorMessage = "Tên công ty phải có ít nhất 2 ký tự.")]
        [MaxLength(150, ErrorMessage = "Tên công ty không được vượt quá 150 ký tự.")]
        public string CompanyName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu là bắt buộc.")]
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        [MaxLength(100, ErrorMessage = "Mật khẩu không được vượt quá 100 ký tự.")]
        public string Password { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Địa chỉ là bắt buộc.")]
        [MaxLength(255, ErrorMessage = "Địa chỉ không được vượt quá 255 ký tự.")]
        public string Address { get; set; } = string.Empty;

        [Url(ErrorMessage = "Website không đúng định dạng URL.")]
        [MaxLength(255, ErrorMessage = "Website không được vượt quá 255 ký tự.")]
        public string? Website { get; set; }

        [Required(ErrorMessage = "Email công ty là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email công ty không đúng định dạng.")]
        public string CompanyEmail { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại công ty không đúng định dạng.")]
        [MaxLength(20, ErrorMessage = "Số điện thoại công ty không được vượt quá 20 ký tự.")]
        public string? CompanyPhone { get; set; }

        [Url(ErrorMessage = "Logo URL không đúng định dạng.")]
        [MaxLength(255, ErrorMessage = "Logo URL không được vượt quá 255 ký tự.")]
        public string? LogoUrl { get; set; }

        [MaxLength(100, ErrorMessage = "Ngành nghề không được vượt quá 100 ký tự.")]
        public string? Industry { get; set; }
    }
}
