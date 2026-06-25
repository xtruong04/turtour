using System.ComponentModel.DataAnnotations.Schema;
using TurTour.Models.Base;
using TurTour.Models.Enums;

namespace TurTour.Models.Entities
{
    public class Registration : BaseEntity
    {
        public Guid TourId { get; set; }
        public Guid StudentId { get; set; }
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
        public RegistrationStatus Status { get; set; } = RegistrationStatus.Pending;
        public string? Notes { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string? RejectionReason { get; set; }

        // Tính toán khi trả về cho sinh viên, không lưu DB — cho biết đã đánh giá tour này chưa.
        [NotMapped]
        public bool HasFeedback { get; set; }

        //Navigation
        public Tour? Tour { get; set; }
        public User? Student { get; set; }
        public Payment? Payment { get; set; }
        public CheckIn? CheckIn { get; set; }


    }
}
