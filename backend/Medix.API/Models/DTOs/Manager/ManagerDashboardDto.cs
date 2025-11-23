namespace Medix.API.Models.DTOs.Manager
{

    public class ManagerDashboardDto
    {
        // ---------- 1. Doctor Work Schedule Today ----------
        public List<DoctorScheduleTodayDto> DoctorsTodaySchedules { get; set; }
            = new();

        // ---------- 2. Appointment Statistics (Global) ----------
        public AppointmentStatisticsDto AppointmentStats { get; set; }
            = new();

        // ---------- 3. Today's Appointments ----------
        public List<AppointmentTodayDto> TodayAppointments { get; set; }
            = new();
        public List<AppointmentFullDto> AllAppointments { get; set; } = new();

    }

    // --------------------------------------------
    // DTO: Doctor and their working schedule today
    // --------------------------------------------
    public class DoctorScheduleTodayDto
    {
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = null!;
        public string SpecializationName { get; set; } = null!;

        // Các ca làm việc hôm nay (lấy từ DoctorSchedule hoặc Override)
        public List<WorkShiftDto> WorkShifts { get; set; } = new();
    }

    public class WorkShiftDto
    {
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsAvailable { get; set; }   // true: có làm | false: nghỉ
        public string? OverrideReason { get; set; }
        public bool? OverrideType { get; set; } // null: không override | true: AVAIL | false: UNAVAIL
    }

    // --------------------------------------------
    // DTO: Appointment statistics summary
    // --------------------------------------------
    public class AppointmentStatisticsDto
    {
        public int TotalAppointments { get; set; }
        public int Confirmed { get; set; }
        public int OnProgressing { get; set; }
        public int CancelledByPatient { get; set; }
        public int CancelledByDoctor { get; set; }
        public int MissedByDoctor { get; set; }
        public int NoShow { get; set; }
        public int Completed { get; set; }

        // lịch hẹn trong ngày hôm nay
        public int TodayAppointmentsCount { get; set; }
    }

    // --------------------------------------------
    // DTO: All appointments today (full info)
    // --------------------------------------------
    public class AppointmentTodayDto
    {
        public Guid AppointmentId { get; set; }
        public string Status { get; set; } = null!;

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        // Doctor Info
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = null!;
        public string Specialization { get; set; } = null!;

        // Patient Info
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

        // Doctor
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = null!;
        public string Specialization { get; set; } = null!;

        // Patient
        public Guid PatientId { get; set; }
        public string PatientName { get; set; } = null!;

        // REVIEW
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

