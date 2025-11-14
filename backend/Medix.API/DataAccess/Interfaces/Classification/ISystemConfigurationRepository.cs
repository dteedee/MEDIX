using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
   
        public interface ISystemConfigurationRepository
        {
            Task<List<SystemConfiguration>> GetAllAsync();
            Task<SystemConfiguration?> GetByKeyAsync(string key);
            Task AddAsync(SystemConfiguration config);
            Task UpdateAsync(SystemConfiguration config);
            Task DeleteAsync(string key);
        }
    
}
