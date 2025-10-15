using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class SpecializationService : ISpecializationService
    {
        private readonly ISpecializationRepository _specializationRepository;

        public SpecializationService(ISpecializationRepository specializationRepository)
        {
            _specializationRepository = specializationRepository;
        }

        public async Task<List<Specialization>> GetAllAsync()
        {
            return await _specializationRepository.GetAllAsync();
        }

        public async Task<List<Specialization>> GetAllSpecializationsAsync()
        {
            return await _specializationRepository.GetAllAsync();
        }

        public async Task<Specialization?> GetByIdAsync(Guid id)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            return null;
        }

        public async Task<Specialization> CreateAsync(Specialization specialization)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            throw new NotImplementedException("Chức năng tạo chuyên khoa chưa được triển khai");
        }

        public async Task<Specialization> UpdateAsync(Specialization specialization)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            throw new NotImplementedException("Chức năng cập nhật chuyên khoa chưa được triển khai");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            // TODO: Implement when repository method exists
            await Task.Delay(1);
            return false;
        }
    }
}