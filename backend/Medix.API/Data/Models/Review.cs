using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class Review
{
    public Guid Id { get; set; }

    public Guid AppointmentId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public string? AdminResponse { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;
}
