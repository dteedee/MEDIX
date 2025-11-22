using Medix.API.Models.DTOs.Manager;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IManagerDashboardRepository
    {
        Task<ManagerDashboardDto> GetDashboardAsync();
    }
}

