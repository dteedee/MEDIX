using System;
using System.Collections.Generic;

namespace Medix.API.Models.Entities;

public partial class DoctorRegistrationForm
{
    public Guid Id { get; set; }

    public string AvatarUrl { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string UserNameNormalized { get; set; } = null!;

    public DateOnly DateOfBirth { get; set; }

    public string GenderCode { get; set; } = null!;

    public string IdentificationNumber { get; set; } = null!;

    public string IdentityCardImageUrl { get; set; } = null!;

    public string EmailNormalized { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public Guid SpecializationId { get; set; }

    public string LicenseImageUrl { get; set; } = null!;

    public string LicenseNumber { get; set; } = null!;

    public string DegreeFilesUrl { get; set; } = null!;

    public string? Bio { get; set; }

    public string? Education { get; set; }

    public int YearsOfExperience { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Specialization Specialization { get; set; } = null!;
}

