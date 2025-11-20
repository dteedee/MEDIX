using Medix.API.Models.DTOs.Admin;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IAdminDashboardService
    {
        Task<AdminDashboardDto> GetDashboardAsync();
    }
}

