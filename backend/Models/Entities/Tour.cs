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
        public int MaxParticipants { get; set; }
        public int CurrentParticipants { get; set; }
        public decimal Fee { get; set; }
        public TourStatus Status { get; set; } = TourStatus.Upcoming;
        public string? Requirement { get; set; }

        //FK
        public Guid CompanyId { get; set; }
        public Guid CreatedBy { get; set; }

        //Navigation
        public Company? Company { get; set; }
        public ICollection<TourSchedule> TourSchedules { get; set; } = new List<TourSchedule>();
        public ICollection<TourImage> TourImages { get; set; } = new List<TourImage>();

        // Tính toán khi trả về cho sinh viên đang đăng nhập, không lưu DB — cho biết sinh viên
        // đó đã bấm "Quan tâm" tour này (khi tour còn Upcoming) hay chưa.
        [NotMapped]
        public bool IsInterested { get; set; }
    }
}
