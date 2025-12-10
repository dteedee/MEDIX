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
        public int? CompletedAppointments { get; set; }
        public int? SuccessfulAppointments { get; set; }
        public int? TotalAppointments { get; set; }
        public double? SuccessRate { get; set; }
        public string? Degree { get; set; }
        public int? ExperienceYears { get; set; }
    }

    public class TopDoctorPerformanceDto
    {
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;

        public double AverageRating { get; set; } = 0.0;
        public int ReviewCount { get; set; } = 0;

        public int SuccessfulCases { get; set; } = 0;
        public int TotalCases { get; set; } = 0;
        public double SuccessRate { get; set; } = 0.0; 

        public double CompositeScore { get; set; } = 0.0;

        public string? ImageUrl { get; set; }

        public string FormattedRating => $"{AverageRating:F1}";
        public string FormattedSuccessRate => $"{(SuccessRate * 100):F0}%";

        public decimal? ConsultationFee { get; set; }
    }
    public class DoctorEducationFeeUpdateRequest
    {

        public string? Education { get; set; }

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
     

       
        public int TotalBookings { get; set; }            
        public int SuccessfulBookings { get; set; }       
        public int TotalCases { get; set; }               
        public int SuccessfulCases { get; set; }          
        public decimal Revenue { get; set; }              

        public decimal TotalSalary { get; set; }
     

        public double AverageRating { get; set; }         
        public int TotalReviews { get; set; }

    }

}
