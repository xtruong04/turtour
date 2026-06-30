using System.Text.Json.Serialization;
using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class Company : BaseEntity
    {
        public string? Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? Website { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public Guid? UserId { get; set; }
        public bool IsActive { get; set; } = true;

        // Tài khoản nhận thanh toán (chuẩn VietQR) — dùng để sinh mã QR khi sinh viên thanh toán
        // tour của doanh nghiệp này, thay cho tài khoản test mặc định.
        public string? BankBin { get; set; }
        public string? BankAccountNo { get; set; }
        public string? BankAccountName { get; set; }

        // Navigation
        public User? User { get; set; }
        [JsonIgnore]
        public ICollection<Tour> Tours { get; set; } = new List<Tour>();
    }
}
