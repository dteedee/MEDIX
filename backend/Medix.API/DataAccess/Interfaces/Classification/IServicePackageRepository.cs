using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification;

public interface IServicePackageRepository
{
    Task<List<ServicePackage>> GetTopAsync(int limit);
    Task<ServicePackage?> GetByIdAsync(Guid id);
    Task<ServicePackage> UpdateAsync(ServicePackage package);
}

