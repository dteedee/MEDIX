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
            if (entity.MinValue.HasValue || entity.MaxValue.HasValue)
            {
                if (decimal.TryParse(value.ToString(), out var numericValue))
                {
                    if (entity.MinValue.HasValue && numericValue < entity.MinValue)
                        throw new InvalidOperationException("Value is below allowed minimum.");

                    if (entity.MaxValue.HasValue && numericValue > entity.MaxValue)
                        throw new InvalidOperationException("Value exceeds allowed maximum.");
                }
            }

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

        public async Task<int?> GetIntValueAsync(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return null;

            if (int.TryParse(config.ConfigValue, out int val))
                return val;

            return null;
        }

        public async Task<bool?> GetBoolValueAsync(string key)
        {
            var config = await GetByKeyAsync(key);
            if (config == null) return null;

            if (bool.TryParse(config.ConfigValue, out bool val))
                return val;

            return null;
        }
        public async Task<PasswordPolicyDto> GetPasswordPolicyAsync()
        {
            return new PasswordPolicyDto
            {
                MinLength = await GetIntValueAsync("PASSWORD_MIN_LENGTH") ?? 8,
                MaxLength = await GetIntValueAsync("PASSWORD_MAX_LENGTH"),
                RequireUppercase = await GetBoolValueAsync("REQUIRE_UPPERCASE") ?? false,
                RequireLowercase = await GetBoolValueAsync("REQUIRE_LOWERCASE") ?? false,
                RequireDigit = await GetBoolValueAsync("REQUIRE_DIGIT") ?? false,
                RequireSpecial = await GetBoolValueAsync("REQUIRE_SPECIAL") ?? false,
            };
        }
        public async Task ValidatePasswordAsync(string password)
        {
            var policy = await GetPasswordPolicyAsync();

            // Only check minLength if it's greater than 0 (enabled)
            if (policy.MinLength > 0 && password.Length < policy.MinLength)
                throw new InvalidOperationException($"Mật khẩu phải dài ít nhất {policy.MinLength} ký tự.");

            if (policy.MaxLength.HasValue && password.Length > policy.MaxLength.Value)
                throw new InvalidOperationException($"Mật khẩu không được vượt quá {policy.MaxLength} ký tự.");

            if (policy.RequireUppercase && !password.Any(char.IsUpper))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z).");

            if (policy.RequireLowercase && !password.Any(char.IsLower))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).");

            if (policy.RequireDigit && !password.Any(char.IsDigit))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 chữ số (0-9).");

            if (policy.RequireSpecial && !password.Any(c => "!@#$%^&*()_+-=[]{}|;:,.<>/?".Contains(c)))
                throw new InvalidOperationException("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.");
        }

    }
}
