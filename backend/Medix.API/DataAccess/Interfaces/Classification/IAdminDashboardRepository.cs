using Medix.API.Models.DTOs.Admin;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IAdminDashboardRepository
    {
        Task<AdminDashboardDto> GetDashboardAsync();
    }
}

