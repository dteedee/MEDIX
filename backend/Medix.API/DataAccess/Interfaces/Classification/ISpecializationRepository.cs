using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface ISpecializationRepository
    {
        Task<List<Specialization>> GetAllAsync();
        Task<IEnumerable<SpecializationDistributionDto>> GetDoctorCountBySpecializationAsync();
    }
}
