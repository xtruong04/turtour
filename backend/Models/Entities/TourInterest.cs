using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    // Sinh viên đánh dấu "Quan tâm" một tour đang ở trạng thái Sắp diễn ra (Upcoming) —
    // khi tour chuyển sang Mở đăng ký (Open), hệ thống gửi thông báo cho các sinh viên này.
    public class TourInterest : BaseEntity
    {
        public Guid TourId { get; set; }
        public Guid StudentId { get; set; }

        //Navigation
        public Tour? Tour { get; set; }
        public User? Student { get; set; }
    }
}
