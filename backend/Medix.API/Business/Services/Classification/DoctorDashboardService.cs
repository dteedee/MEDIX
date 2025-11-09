using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.Models.DTOs.Doctor;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorDashboardService : IDoctorDashboardService
    {
        private readonly IDoctorDashboardRepository _repository;
        private readonly IDoctorRepository _doctorRepository;


        public DoctorDashboardService(IDoctorDashboardRepository repository, IDoctorRepository doctorRepository)
        {
            _repository = repository;
            _doctorRepository = doctorRepository;
        }

        public async Task<DoctorDashboardDto> GetDashboardAsync(Guid doctorId)
        {
            return await _repository.GetDashboardAsync(doctorId);
        }
        public async Task<DoctorDashboardDto?> GetDashboardByUserIdAsync(Guid userId)
        {
            // 🔹 Tìm doctor theo UserId (dùng hàm bạn có sẵn)
            var doctor = await _doctorRepository.GetDoctorByUserIdAsync(userId);
            if (doctor == null)
                return null;

            // 🔹 Lấy dữ liệu tổng hợp dashboard theo DoctorId
            var dashboard = await _repository.GetDashboardAsync(doctor.Id);
            return dashboard;
        }
    }
}
