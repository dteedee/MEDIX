using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.MedicationDTO;
using Medix.API.Models.Entities;

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

        public async Task<IEnumerable<MedicationDto>> GetAllIncludingInactiveAsync()
        {
            var meds = await _repository.GetAllIncludingInactiveAsync();
            return _mapper.Map<IEnumerable<MedicationDto>>(meds);
        }

        public async Task<MedicationDto?> GetByIdAsync(Guid id)
        {
            var med = await _repository.GetByIdAsync(id);
            return med == null ? null : _mapper.Map<MedicationDto>(med);
        }

        public async Task<IEnumerable<MedicationSearchDto>> SearchAsync(string query)
        {
            var meds = await _repository.SearchAsync(query);
            return _mapper.Map<IEnumerable<MedicationSearchDto>>(meds);
        }

        public async Task<MedicationDto> CreateAsync(MedicationCreateDto dto)
        {
            var medication = new MedicationDatabase
            {
                MedicationName = dto.MedicationName,
                GenericName = dto.GenericName,
                DosageForms = dto.DosageForms,
                CommonUses = dto.CommonUses,
                SideEffects = dto.SideEffects,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _repository.CreateAsync(medication);
            return _mapper.Map<MedicationDto>(created);
        }

        public async Task<MedicationDto> UpdateAsync(Guid id, MedicationUpdateDto dto)
        {
            var medication = await _repository.GetByIdAsync(id);
            if (medication == null)
            {
                throw new KeyNotFoundException($"Medication with id {id} not found");
            }

            medication.MedicationName = dto.MedicationName;
            medication.GenericName = dto.GenericName;
            medication.DosageForms = dto.DosageForms;
            medication.CommonUses = dto.CommonUses;
            medication.SideEffects = dto.SideEffects;
            medication.IsActive = dto.IsActive;

            var updated = await _repository.UpdateAsync(medication);
            return _mapper.Map<MedicationDto>(updated);
        }

        public async Task<bool> ToggleActiveAsync(Guid id)
        {
            var medication = await _repository.GetByIdAsync(id);
            if (medication == null)
            {
                throw new KeyNotFoundException($"Medication with id {id} not found");
            }

            medication.IsActive = !medication.IsActive;
            await _repository.UpdateAsync(medication);
            return medication.IsActive;
        }
    }
}
