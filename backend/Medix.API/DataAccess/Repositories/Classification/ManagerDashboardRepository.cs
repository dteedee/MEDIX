using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Manager;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class ManagerDashboardRepository : IManagerDashboardRepository
    {
        private readonly MedixContext _context;

        public ManagerDashboardRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<ManagerDashboardDto> GetDashboardAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            var dotNetDayOfWeek = (int)DateTime.Now.DayOfWeek;
            var dayOfWeek = dotNetDayOfWeek == 0 ? 7 : dotNetDayOfWeek;

            var dto = new ManagerDashboardDto();

            var doctors = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Specialization)
                .ToListAsync();

            var schedules = await _context.DoctorSchedules
                .Where(s => s.DayOfWeek == dayOfWeek)
                .ToListAsync();

            var overrides = await _context.DoctorScheduleOverrides
                .Where(o => o.OverrideDate == today)
                .ToListAsync();

            foreach (var doctor in doctors)
            {
                var doctorDto = new DoctorScheduleTodayDto
                {
                    DoctorId = doctor.Id,
                    DoctorName = doctor.User.FullName,
                    SpecializationName = doctor.Specialization.Name
                };

                var doctorSchedules = schedules.Where(s => s.DoctorId == doctor.Id);
                foreach (var s in doctorSchedules)
                {
                    doctorDto.WorkShifts.Add(new WorkShiftDto
                    {
                        StartTime = s.StartTime,
                        EndTime = s.EndTime,
                        IsAvailable = s.IsAvailable
                    });
                }

                var doctorOverrides = overrides.Where(o => o.DoctorId == doctor.Id);
                foreach (var ovr in doctorOverrides)
                {
                    doctorDto.WorkShifts.Add(new WorkShiftDto
                    {
                        StartTime = ovr.StartTime,
                        EndTime = ovr.EndTime,
                        IsAvailable = ovr.IsAvailable,
                        OverrideReason = ovr.Reason,
                        OverrideType = ovr.OverrideType
                    });
                }

                dto.DoctorsTodaySchedules.Add(doctorDto);
            }

            var stats = await _context.Appointments.ToListAsync();

            dto.AppointmentStats = new AppointmentStatisticsDto
            {
                TotalAppointments = stats.Count,
                Confirmed = stats.Count(a => a.StatusCode == "Confirmed"),
                OnProgressing = stats.Count(a => a.StatusCode == "OnProgressing"),
                CancelledByPatient = stats.Count(a => a.StatusCode == "CancelledByPatient"),
                CancelledByDoctor = stats.Count(a => a.StatusCode == "CancelledByDoctor"),
                MissedByDoctor = stats.Count(a => a.StatusCode == "MissedByDoctor"),
                NoShow = stats.Count(a => a.StatusCode == "NoShow"),
                Completed = stats.Count(a => a.StatusCode == "Completed"),
                MissedByPatient = stats.Count(a => a.StatusCode == "MissedByPatient"),
                BeforeAppoinment = stats.Count(a => a.StatusCode == "BeforeAppoinment"),
                TodayAppointmentsCount = stats.Count(a => a.AppointmentStartTime.Date == DateTime.Today)
            };

            var todayAppointments = await _context.Appointments
                .Where(a => a.AppointmentStartTime.Date == DateTime.Today)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Doctor.Specialization)
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .ToListAsync();

            dto.TodayAppointments = todayAppointments.Select(a => new AppointmentTodayDto
            {
                AppointmentId = a.Id,
                Status = a.StatusCode,
                StartTime = a.AppointmentStartTime,
                EndTime = a.AppointmentEndTime,
                TotalAmount = a.TotalAmount,

                DoctorId = a.DoctorId,
                DoctorName = a.Doctor.User.FullName,
                Specialization = a.Doctor.Specialization.Name,

                PatientId = a.PatientId,
                PatientName = a.Patient.User.FullName
            }).ToList();
            var allAppointments = await _context.Appointments
                .Include(a => a.Review)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Doctor.Specialization)
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .ToListAsync();

            dto.AllAppointments = allAppointments.Select(a => new AppointmentFullDto
            {
                AppointmentId = a.Id,
                Status = a.StatusCode,
                StartTime = a.AppointmentStartTime,
                EndTime = a.AppointmentEndTime,
                TotalAmount = a.TotalAmount,

                DoctorId = a.DoctorId,
                DoctorName = a.Doctor.User.FullName,
                Specialization = a.Doctor.Specialization.Name,

                PatientId = a.PatientId,
                PatientName = a.Patient.User.FullName,

                Review = a.Review == null ? null : new ReviewDto
                {
                    Rating = a.Review.Rating,
                    Comment = a.Review.Comment,
                    AdminResponse = a.Review.AdminResponse,
                    Status = a.Review.Status
                }
            }).ToList();
            return dto;
        }
    }
}

