using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
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

        public async Task<List<Specialization>> GetAllAsync() => await _context.Specializations.ToListAsync();
    }
}
