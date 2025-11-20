using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Admin;

namespace Medix.API.Business.Services.Classification
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly IAdminDashboardRepository _repository;

        public AdminDashboardService(IAdminDashboardRepository repository)
        {
            _repository = repository;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync()
        {
            return await _repository.GetDashboardAsync();
        }
    }
}

