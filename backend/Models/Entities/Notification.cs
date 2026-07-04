using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class Notification : BaseEntity
    {
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public string Type { get; set; } = string.Empty;

        //Navigation
        public User? User { get; set; }
    }
}
