using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class SystemConfigurationRepository : ISystemConfigurationRepository
    {
        private readonly MedixContext _context;

        public SystemConfigurationRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<List<SystemConfiguration>> GetAllAsync()
        {
            return await _context.SystemConfigurations
                .Where(x => x.IsActive)
                .ToListAsync();
        }

        public async Task<SystemConfiguration?> GetByKeyAsync(string key)
        {
            return await _context.SystemConfigurations
                .FirstOrDefaultAsync(x => x.ConfigKey == key && x.IsActive);
        }

        public async Task AddAsync(SystemConfiguration config)
        {
            _context.SystemConfigurations.Add(config);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(SystemConfiguration config)
        {
            _context.SystemConfigurations.Update(config);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(string key)
        {
            var config = await _context.SystemConfigurations.FirstOrDefaultAsync(x => x.ConfigKey == key);
            if (config != null)
            {
                config.IsActive = false;
                await _context.SaveChangesAsync();
            }
        }
    }
}
