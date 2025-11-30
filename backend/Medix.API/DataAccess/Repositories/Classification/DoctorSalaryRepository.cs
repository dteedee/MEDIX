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

        public async Task<bool> IsDoctorSalaryPaid(Guid doctorId, DateTime date)
        {
            var monthStart = DateOnly.FromDateTime(new DateTime(date.Year, date.Month, 1));
            var monthEnd = DateOnly.FromDateTime(new DateTime(date.Year, date.Month, DateTime.DaysInMonth(date.Year, date.Month)));

            return await _context.DoctorSalaries.AnyAsync(s =>
                s.DoctorId == doctorId &&
                (
                    (s.PeriodStartDate >= monthStart && s.PeriodStartDate <= monthEnd) ||
                    (s.PeriodEndDate >= monthStart && s.PeriodEndDate <= monthEnd)
                )
            );
        }

        public async Task CreateAsync(DoctorSalary doctorSalary)
        {
            await _context.DoctorSalaries.AddAsync(doctorSalary);
            await _context.SaveChangesAsync();
        }

        private bool SameMonthAndYear(DateOnly date1, DateTime date2)
        {
            var date = date1.ToDateTime(TimeOnly.MinValue);
            return SameMonthAndYear(date, date2);
        }

        private bool SameMonthAndYear(DateTime date1, DateTime date2)
        {
            return (date1.Month == date2.Month && date1.Year == date2.Year);
        }

    }
}
