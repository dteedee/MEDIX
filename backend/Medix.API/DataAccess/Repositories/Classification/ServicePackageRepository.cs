using System;
using System.Linq;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification;

public class ServicePackageRepository : IServicePackageRepository
{
    private readonly MedixContext _context;

    public ServicePackageRepository(MedixContext context)
    {
        _context = context;
    }

    public async Task<List<ServicePackage>> GetTopAsync(int limit)
    {
        limit = Math.Clamp(limit, 1, 50);

        return await _context.ServicePackages
            .Where(p => p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .ThenByDescending(p => p.CreatedAt)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<ServicePackage?> GetByIdAsync(Guid id)
    {
        return await _context.ServicePackages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}

