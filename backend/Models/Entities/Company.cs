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

        // Navigation
        public User? User { get; set; }
        [JsonIgnore]
        public ICollection<Tour> Tours { get; set; } = new List<Tour>();
    }
}
