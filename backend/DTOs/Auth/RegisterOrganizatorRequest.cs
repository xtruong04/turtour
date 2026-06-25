using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Auth
{
    public class RegisterOrganizatorRequest
    {
        // Organizator info
        [Required(ErrorMessage = "Tên organizator là bắt buộc.")]
        [MinLength(2, ErrorMessage = "Tên organizator phải có ít nhất 2 ký tự.")]
        [MaxLength(150, ErrorMessage = "Tên organizator không được vượt quá 150 ký tự.")]
        public string OrganizatorName { get; set; } = string.Empty;

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

        [Required(ErrorMessage = "Email organizator là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Email organizator không đúng định dạng.")]
        public string OrganizatorEmail { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Số điện thoại organizator không đúng định dạng.")]
        [MaxLength(20, ErrorMessage = "Số điện thoại organizator không được vượt quá 20 ký tự.")]
        public string? OrganizatorPhone { get; set; }

        [Url(ErrorMessage = "Logo URL không đúng định dạng.")]
        [MaxLength(255, ErrorMessage = "Logo URL không được vượt quá 255 ký tự.")]
        public string? LogoUrl { get; set; }
    }
}
