using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorServiceTierService
    {
        Task<ServiceTierPresenter> GetDisplayedTierForDoctor(Guid userId);
        Task Upgrade(Guid userId, Guid serviceTierId);
        Task RenewSubscription(Guid subscriptionId);
    }
}
