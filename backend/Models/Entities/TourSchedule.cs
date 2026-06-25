using System.Text.Json.Serialization;
using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class TourSchedule : BaseEntity
    {
        public Guid TourId { get; set; }
        public string Tittle { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int OrderIndex { get; set; }

        //Navigation
        [JsonIgnore]
        public Tour? Tour { get; set; } 
    }
}
