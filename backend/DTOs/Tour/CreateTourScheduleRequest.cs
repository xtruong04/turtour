using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Tour
{
    public class CreateTourScheduleRequest : IValidatableObject
    {
        [Required(ErrorMessage = "Tiêu đề lịch trình là bắt buộc.")]
        [MinLength(3, ErrorMessage = "Tiêu đề lịch trình phải có ít nhất 3 ký tự.")]
        [MaxLength(200, ErrorMessage = "Tiêu đề lịch trình không được vượt quá 200 ký tự.")]
        public string Tittle { get; set; } = string.Empty;

        [MaxLength(500000, ErrorMessage = "Mô tả lịch trình không được vượt quá 500000 ký tự.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc.")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc là bắt buộc.")]
        public DateTime EndDate { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Thứ tự lịch trình phải lớn hơn 0.")]
        public int OrderIndex { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (EndDate < StartDate)
            {
                yield return new ValidationResult(
                    "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.",
                    new[] { nameof(EndDate) });
            }
        }
    }
}
