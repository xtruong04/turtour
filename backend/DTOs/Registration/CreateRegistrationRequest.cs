using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Registration
{
    public class CreateRegistrationRequest
    {
        [Required(ErrorMessage = "TourId là bắt buộc.")]
        public Guid TourId { get; set; }

        [MaxLength(1000, ErrorMessage = "Ghi chú không được vượt quá 1000 ký tự.")]
        public string? Notes { get; set; }
    }
}
