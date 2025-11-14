using Medix.API.Models.DTOs;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ISystemConfigurationService
    {
        Task<List<SystemConfigurationResponse>> GetAllAsync();
        Task<SystemConfigurationResponse?> GetByKeyAsync(string key);
        Task<T?> GetValueAsync<T>(string key);
        Task<int?> GetIntValueAsync(string key);
        Task<bool?> GetBoolValueAsync(string key);
        Task AddAsync(SystemConfigurationRequest request, string updatedBy);
        Task UpdateAsync(string key, object value, string updatedBy);
        Task DeleteAsync(string key);

    }
}
