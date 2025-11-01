using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class PrescriptionService : IPrescriptionService
    {
        private readonly IPrescriptionRepository _repository;
        private readonly IMapper _mapper;

        public PrescriptionService(IPrescriptionRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<PrescriptionDto>> GetByMedicalRecordIdAsync(Guid medicalRecordId)
        {
            var list = await _repository.GetByMedicalRecordIdAsync(medicalRecordId);
            return _mapper.Map<IEnumerable<PrescriptionDto>>(list);
        }

        public async Task<PrescriptionDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<PrescriptionDto>(entity);
        }

        public async Task<PrescriptionDto> CreateAsync(Guid medicalRecordId, CreatePrescriptionDto dto)
        {
            var entity = _mapper.Map<Prescription>(dto);
            entity.Id = Guid.NewGuid();
            entity.MedicalRecordId = medicalRecordId;
            entity.CreatedAt = DateTime.UtcNow;

            await _repository.AddAsync(entity);
            return _mapper.Map<PrescriptionDto>(entity);
        }

        public async Task<PrescriptionDto?> UpdateAsync(Guid id, CreatePrescriptionDto dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            _mapper.Map(dto, existing);
            await _repository.UpdateAsync(existing);

            return _mapper.Map<PrescriptionDto>(existing);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }
    }
}
