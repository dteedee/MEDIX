using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.MedicationDTO;

namespace Medix.API.Business.Services.Classification
{
    public class MedicationService : IMedicationService
    {
        private readonly IMedicationRepository _repository;
        private readonly IMapper _mapper;

        public MedicationService(IMedicationRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<MedicationDto>> GetAllAsync()
        {
            var meds = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<MedicationDto>>(meds);
        }

        public async Task<MedicationDto?> GetByIdAsync(Guid id)
        {
            var med = await _repository.GetByIdAsync(id);
            return med == null ? null : _mapper.Map<MedicationDto>(med);
        }
    }
}
