using Medix.API.Models.DTOs.Manager;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IManagerDashboardService
    {
        Task<ManagerDashboardDto> GetDashboardAsync();

    }
}

