namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorDto
    {
        public Guid Id { get; set; }
        public string? AvatarUrl { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public string? Education { get; set; }
        public int YearsOfExperience { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public int StatusCode { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string? ServiceTier { get; set; }
    }

    public class TopDoctorDto
    {
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public string? ImageUrl { get; set; } = string.Empty;
        public string FormattedRating => $"{AverageRating:F1}";
    }

    public class TopDoctorPerformanceDto
    {
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;

        // Review metrics
        public double AverageRating { get; set; } = 0.0;
        public int ReviewCount { get; set; } = 0;

        // Appointment metrics
        public int SuccessfulCases { get; set; } = 0;
        public int TotalCases { get; set; } = 0;
        public double SuccessRate { get; set; } = 0.0; // 0..1

        // Combined score (0..1)
        public double CompositeScore { get; set; } = 0.0;

        public string? ImageUrl { get; set; }

        public string FormattedRating => $"{AverageRating:F1}";
        public string FormattedSuccessRate => $"{(SuccessRate * 100):F0}%";

        public decimal? ConsultationFee { get; set; }
    }
    public class DoctorEducationFeeUpdateRequest
    {
        /// <summary>
        /// Education code (e.g. "BC","MS","DR",...) or full description depending on calling client.
        /// If null, education will not be changed.
        /// </summary>
        public string? Education { get; set; }

        /// <summary>
        /// Consultation fee in smallest currency unit (decimal). If null, fee will not be changed.
        /// </summary>
        public decimal? ConsultationFee { get; set; }
    }


    public class DoctorSalaryDto
    {
        public Guid Id { get; set; }
        public DateOnly PeriodStartDate { get; set; }
        public DateOnly PeriodEndDate { get; set; }
        public int TotalAppointments { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal CommissionDeductions { get; set; }
        public decimal NetSalary { get; set; }
        public string? Status { get; set; }
        public DateTime? PaidAt { get; set; }
    }

    public class DoctorBusinessStatsDto
    {
     

       
        public int TotalBookings { get; set; }            // distinct patients
        public int SuccessfulBookings { get; set; }       // appointments with success statuses
        public int TotalCases { get; set; }               // total appointments
        public int SuccessfulCases { get; set; }          // Completed cases
        public decimal Revenue { get; set; }              // sum TotalAmount

        // Salary / payroll (from DoctorSalaries)
        public decimal TotalSalary { get; set; }
     

        // Performance / reviews
        public double AverageRating { get; set; }         // 0..5
        public int TotalReviews { get; set; }

    }

}
