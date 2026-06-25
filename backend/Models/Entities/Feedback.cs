using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class Feedback : BaseEntity
    {
        public Guid TourId { get; set; }
        public Guid StudentId { get; set; }
        public int Rating { get; set; } // 1 to 5
        public string? Comment { get; set; }

        //Navigation
        public Tour? Tour { get; set; }
        public User? Student { get; set; }
    }
}
