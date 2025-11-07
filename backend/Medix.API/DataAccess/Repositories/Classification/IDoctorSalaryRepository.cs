using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class DoctorSalaryRepository : IDoctorSalaryRepository
    {
        private readonly MedixContext _context;

        public DoctorSalaryRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<List<DoctorSalary>> GetPaidSalariesByUserIdAsync(Guid userId)
            => await _context.DoctorSalaries
                .Where(s => s.Doctor.UserId == userId && s.Status == "Paid")
                .OrderByDescending(s => s.PeriodStartDate)
                .ToListAsync();
    }
}
