using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class ServiceTierRepository:IServiceTierRepository
    {

        private readonly MedixContext _context;

        public ServiceTierRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DoctorServiceTier>> GetActiveTiersAsync()
        {
            return await _context.DoctorServiceTiers
                .AsNoTracking()
                .Where(t => t.IsActive) // Giả sử chỉ lấy tier đang hoạt động
                .OrderBy(t => t.Name) // Luôn OrderBy khi lấy danh sách
                .ToListAsync();
        }

        public async Task<DoctorServiceTier?> GetServiceTierByNameAsync(string name)
        {
            return await _context.DoctorServiceTiers
                .FirstOrDefaultAsync(t => t.Name == name);
        }

        public async Task<DoctorServiceTier?> GetByIdAsync(Guid id)
            => await _context.DoctorServiceTiers.FirstOrDefaultAsync(t => t.Id == id);
    }
}
