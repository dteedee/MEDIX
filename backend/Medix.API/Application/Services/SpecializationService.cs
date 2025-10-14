using Medix.API.Data.Models;
using Medix.API.Data.Repositories;

namespace Medix.API.Application.Services
{
    public class SpecializationService : ISpecializationService
    {
        private readonly ISpecializationRepository _specializationRepository;

        public SpecializationService(ISpecializationRepository specializationRepository)
        {
            _specializationRepository = specializationRepository;
        }

        public async Task<List<Specialization>> GetAllSpecializationsAsync() => await _specializationRepository.GetAllAsync();

    }
}
