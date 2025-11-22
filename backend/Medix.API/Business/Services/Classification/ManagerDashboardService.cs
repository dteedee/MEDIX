using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Manager;

namespace Medix.API.Business.Services.Classification
{
    public class ManagerDashboardService : IManagerDashboardService
    {
        private readonly IManagerDashboardRepository _repository;

        public ManagerDashboardService(IManagerDashboardRepository repository)
        {
            _repository = repository;
        }

        public async Task<ManagerDashboardDto> GetDashboardAsync()
        {
            return await _repository.GetDashboardAsync();
        }
    }
}

