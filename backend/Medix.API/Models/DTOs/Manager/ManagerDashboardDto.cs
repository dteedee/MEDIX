namespace Medix.API.Models.DTOs.Manager
{

    public class ManagerDashboardDto
    {
        public List<DoctorScheduleTodayDto> DoctorsTodaySchedules { get; set; }
            = new();

        public AppointmentStatisticsDto AppointmentStats { get; set; }
            = new();

        public List<AppointmentTodayDto> TodayAppointments { get; set; }
            = new();
        public List<AppointmentFullDto> AllAppointments { get; set; } = new();

    }

    public class DoctorScheduleTodayDto
    {
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = null!;
        public string SpecializationName { get; set; } = null!;
        public DateTime? StartDateBanned { get; set; }
        public DateTime? EndDateBanned { get; set; }
        public bool IsBanned { get; set; }

        public List<WorkShiftDto> WorkShifts { get; set; } = new();
    }

    public class WorkShiftDto
    {
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }   
        public string? OverrideReason { get; set; }
        public bool? OverrideType { get; set; } 
    }

    public class AppointmentStatisticsDto
    {
        public int TotalAppointments { get; set; }
        public int Confirmed { get; set; }
        public int OnProgressing { get; set; }
        public int CancelledByPatient { get; set; }
        public int CancelledByDoctor { get; set; }
        public int MissedByDoctor { get; set; }
        public int MissedByPatient { get; set; }
        public int BeforeAppoinment { get; set; }

        public int NoShow { get; set; }
        public int Completed { get; set; }

        public int TodayAppointmentsCount { get; set; }
    }

   
    public class AppointmentTodayDto
    {
        public Guid AppointmentId { get; set; }
        public string Status { get; set; } = null!;

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = null!;
        public string Specialization { get; set; } = null!;

        public Guid PatientId { get; set; }
        public string PatientName { get; set; } = null!;

        public decimal TotalAmount { get; set; }
    }
    public class AppointmentFullDto
    {
        public Guid AppointmentId { get; set; }
        public string Status { get; set; } = null!;

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        public decimal TotalAmount { get; set; }

        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = null!;
        public string Specialization { get; set; } = null!;

        public Guid PatientId { get; set; }
        public string PatientName { get; set; } = null!;

        public ReviewDto? Review { get; set; }
    }

    public class ReviewDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string? AdminResponse { get; set; }
        public string Status { get; set; } = null!;
    }

}

