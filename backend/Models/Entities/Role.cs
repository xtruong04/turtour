using TurTour.Models.Base;
namespace TurTour.Models.Entities
{
    public class Role :BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // Navigation
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    }
}
