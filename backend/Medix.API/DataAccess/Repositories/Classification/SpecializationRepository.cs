using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class SpecializationRepository : ISpecializationRepository
    {
        private MedixContext _context;

        public SpecializationRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SpecializationDistributionDto>> GetDoctorCountBySpecializationAsync()
        {
            // GroupJoin to compute counts server-side in a single query
            var query = _context.Specializations
                .GroupJoin(
                    _context.Doctors,
                    s => s.Id,
                    d => d.SpecializationId,
                    (s, docs) => new SpecializationDistributionDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        DoctorCount = docs.Count()
                    })
                .OrderByDescending(x => x.DoctorCount);

            return await query.ToListAsync();
        }
        
        public async Task<List<Specialization>> GetAllAsync() => await _context.Specializations.ToListAsync();
        
        public async Task<List<Specialization>> GetActiveAsync() => 
            await _context.Specializations.Where(s => s.IsActive).OrderBy(s => s.Name).ToListAsync();
        
        public async Task<Specialization?> GetByIdAsync(Guid id) => 
            await _context.Specializations.FirstOrDefaultAsync(s => s.Id == id);
        
        public async Task<Specialization?> GetByCodeAsync(string code) => 
            await _context.Specializations.FirstOrDefaultAsync(s => s.Code == code);
    }
}
