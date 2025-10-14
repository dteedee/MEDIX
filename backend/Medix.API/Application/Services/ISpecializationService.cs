using Medix.API.Data.Models;

namespace Medix.API.Application.Services
{
    public interface ISpecializationService
    {
        Task<List<Specialization>> GetAllSpecializationsAsync();
    }
}
