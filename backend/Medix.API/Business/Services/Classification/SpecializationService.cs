using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class SpecializationService : ISpecializationService
    {
        private readonly ISpecializationRepository _specializationRepository;

        public SpecializationService(ISpecializationRepository specializationRepository)
        {
            _specializationRepository = specializationRepository;
        }
        public async Task<IEnumerable<SpecializationDistributionDto>> GetDoctorCountBySpecializationAsync()
        {
            try
            {
                var counts = (await _specializationRepository.GetDoctorCountBySpecializationAsync()).ToList();

                var totalDoctors = counts.Sum(c => c.DoctorCount);
                if (totalDoctors == 0)
                {
                    counts.ForEach(c => c.Percentage = 0m);
                    return counts;
                }

                foreach (var c in counts)
                {
                    c.Percentage = Math.Round((decimal)c.DoctorCount * 100m / totalDoctors, 1);
                }

                return counts;
            }
            catch (Exception ex)
            {
                return Enumerable.Empty<SpecializationDistributionDto>();
            }
        }
        public async Task<List<Specialization>> GetAllAsync()
        {
            return await _specializationRepository.GetAllAsync();
        }

        public async Task<List<Specialization>> GetAllSpecializationsAsync()
        {
            return await _specializationRepository.GetAllAsync();
        }

        public async Task<List<Specialization>> GetActiveAsync()
        {
            return await _specializationRepository.GetActiveAsync();
        }

        public async Task<Specialization?> GetByIdAsync(Guid id)
        {
            return await _specializationRepository.GetByIdAsync(id);
        }

        public async Task<Specialization?> GetByCodeAsync(string code)
        {
            return await _specializationRepository.GetByCodeAsync(code);
        }

        public async Task<Specialization> CreateAsync(Specialization specialization)
        {
            return await _specializationRepository.CreateAsync(specialization);
        }

        public async Task<Specialization> UpdateAsync(Specialization specialization)
        {
            return await _specializationRepository.UpdateAsync(specialization);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            await Task.Delay(1);
            return false;
        }
    }
}