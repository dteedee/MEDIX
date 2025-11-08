using Medix.API.Models.Entities;

namespace Medix.API.Models.DTOs.Doctor
{
    public class ServiceTierPresenter
    {
        public List<DoctorServiceTier> ServiceTierList { get; set; } = [];
        public Guid? CurrentTierId { get; set; }
        public decimal Balance { get; set; }
        public DateTime? ExpiredAt { get; set; }
        public bool CurrentSubscriptionActive { get; set; }
    }
}
