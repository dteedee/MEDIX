using Medix.API.Models.DTOs;

namespace Medix.API.Business.Interfaces.Classification;

public interface IServicePackageService
{
    Task<IEnumerable<ServicePackageDto>> GetTopAsync(int limit = 10);
    Task<ServicePackageDto?> GetByIdAsync(Guid id);
    Task<ServicePackageDto?> UpdateBasicInfoAsync(Guid id, ServicePackageUpdateRequest request);
}

