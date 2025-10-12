using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class User
{
    public Guid Id { get; set; }

    public string UserName { get; set; } = null!;

    public string NormalizedUserName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string NormalizedEmail { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public bool PhoneNumberConfirmed { get; set; }

    public bool EmailConfirmed { get; set; }

    public string FullName { get; set; } = null!;

    public DateOnly? DateOfBirth { get; set; }

    public string? GenderCode { get; set; }

    public string? IdentificationNumber { get; set; }

    public string? Address { get; set; }

    public string? AvatarUrl { get; set; }

    public byte Status { get; set; }

    public bool IsProfileCompleted { get; set; }

    public DateTime? LockoutEnd { get; set; }

    public bool LockoutEnabled { get; set; }

    public int AccessFailedCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<AppointmentStatusHistory> AppointmentStatusHistories { get; set; } = new List<AppointmentStatusHistory>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual ICollection<Cmspage> Cmspages { get; set; } = new List<Cmspage>();

    public virtual Doctor? Doctor { get; set; }

    public virtual RefGender? GenderCodeNavigation { get; set; }

    public virtual ICollection<HealthArticle> HealthArticles { get; set; } = new List<HealthArticle>();

    public virtual ICollection<MedicalRecordAttachment> MedicalRecordAttachments { get; set; } = new List<MedicalRecordAttachment>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual Patient? Patient { get; set; }

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public virtual Wallet? Wallet { get; set; }
}
