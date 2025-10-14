using Medix.API.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Data.Repositories
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
