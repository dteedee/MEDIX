using System.Linq;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Manager;

namespace Medix.API.Business.Services.Classification;

public class ServicePackageService : IServicePackageService
{
    private readonly IServicePackageRepository _repository;

    public ServicePackageService(IServicePackageRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ServicePackageDto>> GetTopAsync(int limit = 10)
    {
        var packages = await _repository.GetTopAsync(limit);
        return packages.Select(MapToDto);
    }

    public async Task<ServicePackageDto?> GetByIdAsync(Guid id)
    {
        var package = await _repository.GetByIdAsync(id);
        return package == null ? null : MapToDto(package);
    }

    public async Task<ServicePackageDto?> UpdateBasicInfoAsync(Guid id, ServicePackageUpdateRequest request)
    {
        var package = await _repository.GetByIdAsync(id);
        if (package == null)
        {
            return null;
        }

        package.Name = request.Name.Trim();
        package.MonthlyFee = request.MonthlyFee;

        var updated = await _repository.UpdateAsync(package);
        return MapToDto(updated);
    }

    private static ServicePackageDto MapToDto(Models.Entities.ServicePackage package)
    {
        return new ServicePackageDto
        {
            Id = package.Id,
            Name = package.Name,
            Description = package.Description,
            MonthlyFee = package.MonthlyFee,
            Features = package.Features,
            IsActive = package.IsActive,
            DisplayOrder = package.DisplayOrder,
            CreatedAt = package.CreatedAt
        };
    }
}

