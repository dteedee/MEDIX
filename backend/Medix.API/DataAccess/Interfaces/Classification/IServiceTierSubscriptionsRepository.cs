using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IServiceTierSubscriptionsRepository
    {
        Task<ServiceTierSubscription?> CreateAsync(ServiceTierSubscription subscription);
        Task<ServiceTierSubscription?> GetActiveSubscriptionOfDoctorAsync(Guid doctorId);
        Task UpdateSubscriptionAsync(ServiceTierSubscription subscription);
        Task<ServiceTierSubscription?> GetByIdAsync(Guid id);
    }
}
