using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorServiceTierService
    {
        Task<ServiceTierPresenter> GetDisplayedTierForDoctor(Guid userId);
        Task Upgrade(Guid userId, Guid serviceTierId);
        Task RenewSubscription(Guid subscriptionId);
        Task Unsubscribe(Guid userId, Guid serviceTierId);
        Task<List<DoctorServiceTierDetailDto>> GetAllServiceTiers();
        Task UpdateServiceTier(UpdateServiceTierRequest request);
        Task<DoctorServiceTierDetailDto?> GetServiceTierDetail(Guid serviceTierId);

    }
}
