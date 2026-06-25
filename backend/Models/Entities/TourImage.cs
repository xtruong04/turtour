using System.Text.Json.Serialization;
using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class TourImage : BaseEntity
    {
        public Guid TourId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool Isthumbnail { get; set; } = false;
        public int DisplayOrder { get; set; } = 0;

        // Navigation
        [JsonIgnore]
        public Tour? Tour { get; set; }
    }
}
