using System.ComponentModel.DataAnnotations;
using TurTour.Models.Enums;

namespace TurTour.DTOs.Tour
{
    public class TourUpsertRequest : IValidatableObject
    {
        [Required(ErrorMessage = "Mã tour là bắt buộc.")]
        [MaxLength(50, ErrorMessage = "Mã tour không được vượt quá 50 ký tự.")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tiêu đề tour là bắt buộc.")]
        [MinLength(3, ErrorMessage = "Tiêu đề tour phải có ít nhất 3 ký tự.")]
        [MaxLength(200, ErrorMessage = "Tiêu đề tour không được vượt quá 200 ký tự.")]
        public string Tittle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mô tả tour là bắt buộc.")]
        [MinLength(10, ErrorMessage = "Mô tả tour phải có ít nhất 10 ký tự.")]
        [MaxLength(500000, ErrorMessage = "Mô tả tour không được vượt quá 500000 ký tự.")]
        public string Decriptions { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa điểm là bắt buộc.")]
        [MaxLength(255, ErrorMessage = "Địa điểm không được vượt quá 255 ký tự.")]
        public string Location { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc.")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc là bắt buộc.")]
        public DateTime EndDate { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng tham gia tối đa phải lớn hơn 0.")]
        public int MaxParticipants { get; set; }

        [Range(typeof(decimal), "0.01", "9999999999999999", ErrorMessage = "Chi phí tour phải lớn hơn 0.")]
        public decimal Fee { get; set; }
        public TourStatus Status { get; set; } = TourStatus.Upcoming;

        [MaxLength(1000, ErrorMessage = "Yêu cầu không được vượt quá 1000 ký tự.")]
        public string? Requirement { get; set; }

        [MaxLength(500000, ErrorMessage = "Thumbnail không được vượt quá 500000 ký tự.")]
        public string? ThumbnailUrl { get; set; }

        public Guid? CompanyId { get; set; }

        [MaxLength(255, ErrorMessage = "Tên công ty không được vượt quá 255 ký tự.")]
        public string? CompanyName { get; set; }

        // Lịch trình gửi kèm khi tạo tour mới — tạo cùng tour trong 1 transaction,
        // lỗi ở đâu thì rollback toàn bộ, không để tour được lưu mà thiếu lịch trình.
        public List<CreateTourScheduleRequest>? Schedules { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (EndDate < StartDate)
            {
                yield return new ValidationResult(
                    "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.",
                    new[] { nameof(EndDate) });
            }

            if (!string.IsNullOrWhiteSpace(ThumbnailUrl) && !IsSupportedImageSource(ThumbnailUrl))
            {
                yield return new ValidationResult(
                    "Thumbnail phải là đường dẫn http/https hợp lệ hoặc data URL của ảnh.",
                    new[] { nameof(ThumbnailUrl) });
            }

            if (CompanyId == null && string.IsNullOrWhiteSpace(CompanyName))
            {
                yield return new ValidationResult(
                    "Vui lòng nhập tên công ty hoặc cung cấp CompanyId.",
                    new[] { nameof(CompanyName), nameof(CompanyId) });
            }
        }

        private static bool IsSupportedImageSource(string value)
        {
            if (value.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return Uri.TryCreate(value, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        }
    }
}
