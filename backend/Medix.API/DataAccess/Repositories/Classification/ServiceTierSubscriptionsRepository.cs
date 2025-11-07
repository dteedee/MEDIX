using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class ServiceTierSubscriptionsRepository : IServiceTierSubscriptionsRepository
    {
        private readonly MedixContext _context;

        public ServiceTierSubscriptionsRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<ServiceTierSubscription?> CreateAsync(ServiceTierSubscription subscription)
        {
            await _context.ServiceTierSubscriptions.AddAsync(subscription);
            await _context.SaveChangesAsync();
            return subscription;
        }

        public async Task<ServiceTierSubscription?> GetActiveSubscriptionOfDoctorAsync(Guid doctorId)
            => await _context.ServiceTierSubscriptions.FirstOrDefaultAsync(s => s.DoctorId == doctorId && s.Status == "Active");

        public async Task UpdateSubscriptionAsync(ServiceTierSubscription subscription)
        {
            _context.ServiceTierSubscriptions.Update(subscription);
            await _context.SaveChangesAsync();
        }

        public async Task<ServiceTierSubscription?> GetByIdAsync(Guid id)
            => await _context.ServiceTierSubscriptions.FirstOrDefaultAsync(s => s.Id == id);
    }
}
