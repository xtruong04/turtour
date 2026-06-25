using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class Organizator : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? Website { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? LogoUrl { get; set; }
        //FK
        public Guid UserId { get; set; }
        public User? User { get; set; }
        public bool IsActive { get; set; } = true;

        // Có thể bổ sung thêm các navigation property khác nếu cần
        public ICollection<Tour> Tours { get; set; } = new List<Tour>();
    }
}