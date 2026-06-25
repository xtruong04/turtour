using TurTour.Models.Base;

namespace TurTour.Models.Entities
{
    public class CheckIn : BaseEntity
    {
        public Guid RegistrationId { get; set; }
        public string QrCode { get; set; } = string.Empty;
        public bool IsCheckedIn { get; set; } = false;
        public DateTime? CheckedInAt { get; set; }
        public Guid? CheckedInBy { get; set; }

        //Navigation
        public Registration? Registration { get; set; }
    }
}
