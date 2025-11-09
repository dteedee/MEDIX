using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorSalaryService : IDoctorSalaryService
    {
        private readonly IDoctorSalaryRepository _salaryRepository;

        public DoctorSalaryService(IDoctorSalaryRepository salaryRepository)
        {
            _salaryRepository = salaryRepository;
        }

        public async Task<List<DoctorSalary>> GetPaidSalariesByUserIdAsync(Guid userId)
            => await _salaryRepository.GetPaidSalariesByUserIdAsync(userId);
    }
}
