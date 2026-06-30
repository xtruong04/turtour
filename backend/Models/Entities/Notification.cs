using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class Notification : BaseEntity
    {
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public string Type { get; set; } = string.Empty;

        // Tour liên quan tới sự kiện gây ra thông báo này — dùng để FE điều hướng
        // tới đúng trang khi người dùng bấm vào thông báo (vd. tới trang đăng ký của tour đó).
        public Guid? TourId { get; set; }

        //Navigation
        public User? User { get; set; }
        public Tour? Tour { get; set; }
    }
}
