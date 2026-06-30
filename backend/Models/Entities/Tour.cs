using System.ComponentModel.DataAnnotations.Schema;
using TurTour.Models.Base;
using TurTour.Models.Enums;

namespace TurTour.Models.Entities
{
    public class Tour : BaseEntity
    {
        public string Code { get; set; } = string.Empty;
        public string Tittle { get; set; } = string.Empty;
        public string Decriptions { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        // Cửa sổ nhận đăng ký — tách biệt với PublishStatus: tour có thể Published (xem được)
        // nhưng ngoài khoảng [BookingOpenAt, BookingCloseAt] thì vẫn không đăng ký được.
        public DateTime BookingOpenAt { get; set; }
        public DateTime BookingCloseAt { get; set; }
        public int MaxParticipants { get; set; }
        public int CurrentParticipants { get; set; }
        public decimal Fee { get; set; }
        public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
        public PublishStatus PublishStatus { get; set; } = PublishStatus.Hidden;
        public string? Requirement { get; set; }

        //FK
        public Guid CompanyId { get; set; }
        public Guid CreatedBy { get; set; }

        //Navigation
        public Company? Company { get; set; }
        public ICollection<TourSchedule> TourSchedules { get; set; } = new List<TourSchedule>();
        public ICollection<TourImage> TourImages { get; set; } = new List<TourImage>();

        // Tính toán khi trả về cho sinh viên đang đăng nhập, không lưu DB — cho biết sinh viên
        // đó đã bấm "Quan tâm" tour này hay chưa.
        [NotMapped]
        public bool IsInterested { get; set; }
    }
}
