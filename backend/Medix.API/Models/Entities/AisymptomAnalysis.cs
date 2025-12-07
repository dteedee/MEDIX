using System;
using System.Collections.Generic;
using Medix.API.Models.Enums;

namespace Medix.API.Models.Entities
{
    public partial class AISymptomAnalysis
    {
        public Guid Id { get; set; }

        public string SessionId { get; set; } = null!;

        public Guid? PatientId { get; set; }

        public string Symptoms { get; set; } = null!;

        public string? UploadedEmrurl { get; set; }

        public string? Emrtext { get; set; }

        public string SeverityLevelCode { get; set; } = null!;

        public string? PossibleConditions { get; set; }

        public string? RecommendedAction { get; set; }

        public decimal? ConfidenceScore { get; set; }

        public Guid? RecommendedSpecializationId { get; set; }

        public bool IsGuestSession { get; set; }

        public DateTime CreatedAt { get; set; }

        public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

        public virtual Patient? Patient { get; set; }

        public virtual Specialization? RecommendedSpecialization { get; set; }
        public virtual RefSeverityLevel? SeverityLevelCodeNavigation { get; set; }
    }
}