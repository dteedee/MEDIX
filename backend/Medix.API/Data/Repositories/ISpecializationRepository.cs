using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public interface ISpecializationRepository
    {
        Task<List<Specialization>> GetAllAsync();
    }
}
