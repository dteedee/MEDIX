using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.Classification
{
    public interface IDoctorScheduleRepository
    {
        public Task<List<DoctorSchedule>> GetDoctorSchedulesByDoctorIdAsync(Guid doctorId);
    }
}
