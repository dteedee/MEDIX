using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class DoctorSalary
{
    public Guid Id { get; set; }

    public Guid DoctorId { get; set; }

    public DateOnly PeriodStartDate { get; set; }

    public DateOnly PeriodEndDate { get; set; }

    public int TotalAppointments { get; set; }

    public decimal TotalEarnings { get; set; }

    public decimal CommissionDeductions { get; set; }

    public decimal NetSalary { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;
}
