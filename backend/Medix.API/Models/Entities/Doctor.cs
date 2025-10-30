using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class Doctor
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid SpecializationId { get; set; }

    public Guid? ServiceTierId { get; set; }

    public string LicenseNumber { get; set; } = null!;

    public string LicenseImageUrl { get; set; } = null!;

    public string? Bio { get; set; }

    public string? Education { get; set; }

    public int YearsOfExperience { get; set; }

    public decimal ConsultationFee { get; set; }

    public decimal AverageRating { get; set; }

    public int TotalReviews { get; set; }

    public bool IsVerified { get; set; }

    public bool IsAcceptingAppointments { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string DegreeFilesUrl { get; set; } = null!;

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual ICollection<DoctorAdCampaign> DoctorAdCampaigns { get; set; } = new List<DoctorAdCampaign>();

    public virtual ICollection<DoctorPerformanceMetric> DoctorPerformanceMetrics { get; set; } = new List<DoctorPerformanceMetric>();

    public virtual ICollection<DoctorSalary> DoctorSalaries { get; set; } = new List<DoctorSalary>();

    public virtual ICollection<DoctorScheduleOverride> DoctorScheduleOverrides { get; set; } = new List<DoctorScheduleOverride>();

    public virtual ICollection<DoctorSchedule> DoctorSchedules { get; set; } = new List<DoctorSchedule>();

    public virtual ICollection<DoctorSubscription> DoctorSubscriptions { get; set; } = new List<DoctorSubscription>();

    public virtual DoctorServiceTier? ServiceTier { get; set; }

    public virtual Specialization Specialization { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
