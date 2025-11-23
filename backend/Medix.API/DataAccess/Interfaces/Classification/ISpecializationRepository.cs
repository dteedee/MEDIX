using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface ISpecializationRepository
    {
        Task<List<Specialization>> GetAllAsync();
        Task<List<Specialization>> GetActiveAsync();
        Task<Specialization?> GetByIdAsync(Guid id);
        Task<Specialization?> GetByCodeAsync(string code);
        Task<IEnumerable<SpecializationDistributionDto>> GetDoctorCountBySpecializationAsync();
    }
}
