using System.ComponentModel.DataAnnotations;

namespace TurTour.DTOs.Tour
{
    public class RejectTourRequest
    {
        // Lý do từ chối — không bắt buộc, đưa vào nội dung thông báo gửi cho người tạo tour.
        [MaxLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự.")]
        public string? Reason { get; set; }
    }
}
