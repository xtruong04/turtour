using System.ComponentModel.DataAnnotations;
using TurTour.Models.Enums;

namespace TurTour.DTOs.Tour
{
    public class UpdateTourStatusRequest
    {
        [Required(ErrorMessage = "Trạng thái là bắt buộc.")]
        public TourStatus Status { get; set; }
    }
}
