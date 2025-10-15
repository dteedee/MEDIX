using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface ISpecializationRepository
    {
        Task<List<Specialization>> GetAllAsync();
    }
}
