using Medix.API.Models.Entities;

namespace Medix.API.Models.DTOs.Doctor
{
    public class ServiceTierPresenter
    {
        public List<DoctorServiceTier> ServiceTierList { get; set; } = [];
        public Guid? CurrentTierId { get; set; }
    }
}
