using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorSalaryRepository
    {
        Task<List<DoctorSalary>> GetPaidSalariesByUserIdAsync(Guid doctorId);
        Task<bool> IsDoctorSalaryPaid(Guid doctorId, DateTime date);
        Task CreateAsync(DoctorSalary doctorSalary);
    }
}
