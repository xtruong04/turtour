using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Feedback
{
    public class CreateFeedbackRequest
    {
        [Required(ErrorMessage = "TourId là bắt buộc.")]
        public Guid TourId { get; set; }

        [Range(1, 5, ErrorMessage = "Điểm đánh giá phải nằm trong khoảng từ 1 đến 5.")]
        public int Rating { get; set; }

        [MaxLength(1000, ErrorMessage = "Nội dung đánh giá không được vượt quá 1000 ký tự.")]
        public string? Comment { get; set; }

        public List<string> PhotoUrls { get; set; } = new();
    }
}
