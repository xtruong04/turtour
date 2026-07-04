using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class Feedback : BaseEntity
    {
        public Guid TourId { get; set; }
        public Guid StudentId { get; set; }
        public int Rating { get; set; } // 1 to 5
        public string? Comment { get; set; }
        public string? PhotoUrlsJson { get; set; }

        [NotMapped]
        public List<string> PhotoUrls
        {
            get => string.IsNullOrEmpty(PhotoUrlsJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(PhotoUrlsJson) ?? new List<string>();
            set => PhotoUrlsJson = value.Count == 0 ? null : JsonSerializer.Serialize(value);
        }

        //Navigation
        public Tour? Tour { get; set; }
        public User? Student { get; set; }
    }
}
