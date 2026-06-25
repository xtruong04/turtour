using TurTour.Models.Base;
using TurTour.Models.Enums;

namespace TurTour.Models.Entities
{
    public class Payment : BaseEntity
    {
        public Guid RegistrationId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        public DateTime PaidAt { get; set; }
        public string? TransactionCode { get; set; }
        public string? ProofImageUrl { get; set; }
        public Guid? ComfirmedBy { get; set; }
        public DateTime? ComfirmedAt { get; set; }

        //Navigation
        public Registration? Registration { get; set; }
    }
}
