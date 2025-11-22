using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface ISpecializationService
    {
        Task<List<Specialization>> GetAllAsync();
        Task<List<Specialization>> GetAllSpecializationsAsync();
        Task<Specialization?> GetByIdAsync(Guid id);
        Task<Specialization> CreateAsync(Specialization specialization);
        Task<Specialization> UpdateAsync(Specialization specialization);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<SpecializationDistributionDto>> GetDoctorCountBySpecializationAsync();
    }
}
