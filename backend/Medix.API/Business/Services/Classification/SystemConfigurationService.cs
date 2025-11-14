using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.Extensions.Caching.Memory;

namespace Medix.API.Business.Services.Classification
{
    public class SystemConfigurationService : ISystemConfigurationService
    {
        private readonly ISystemConfigurationRepository _repo;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(10);

        public SystemConfigurationService(
            ISystemConfigurationRepository repo,
            IMapper mapper,
            IMemoryCache cache)
        {
            _repo = repo;
            _mapper = mapper;
            _cache = cache;
        }

        public async Task<List<SystemConfigurationResponse>> GetAllAsync()
        {
            const string cacheKey = "SystemConfigs_All";

            if (!_cache.TryGetValue(cacheKey, out List<SystemConfigurationResponse>? configs))
            {
                var data = await _repo.GetAllAsync();
                configs = _mapper.Map<List<SystemConfigurationResponse>>(data);

                _cache.Set(cacheKey, configs, _cacheDuration);
            }

            return configs!;
        }

        public async Task<SystemConfigurationResponse?> GetByKeyAsync(string key)
        {
            string cacheKey = $"SystemConfig_{key}";

            if (!_cache.TryGetValue(cacheKey, out SystemConfigurationResponse? config))
            {
                var entity = await _repo.GetByKeyAsync(key);
                if (entity == null) return null;

                config = _mapper.Map<SystemConfigurationResponse>(entity);
                _cache.Set(cacheKey, config, _cacheDuration);
            }

            return config;
        }

        public async Task<T?> GetValueAsync<T>(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return default;
            return (T)Convert.ChangeType(config.ConfigValue, typeof(T));
        }

        public async Task AddAsync(SystemConfigurationRequest request, string updatedBy)
        {
            var entity = _mapper.Map<SystemConfiguration>(request);
            entity.UpdatedAt = DateTime.UtcNow;
            entity.UpdatedBy = updatedBy;

            await _repo.AddAsync(entity);

            // 🔄 Làm mới cache
            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{request.ConfigKey}");
        }

        public async Task UpdateAsync(string key, object value, string updatedBy)
        {
            var entity = await _repo.GetByKeyAsync(key);
            if (entity == null)
                throw new KeyNotFoundException($"Configuration '{key}' not found.");

            entity.ConfigValue = value.ToString()!;
            entity.UpdatedBy = updatedBy;
            entity.UpdatedAt = DateTime.UtcNow;

            await _repo.UpdateAsync(entity);

            // 🔄 Làm mới cache
            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{key}");
        }

        public async Task DeleteAsync(string key)
        {
            await _repo.DeleteAsync(key);

            // 🔄 Làm mới cache
            _cache.Remove("SystemConfigs_All");
            _cache.Remove($"SystemConfig_{key}");
        }
    }
}
