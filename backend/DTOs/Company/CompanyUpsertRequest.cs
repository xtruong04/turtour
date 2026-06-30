using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Company
{
    public class CompanyUpsertRequest
    {
        [Required(ErrorMessage = "Tên công ty là bắt buộc.")]
        [MinLength(2, ErrorMessage = "Tên công ty phải có ít nhất 2 ký tự.")]
        [MaxLength(150, ErrorMessage = "Tên công ty không được vượt quá 150 ký tự.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Địa chỉ là bắt buộc.")]
        [MaxLength(255, ErrorMessage = "Địa chỉ không được vượt quá 255 ký tự.")]
        public string Address { get; set; } = string.Empty;

        [Url(ErrorMessage = "Website không đúng định dạng URL.")]
        [MaxLength(255, ErrorMessage = "Website không được vượt quá 255 ký tự.")]
        public string? Website { get; set; }

        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không đúng định dạng.")]
        [MaxLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự.")]
        public string? Phone { get; set; }

        [Url(ErrorMessage = "Logo URL không đúng định dạng.")]
        [MaxLength(255, ErrorMessage = "Logo URL không được vượt quá 255 ký tự.")]
        public string? LogoUrl { get; set; }

        [MaxLength(100, ErrorMessage = "Ngành nghề không được vượt quá 100 ký tự.")]
        public string? Industry { get; set; }
        public bool IsActive { get; set; } = true;

        [MaxLength(10, ErrorMessage = "Mã ngân hàng (BIN) không được vượt quá 10 ký tự.")]
        public string? BankBin { get; set; }

        [MaxLength(30, ErrorMessage = "Số tài khoản không được vượt quá 30 ký tự.")]
        public string? BankAccountNo { get; set; }

        [MaxLength(100, ErrorMessage = "Tên chủ tài khoản không được vượt quá 100 ký tự.")]
        public string? BankAccountName { get; set; }
    }
}
