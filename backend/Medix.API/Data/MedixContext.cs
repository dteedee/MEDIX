using System;
using System.Collections.Generic;
using Medix.API.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Models;

public partial class MedixContext : DbContext
{
    public MedixContext()
    {
    }

    public MedixContext(DbContextOptions<MedixContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AisymptomAnalysis> AisymptomAnalyses { get; set; }

    public virtual DbSet<Appointment> Appointments { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Cmspage> Cmspages { get; set; }

    public virtual DbSet<ContentCategory> ContentCategories { get; set; }

    public virtual DbSet<Doctor> Doctors { get; set; }

    public virtual DbSet<DoctorAdCampaign> DoctorAdCampaigns { get; set; }

    public virtual DbSet<DoctorPerformanceMetric> DoctorPerformanceMetrics { get; set; }

    public virtual DbSet<DoctorSalary> DoctorSalaries { get; set; }

    public virtual DbSet<DoctorSchedule> DoctorSchedules { get; set; }

    public virtual DbSet<DoctorScheduleOverride> DoctorScheduleOverrides { get; set; }

    public virtual DbSet<DoctorServiceTier> DoctorServiceTiers { get; set; }

    public virtual DbSet<DoctorSubscription> DoctorSubscriptions { get; set; }

    public virtual DbSet<HealthArticle> HealthArticles { get; set; }

    public virtual DbSet<MedicalRecord> MedicalRecords { get; set; }

    public virtual DbSet<MedicalRecordAttachment> MedicalRecordAttachments { get; set; }

    public virtual DbSet<MedicationDatabase> MedicationDatabases { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Patient> Patients { get; set; }

    public virtual DbSet<PatientHealthReminder> PatientHealthReminders { get; set; }

    public virtual DbSet<Prescription> Prescriptions { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<ServicePackage> ServicePackages { get; set; }

    public virtual DbSet<SiteBanner> SiteBanners { get; set; }

    public virtual DbSet<Specialization> Specializations { get; set; }

    public virtual DbSet<SystemAnalytic> SystemAnalytics { get; set; }

    public virtual DbSet<SystemConfiguration> SystemConfigurations { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Wallet> Wallets { get; set; }

    public virtual DbSet<WalletTransaction> WalletTransactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AisymptomAnalysis>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AISympto__3214EC07B9D05D40");

            entity.ToTable("AISymptomAnalysis");

            entity.HasIndex(e => new { e.PatientId, e.CreatedAt }, "IX_AISymptomAnalysis_Patient_Date").HasFilter("([IsGuestSession]=(0))");

            entity.HasIndex(e => e.SessionId, "IX_AISymptomAnalysis_SessionId").IsUnique();

            entity.HasIndex(e => e.SessionId, "UQ__AISympto__C9F4929187A0808A").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ConfidenceScore).HasColumnType("decimal(5, 4)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Emrtext).HasColumnName("EMRText");
            entity.Property(e => e.IsGuestSession).HasDefaultValue(true);
            entity.Property(e => e.RecommendedAction).HasMaxLength(500);
            entity.Property(e => e.SessionId).HasMaxLength(100);
            entity.Property(e => e.SeverityLevel).HasMaxLength(20);
            entity.Property(e => e.UploadedEmrurl)
                .HasMaxLength(500)
                .HasColumnName("UploadedEMRUrl");

            entity.HasOne(d => d.Patient).WithMany(p => p.AisymptomAnalyses)
                .HasForeignKey(d => d.PatientId)
                .HasConstraintName("FK_AISymptomAnalysis_Patient");

            entity.HasOne(d => d.RecommendedSpecialization).WithMany(p => p.AisymptomAnalyses)
                .HasForeignKey(d => d.RecommendedSpecializationId)
                .HasConstraintName("FK_AISymptomAnalysis_Specialization");
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Appointm__3214EC07ACA2C226");

            entity.HasIndex(e => new { e.DoctorId, e.Status, e.AppointmentStartTime }, "IX_Appointments_Doctor_Status_Date");

            entity.HasIndex(e => new { e.PatientId, e.Status, e.AppointmentStartTime }, "IX_Appointments_Patient_Status_Date");

            entity.HasIndex(e => e.PaymentStatus, "IX_Appointments_Payment_Status").HasFilter("([PaymentStatus]='Pending')");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AisymptomAnalysisId).HasColumnName("AISymptomAnalysisId");
            entity.Property(e => e.ConsultationFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MedicalInfo).HasMaxLength(1000);
            entity.Property(e => e.PaymentMethod).HasMaxLength(50);
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.PlatformFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RefundAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RefundStatus)
                .HasMaxLength(20)
                .HasDefaultValue("None");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TransactionId).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.AisymptomAnalysis).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.AisymptomAnalysisId)
                .HasConstraintName("FK_Appointments_AISymptomAnalysis");

            entity.HasOne(d => d.Doctor).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Doctor");

            entity.HasOne(d => d.Patient).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Patient");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AuditLog__3214EC07F4846A67");

            entity.HasIndex(e => new { e.EntityType, e.EntityId, e.Timestamp }, "IX_AuditLogs_Entity_Date");

            entity.HasIndex(e => new { e.UserId, e.Timestamp }, "IX_AuditLogs_User_Date");

            entity.Property(e => e.ActionType).HasMaxLength(100);
            entity.Property(e => e.EntityId).HasMaxLength(255);
            entity.Property(e => e.EntityType).HasMaxLength(100);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_AuditLogs_User");
        });

        modelBuilder.Entity<Cmspage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CMSPages__3214EC07C4D930A8");

            entity.ToTable("CMSPages");

            entity.HasIndex(e => e.PageSlug, "UQ__CMSPages__7D9ACA7592E447C6").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.MetaDescription).HasMaxLength(1000);
            entity.Property(e => e.MetaTitle).HasMaxLength(500);
            entity.Property(e => e.PageSlug).HasMaxLength(500);
            entity.Property(e => e.PageTitle).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Author).WithMany(p => p.Cmspages)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CMSPages_Author");
        });

        modelBuilder.Entity<ContentCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ContentC__3214EC07D8126E96");

            entity.HasIndex(e => e.Name, "UQ__ContentC__737584F6163A8C93").IsUnique();

            entity.HasIndex(e => e.Slug, "UQ__ContentC__BC7B5FB6F407996B").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Slug).HasMaxLength(200);

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("FK_ContentCategories_Parent");
        });

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Doctors__3214EC07E752F941");

            entity.HasIndex(e => new { e.ServiceTierId, e.IsVerified, e.IsAcceptingAppointments }, "IX_Doctors_ServiceTier_Verified");

            entity.HasIndex(e => new { e.SpecializationId, e.IsVerified, e.IsAcceptingAppointments }, "IX_Doctors_Specialization_Verified");

            entity.HasIndex(e => e.UserId, "UQ__Doctors__1788CC4D72D3D584").IsUnique();

            entity.HasIndex(e => e.LicenseNumber, "UQ__Doctors__E8890166F082D2A2").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AverageRating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.ConsultationFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Education).HasMaxLength(1000);
            entity.Property(e => e.IsAcceptingAppointments).HasDefaultValue(true);
            entity.Property(e => e.LicenseNumber).HasMaxLength(100);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.ServiceTier).WithMany(p => p.Doctors)
                .HasForeignKey(d => d.ServiceTierId)
                .HasConstraintName("FK_Doctors_ServiceTier");

            entity.HasOne(d => d.Specialization).WithMany(p => p.Doctors)
                .HasForeignKey(d => d.SpecializationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Doctors_Specialization");

            entity.HasOne(d => d.User).WithOne(p => p.Doctor)
                .HasForeignKey<Doctor>(d => d.UserId)
                .HasConstraintName("FK_Doctors_User");
        });

        modelBuilder.Entity<DoctorAdCampaign>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorAd__3214EC0767419EB5");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Budget).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CampaignName).HasMaxLength(200);
            entity.Property(e => e.CampaignType).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DailySpendLimit).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Active");
            entity.Property(e => e.TotalSpent).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorAdCampaigns)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DoctorAdCampaigns_Doctor");
        });

        modelBuilder.Entity<DoctorPerformanceMetric>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorPe__3214EC07B63014E7");

            entity.HasIndex(e => new { e.DoctorId, e.MetricDate }, "IX_DoctorPerformanceMetrics_Doctor_Date");

            entity.HasIndex(e => new { e.DoctorId, e.MetricDate }, "UK_DoctorPerformanceMetrics_Doctor_Date").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AverageRating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.CancellationRate).HasColumnType("decimal(5, 4)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.PatientSatisfactionScore).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.Revenue).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorPerformanceMetrics)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DoctorPerformanceMetrics_Doctor");
        });

        modelBuilder.Entity<DoctorSalary>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSa__3214EC07A1F51712");

            entity.HasIndex(e => new { e.DoctorId, e.PeriodStartDate, e.PeriodEndDate }, "IX_DoctorSalaries_Doctor_Period");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CommissionDeductions).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.NetSalary).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TotalEarnings).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorSalaries)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DoctorSalaries_Doctor");
        });

        modelBuilder.Entity<DoctorSchedule>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSc__3214EC0711B7EC7E");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.IsAvailable).HasDefaultValue(true);

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorSchedules)
                .HasForeignKey(d => d.DoctorId)
                .HasConstraintName("FK_DoctorSchedules_Doctor");
        });

        modelBuilder.Entity<DoctorScheduleOverride>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSc__3214EC07B3CCF936");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorScheduleOverrides)
                .HasForeignKey(d => d.DoctorId)
                .HasConstraintName("FK_DoctorScheduleOverrides_Doctor");
        });

        modelBuilder.Entity<DoctorServiceTier>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSe__3214EC079BB52A75");

            entity.HasIndex(e => e.Name, "UQ__DoctorSe__737584F6A6BAAA50").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ConsultationFeeMultiplier)
                .HasDefaultValue(1.0m)
                .HasColumnType("decimal(3, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaxDailyAppointments).HasDefaultValue(10);
            entity.Property(e => e.MonthlyPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Name).HasMaxLength(100);
        });

        modelBuilder.Entity<DoctorSubscription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSu__3214EC0720F0598F");

            entity.HasIndex(e => new { e.Status, e.EndDate }, "IX_DoctorSubscriptions_Status_Date").HasFilter("([Status]='Active')");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Status).HasMaxLength(20);

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorSubscriptions)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DoctorSubscriptions_Doctor");

            entity.HasOne(d => d.ServicePackage).WithMany(p => p.DoctorSubscriptions)
                .HasForeignKey(d => d.ServicePackageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DoctorSubscriptions_ServicePackage");
        });

        modelBuilder.Entity<HealthArticle>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__HealthAr__3214EC07E313B440");

            entity.HasIndex(e => new { e.Status, e.IsHomepageVisible, e.DisplayOrder }, "IX_HealthArticles_Status_Homepage").HasFilter("([Status]='Published')");

            entity.HasIndex(e => e.Slug, "UQ__HealthAr__BC7B5FB6544B35AF").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CoverImageUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayType)
                .HasMaxLength(20)
                .HasDefaultValue("Standard");
            entity.Property(e => e.MetaDescription).HasMaxLength(1000);
            entity.Property(e => e.MetaTitle).HasMaxLength(500);
            entity.Property(e => e.Slug).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Draft");
            entity.Property(e => e.Summary).HasMaxLength(1000);
            entity.Property(e => e.ThumbnailUrl).HasMaxLength(500);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Author).WithMany(p => p.HealthArticles)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HealthArticles_Author");

            entity.HasMany(d => d.Categories).WithMany(p => p.Articles)
                .UsingEntity<Dictionary<string, object>>(
                    "ArticleCategory",
                    r => r.HasOne<ContentCategory>().WithMany()
                        .HasForeignKey("CategoryId")
                        .HasConstraintName("FK_ArticleCategories_Category"),
                    l => l.HasOne<HealthArticle>().WithMany()
                        .HasForeignKey("ArticleId")
                        .HasConstraintName("FK_ArticleCategories_Article"),
                    j =>
                    {
                        j.HasKey("ArticleId", "CategoryId").HasName("PK__ArticleC__3DF2E3485EBA2F42");
                        j.ToTable("ArticleCategories");
                    });
        });

        modelBuilder.Entity<MedicalRecord>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__MedicalR__3214EC07C4F0CA94");

            entity.HasIndex(e => e.AppointmentId, "IX_MedicalRecords_Appointment");

            entity.HasIndex(e => e.AppointmentId, "UQ__MedicalR__8ECDFCC3B607BE24").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ChiefComplaint).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Appointment).WithOne(p => p.MedicalRecord)
                .HasForeignKey<MedicalRecord>(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MedicalRecords_Appointment");
        });

        modelBuilder.Entity<MedicalRecordAttachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__MedicalR__3214EC071BCB6443");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FileName).HasMaxLength(500);
            entity.Property(e => e.FileType).HasMaxLength(50);
            entity.Property(e => e.FileUrl).HasMaxLength(500);

            entity.HasOne(d => d.MedicalRecord).WithMany(p => p.MedicalRecordAttachments)
                .HasForeignKey(d => d.MedicalRecordId)
                .HasConstraintName("FK_MedicalRecordAttachments_MedicalRecord");

            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.MedicalRecordAttachments)
                .HasForeignKey(d => d.UploadedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MedicalRecordAttachments_Uploader");
        });

        modelBuilder.Entity<MedicationDatabase>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Medicati__3214EC0707AD75F5");

            entity.ToTable("MedicationDatabase");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CommonUses).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DosageForms).HasMaxLength(500);
            entity.Property(e => e.GenericName).HasMaxLength(200);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MedicationName).HasMaxLength(200);
            entity.Property(e => e.SideEffects).HasMaxLength(1000);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3214EC078AC294D4");

            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt }, "IX_Notifications_User_Read");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Message).HasMaxLength(1000);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.Type).HasMaxLength(50);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Notifications_User");
        });

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Patients__3214EC0796AC84F2");

            entity.HasIndex(e => e.UserId, "IX_Patients_User");

            entity.HasIndex(e => e.UserId, "UQ__Patients__1788CC4DED858672").IsUnique();

            entity.HasIndex(e => e.MedicalRecordNumber, "UQ__Patients__8E549ED07E09C107").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.BloodType).HasMaxLength(5);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.EmergencyContactName).HasMaxLength(200);
            entity.Property(e => e.EmergencyContactPhone).HasMaxLength(20);
            entity.Property(e => e.Height).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.MedicalRecordNumber).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Weight).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.User).WithOne(p => p.Patient)
                .HasForeignKey<Patient>(d => d.UserId)
                .HasConstraintName("FK_Patients_User");
        });

        modelBuilder.Entity<PatientHealthReminder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PatientH__3214EC077FF63AEE");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.RecurrencePattern).HasMaxLength(50);
            entity.Property(e => e.ReminderType).HasMaxLength(50);
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.RelatedAppointment).WithMany(p => p.PatientHealthReminders)
                .HasForeignKey(d => d.RelatedAppointmentId)
                .HasConstraintName("FK_PatientHealthReminders_Appointment");
        });

        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Prescrip__3214EC073F764DCB");

            entity.HasIndex(e => e.MedicalRecordId, "IX_Prescriptions_MedicalRecord");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Dosage).HasMaxLength(100);
            entity.Property(e => e.Duration).HasMaxLength(100);
            entity.Property(e => e.Frequency).HasMaxLength(100);
            entity.Property(e => e.Instructions).HasMaxLength(500);
            entity.Property(e => e.MedicationName).HasMaxLength(200);

            entity.HasOne(d => d.MedicalRecord).WithMany(p => p.Prescriptions)
                .HasForeignKey(d => d.MedicalRecordId)
                .HasConstraintName("FK_Prescriptions_MedicalRecord");

            entity.HasOne(d => d.Medication).WithMany(p => p.Prescriptions)
                .HasForeignKey(d => d.MedicationId)
                .HasConstraintName("FK_Prescriptions_Medication");
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Promotio__3214EC071547DB8A");

            entity.HasIndex(e => new { e.IsActive, e.StartDate, e.EndDate }, "IX_Promotions_Active_Date").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => e.Code, "UQ__Promotio__A25C5AA731A4F984").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DiscountType).HasMaxLength(20);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RefreshT__3214EC075921C4AA");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Token).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_RefreshTokens_User");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Reviews__3214EC078F148276");

            entity.HasIndex(e => e.AppointmentId, "IX_Reviews_Appointment");

            entity.HasIndex(e => e.AppointmentId, "UQ__Reviews__8ECDFCC3433D9EE5").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AdminResponse).HasMaxLength(2000);
            entity.Property(e => e.Comment).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.Appointment).WithOne(p => p.Review)
                .HasForeignKey<Review>(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reviews_Appointment");
        });

        modelBuilder.Entity<ServicePackage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ServiceP__3214EC07EBF78F33");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MonthlyFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<SiteBanner>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SiteBann__3214EC071F600722");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.BannerImageUrl).HasMaxLength(500);
            entity.Property(e => e.BannerTitle).HasMaxLength(200);
            entity.Property(e => e.BannerUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Specialization>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Speciali__3214EC078A7C5AFE");

            entity.HasIndex(e => e.Name, "UQ__Speciali__737584F626A610A2").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<SystemAnalytic>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SystemAn__3214EC07D5127990");

            entity.HasIndex(e => new { e.MetricDate, e.MetricType }, "IX_SystemAnalytics_Date_Type");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Dimension1).HasMaxLength(200);
            entity.Property(e => e.Dimension2).HasMaxLength(200);
            entity.Property(e => e.MetricType).HasMaxLength(50);
            entity.Property(e => e.MetricValue).HasColumnType("decimal(18, 4)");
        });

        modelBuilder.Entity<SystemConfiguration>(entity =>
        {
            entity.HasKey(e => e.ConfigKey).HasName("PK__SystemCo__4A306785E3A5101D");

            entity.Property(e => e.ConfigKey).HasMaxLength(100);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.DataType)
                .HasMaxLength(20)
                .HasDefaultValue("String");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaxValue).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.MinValue).HasColumnType("decimal(18, 4)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC07B418E8B4");

            entity.HasIndex(e => new { e.EmailConfirmed, e.IsActive }, "IX_Users_Email_Confirmed").HasFilter("([EmailConfirmed]=(1))");

            entity.HasIndex(e => new { e.Role, e.IsActive }, "IX_Users_Role_Active");

            entity.HasIndex(e => e.NormalizedEmail, "UK_Users_NormalizedEmail").IsUnique();

            entity.HasIndex(e => e.NormalizedUserName, "UK_Users_NormalizedUserName").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.IdentificationNumber).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LockoutEnabled).HasDefaultValue(true);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Role).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.UserName).HasMaxLength(256);
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Wallets__3214EC077C9E6416");

            entity.HasIndex(e => e.UserId, "IX_Wallets_User").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => e.UserId, "UQ__Wallets__1788CC4DFDC5A720").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Balance).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("VND");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.User).WithOne(p => p.Wallet)
                .HasForeignKey<Wallet>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Wallets_User");
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WalletTr__3214EC075209C405");

            entity.HasIndex(e => new { e.TransactionType, e.TransactionDate }, "IX_WalletTransactions_Type_Date");

            entity.HasIndex(e => new { e.WalletId, e.TransactionDate }, "IX_WalletTransactions_Wallet_Date").IsDescending(false, true);

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BalanceAfter).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BalanceBefore).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Completed");
            entity.Property(e => e.TransactionDate).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.TransactionType).HasMaxLength(50);

            entity.HasOne(d => d.RelatedAppointment).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.RelatedAppointmentId)
                .HasConstraintName("FK_WalletTransactions_Appointment");

            entity.HasOne(d => d.Wallet).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.WalletId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WalletTransactions_Wallet");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
