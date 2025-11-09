using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IDoctorSalaryService
    {
        Task<List<DoctorSalary>> GetPaidSalariesByUserIdAsync(Guid userId);
    }
}
