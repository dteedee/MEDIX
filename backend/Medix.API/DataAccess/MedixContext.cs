
using System.Text.Json;
using Medix.API.Infrastructure;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Medix.API.DataAccess;

public partial class MedixContext : DbContext
{
    private readonly UserContext _userContext;


    public MedixContext()
    {
    }

    public MedixContext(DbContextOptions<MedixContext> options, UserContext userContext)
        : base(options)
    {
        _userContext = userContext;

    }

    public virtual DbSet<AISymptomAnalysis> AISymptomAnalyses { get; set; }
    public virtual DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; }

    public virtual DbSet<Appointment> Appointments { get; set; }

    public virtual DbSet<AppointmentStatusHistory> AppointmentStatusHistories { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Cmspage> Cmspages { get; set; }

    public virtual DbSet<ContentCategory> ContentCategories { get; set; }

    public virtual DbSet<Doctor> Doctors { get; set; }

    public virtual DbSet<DoctorAdCampaign> DoctorAdCampaigns { get; set; }

    public virtual DbSet<DoctorPerformanceMetric> DoctorPerformanceMetrics { get; set; }

    public virtual DbSet<DoctorRegistrationForm> DoctorRegistrationForms { get; set; }

    public virtual DbSet<DoctorSalary> DoctorSalaries { get; set; }

    public virtual DbSet<DoctorSchedule> DoctorSchedules { get; set; }

    public virtual DbSet<DoctorScheduleOverride> DoctorScheduleOverrides { get; set; }

    public virtual DbSet<DoctorServiceTier> DoctorServiceTiers { get; set; }

    public virtual DbSet<DoctorSubscription> DoctorSubscriptions { get; set; }

    public virtual DbSet<HealthArticle> HealthArticles { get; set; }
    public virtual DbSet<HealthArticleLike> HealthArticleLikes { get; set; }

    public virtual DbSet<MedicalRecord> MedicalRecords { get; set; }

    public virtual DbSet<MedicalRecordAttachment> MedicalRecordAttachments { get; set; }

    public virtual DbSet<MedicationDatabase> MedicationDatabases { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Patient> Patients { get; set; }

    public virtual DbSet<PatientHealthReminder> PatientHealthReminders { get; set; }

    public virtual DbSet<Prescription> Prescriptions { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<RefAppointmentStatus> RefAppointmentStatuses { get; set; }

    public virtual DbSet<RefArticleStatus> RefArticleStatuses { get; set; }

    public virtual DbSet<RefBloodType> RefBloodTypes { get; set; }

    public virtual DbSet<RefFileType> RefFileTypes { get; set; }

    public virtual DbSet<RefGender> RefGenders { get; set; }

    public virtual DbSet<RefPaymentMethod> RefPaymentMethods { get; set; }

    public virtual DbSet<RefPaymentStatus> RefPaymentStatuses { get; set; }

    public virtual DbSet<RefReminderType> RefReminderTypes { get; set; }

    public virtual DbSet<RefRole> RefRoles { get; set; }

    public virtual DbSet<RefSeverityLevel> RefSeverityLevels { get; set; }

    public virtual DbSet<RefWalletTransactionType> RefWalletTransactionTypes { get; set; }

    public virtual DbSet<TransferTransaction> TransferTransactions { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<ServicePackage> ServicePackages { get; set; }

    public virtual DbSet<ServiceTierSubscription> ServiceTierSubscriptions { get; set; }

    public virtual DbSet<SiteBanner> SiteBanners { get; set; }

    public virtual DbSet<Specialization> Specializations { get; set; }

    public virtual DbSet<SystemAnalytic> SystemAnalytics { get; set; }

    public virtual DbSet<SystemConfiguration> SystemConfigurations { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    public virtual DbSet<Wallet> Wallets { get; set; }

    public virtual DbSet<WalletTransaction> WalletTransactions { get; set; }

    public virtual DbSet<NoticeSetup> NoticeSetups { get; set; }
    public virtual DbSet<UserPromotion> UserPromotions { get; set; }

    public virtual DbSet<RefPromotionTarget> RefPromotionTargets { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AISymptomAnalysis>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AISympto__3214EC0719D5BC7F");

            entity.ToTable("AISymptomAnalysis");

            entity.HasIndex(e => new { e.PatientId, e.CreatedAt }, "IX_AISymptomAnalysis_Patient_Date").HasFilter("([IsGuestSession]=(0))");

            entity.HasIndex(e => e.SessionId, "IX_AISymptomAnalysis_SessionId").IsUnique();

            entity.HasIndex(e => new { e.SeverityLevelCode, e.CreatedAt }, "IX_AISymptomAnalysis_Severity_Date");

            entity.HasIndex(e => e.SessionId, "UQ__AISympto__C9F49291858026FF").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ConfidenceScore).HasColumnType("decimal(5, 4)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Emrtext).HasColumnName("EMRText");
            entity.Property(e => e.IsGuestSession).HasDefaultValue(true);
            entity.Property(e => e.RecommendedAction).HasMaxLength(500);
            entity.Property(e => e.SessionId).HasMaxLength(100);
            entity.Property(e => e.SeverityLevelCode).HasMaxLength(20);
            entity.Property(e => e.UploadedEmrurl)
                .HasMaxLength(500)
                .HasColumnName("UploadedEMRUrl");

            entity.HasOne(d => d.Patient).WithMany(p => p.AISymptomAnalyses)
                .HasForeignKey(d => d.PatientId)
                .HasConstraintName("FK_AISymptomAnalysis_Patient");

            entity.HasOne(d => d.RecommendedSpecialization).WithMany(p => p.AISymptomAnalyses)
                .HasForeignKey(d => d.RecommendedSpecializationId)
                .HasConstraintName("FK_AISymptomAnalysis_Specialization");

            // TODO: Re-enable when RefSeverityLevel navigation is fixed
            // entity.HasOne(d => d.SeverityLevelCodeNavigation).WithMany(p => p.AISymptomAnalyses)
            //     .HasForeignKey(d => d.SeverityLevelCode)
            //     .OnDelete(DeleteBehavior.ClientSetNull)
            //     .HasConstraintName("FK_AISymptomAnalysis_Severity");
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Appointm__3214EC07238F54FD");

            entity.HasIndex(e => new { e.DoctorId, e.StatusCode, e.AppointmentStartTime }, "IX_Appointments_Doctor_Status_Date");

            entity.HasIndex(e => new { e.PatientId, e.StatusCode, e.AppointmentStartTime }, "IX_Appointments_Patient_Status_Date");

            entity.HasIndex(e => e.PaymentStatusCode, "IX_Appointments_Payment_Status").HasFilter("([PaymentStatusCode]='Pending')");

            entity.HasIndex(e => new { e.StatusCode, e.AppointmentStartTime }, "IX_Appointments_Status_Date");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AISymptomAnalysisId).HasColumnName("AISymptomAnalysisId");
            entity.Property(e => e.ConsultationFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MedicalInfo).HasMaxLength(1000);
            entity.Property(e => e.PaymentMethodCode).HasMaxLength(20);
            entity.Property(e => e.PaymentStatusCode)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.PlatformFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RefundAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RefundStatus)
                .HasMaxLength(20)
                .HasDefaultValue("None");
            entity.Property(e => e.StatusCode).HasMaxLength(30);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TransactionId).HasMaxLength(255);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.AISymptomAnalysis).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.AISymptomAnalysisId)
                .HasConstraintName("FK_Appointments_AISymptomAnalysis");

            entity.HasOne(d => d.Doctor).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Doctor");

            entity.HasOne(d => d.Patient).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Patient");

            entity.HasOne(d => d.PaymentMethodCodeNavigation).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.PaymentMethodCode)
                .HasConstraintName("FK_Appointments_PaymentMethod");

            entity.HasOne(d => d.PaymentStatusCodeNavigation).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.PaymentStatusCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_PaymentStatus");

            entity.HasOne(d => d.StatusCodeNavigation).WithMany(p => p.Appointments)
                .HasForeignKey(d => d.StatusCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Appointments_Status");
        });

        modelBuilder.Entity<AppointmentStatusHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Appointm__3214EC079022660A");

            entity.ToTable("AppointmentStatusHistory");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.NewStatusCode).HasMaxLength(30);
            entity.Property(e => e.OldStatusCode).HasMaxLength(30);
            entity.Property(e => e.Reason).HasMaxLength(500);

            entity.HasOne(d => d.Appointment).WithMany(p => p.AppointmentStatusHistories)
                .HasForeignKey(d => d.AppointmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AppointmentStatusHistory_Appointment");

            entity.HasOne(d => d.ChangedByNavigation).WithMany(p => p.AppointmentStatusHistories)
                .HasForeignKey(d => d.ChangedBy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AppointmentStatusHistory_User");

            entity.HasOne(d => d.NewStatusCodeNavigation).WithMany(p => p.AppointmentStatusHistoryNewStatusCodeNavigations)
                .HasForeignKey(d => d.NewStatusCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AppointmentStatusHistory_NewStatus");

            entity.HasOne(d => d.OldStatusCodeNavigation).WithMany(p => p.AppointmentStatusHistoryOldStatusCodeNavigations)
                .HasForeignKey(d => d.OldStatusCode)
                .HasConstraintName("FK_AppointmentStatusHistory_OldStatus");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AuditLog__3214EC078EC805B5");

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
            entity.HasKey(e => e.Id).HasName("PK__CMSPages__3214EC074EA65E72");

            entity.ToTable("CMSPages");

            entity.HasIndex(e => e.PageSlug, "UQ__CMSPages__7D9ACA75716BC4F2").IsUnique();

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
            entity.HasKey(e => e.Id).HasName("PK__ContentC__3214EC07FF1AE895");

            entity.HasIndex(e => e.Name, "UQ__ContentC__737584F66B665110").IsUnique();

            entity.HasIndex(e => e.Slug, "UQ__ContentC__BC7B5FB6B927ECAE").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Slug).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("FK_ContentCategories_Parent");
        });

        modelBuilder.Entity<Doctor>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Doctors__3214EC07BF69D8B0");

            entity.HasIndex(e => new { e.ServiceTierId, e.IsVerified, e.IsAcceptingAppointments }, "IX_Doctors_ServiceTier_Verified");

            entity.HasIndex(e => new { e.SpecializationId, e.IsVerified, e.IsAcceptingAppointments }, "IX_Doctors_Specialization_Verified");

            entity.HasIndex(e => new { e.IsVerified, e.IsAcceptingAppointments }, "IX_Doctors_Verified_Active").HasFilter("([IsVerified]=(1) AND [IsAcceptingAppointments]=(1))");

            entity.HasIndex(e => e.UserId, "UQ__Doctors__1788CC4D763A054D").IsUnique();

            entity.HasIndex(e => e.LicenseNumber, "UQ__Doctors__E8890166EB7200E7").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AverageRating).HasColumnType("decimal(3, 2)");
            entity.Property(e => e.ConsultationFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DegreeFilesUrl).HasDefaultValue("");
            entity.Property(e => e.Education).HasMaxLength(1000);
            entity.Property(e => e.IsAcceptingAppointments).HasDefaultValue(true);
            entity.Property(e => e.LicenseImageUrl).IsUnicode(false);
            entity.Property(e => e.LicenseNumber).HasMaxLength(100);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            // ✅ Cấu hình cho các trường ban, miss và salary deduction
            entity.Property(e => e.TotalCaseMissPerWeek).HasDefaultValue(0);
            entity.Property(e => e.NextWeekMiss).HasDefaultValue(0);
            entity.Property(e => e.isSalaryDeduction).HasDefaultValue(false);
            entity.Property(e => e.TotalBanned).HasDefaultValue(0);
            entity.Property(e=>e.StartDateBanned).HasDefaultValue(null);
            entity.Property(e=>e.EndDateBanned).HasDefaultValue(null);
            

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
            entity.HasKey(e => e.Id).HasName("PK__DoctorAd__3214EC07CAD94D9E");

            entity.HasIndex(e => new { e.Status, e.StartDate, e.EndDate }, "IX_DoctorAdCampaigns_Status_Date").HasFilter("([Status]='Active')");

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
            entity.HasKey(e => e.Id).HasName("PK__DoctorPe__3214EC07C4999B9F");

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

        modelBuilder.Entity<DoctorRegistrationForm>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorRe__3214EC078AFF2B65");

            entity.HasIndex(e => e.UserNameNormalized, "UQ__DoctorRe__2CB5855F7E011DA4").IsUnique();

            entity.HasIndex(e => e.PhoneNumber, "UQ__DoctorRe__85FB4E3875223BA8").IsUnique();

            entity.HasIndex(e => e.IdentificationNumber, "UQ__DoctorRe__9CD14694DB6FF6E0").IsUnique();

            entity.HasIndex(e => e.EmailNormalized, "UQ__DoctorRe__B5DB8137650358A8").IsUnique();

            entity.HasIndex(e => e.LicenseNumber, "UQ__DoctorRe__E889016606590140").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Education).HasMaxLength(1000);
            entity.Property(e => e.EmailNormalized).HasMaxLength(256);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.GenderCode).HasMaxLength(10);
            entity.Property(e => e.IdentificationNumber).HasMaxLength(50);
            entity.Property(e => e.LicenseNumber).HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.UserNameNormalized).HasMaxLength(256);

            entity.HasOne(d => d.Specialization).WithMany(p => p.DoctorRegistrationForms)
                .HasForeignKey(d => d.SpecializationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DoctorReg__Speci__595B4002");
        });

        modelBuilder.Entity<DoctorSalary>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSa__3214EC07D6793F9D");

            entity.HasIndex(e => new { e.DoctorId, e.PeriodStartDate, e.PeriodEndDate }, "IX_DoctorSalaries_Doctor_Period");

            entity.HasIndex(e => e.Status, "IX_DoctorSalaries_Status").HasFilter("([Status]='Pending')");

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
            entity.HasKey(e => e.Id).HasName("PK__DoctorSc__3214EC071FA1F525");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.IsAvailable).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorSchedules)
                .HasForeignKey(d => d.DoctorId)
                .HasConstraintName("FK_DoctorSchedules_Doctor");
        });

        modelBuilder.Entity<DoctorScheduleOverride>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSc__3214EC07790F247C");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.OverrideType);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Doctor).WithMany(p => p.DoctorScheduleOverrides)
                .HasForeignKey(d => d.DoctorId)
                .HasConstraintName("FK_DoctorScheduleOverrides_Doctor");
        });

        modelBuilder.Entity<DoctorServiceTier>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DoctorSe__3214EC073702BBFE");

            entity.HasIndex(e => e.Name, "UQ__DoctorSe__737584F6AC5AB0C1").IsUnique();

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
            entity.HasKey(e => e.Id).HasName("PK__DoctorSu__3214EC0764C0E1DE");

            entity.HasIndex(e => new { e.Status, e.EndDate }, "IX_DoctorSubscriptions_Status_Date").HasFilter("([Status]='Active')");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

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
            entity.HasKey(e => e.Id).HasName("PK__HealthAr__3214EC0779EC21BC");

            entity.HasIndex(e => new { e.AuthorId, e.CreatedAt }, "IX_HealthArticles_Author_Date");

            entity.HasIndex(e => new { e.StatusCode, e.IsHomepageVisible, e.DisplayOrder }, "IX_HealthArticles_Status_Homepage").HasFilter("([StatusCode]='Published')");

            entity.HasIndex(e => e.Slug, "UQ__HealthAr__BC7B5FB68CFB80B0").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CoverImageUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayType)
                .HasMaxLength(20)
                .HasDefaultValue("Standard");
            entity.Property(e => e.MetaDescription).HasMaxLength(1000);
            entity.Property(e => e.MetaTitle).HasMaxLength(500);
            entity.Property(e => e.Slug).HasMaxLength(500);
            entity.Property(e => e.StatusCode)
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

            entity.HasOne(d => d.StatusCodeNavigation).WithMany(p => p.HealthArticles)
                .HasForeignKey(d => d.StatusCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HealthArticles_Status");

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
                        j.HasKey("ArticleId", "CategoryId").HasName("PK__ArticleC__3DF2E34843795214");
                        j.ToTable("ArticleCategories");
                    });
        });

        modelBuilder.Entity<MedicalRecord>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__MedicalR__3214EC07AC0BA5B9");

            entity.HasIndex(e => e.AppointmentId, "IX_MedicalRecords_Appointment");

            entity.HasIndex(e => e.AppointmentId, "UQ__MedicalR__8ECDFCC3BB821E80").IsUnique();

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
            entity.HasKey(e => e.Id).HasName("PK__MedicalR__3214EC071FCDB129");

            entity.HasIndex(e => e.MedicalRecordId, "IX_MedicalRecordAttachments_MedicalRecord");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FileName).HasMaxLength(500);
            entity.Property(e => e.FileTypeCode).HasMaxLength(20);
            entity.Property(e => e.FileUrl).HasMaxLength(500);

            entity.HasOne(d => d.FileTypeCodeNavigation).WithMany(p => p.MedicalRecordAttachments)
                .HasForeignKey(d => d.FileTypeCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MedicalRecordAttachments_FileType");

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
            entity.HasKey(e => e.Id).HasName("PK__Medicati__3214EC0753C891C6");

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
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3214EC0733D997A0");

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
            entity.HasKey(e => e.Id).HasName("PK__Patients__3214EC0757F00101");

            entity.HasIndex(e => e.MedicalRecordNumber, "IX_Patients_MedicalRecordNumber");

            entity.HasIndex(e => e.UserId, "IX_Patients_User");

            entity.HasIndex(e => e.UserId, "UQ__Patients__1788CC4D1C2C3BBA").IsUnique();

            entity.HasIndex(e => e.MedicalRecordNumber, "UQ__Patients__8E549ED065FA6A00").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.BloodTypeCode).HasMaxLength(5);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.EmergencyContactName).HasMaxLength(200);
            entity.Property(e => e.EmergencyContactPhone).HasMaxLength(20);
            entity.Property(e => e.Height).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.MedicalRecordNumber).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Weight).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.BloodTypeCodeNavigation).WithMany(p => p.Patients)
                .HasForeignKey(d => d.BloodTypeCode)
                .HasConstraintName("FK_Patients_BloodType");

            entity.HasOne(d => d.User).WithOne(p => p.Patient)
                .HasForeignKey<Patient>(d => d.UserId)
                .HasConstraintName("FK_Patients_User");
        });

        modelBuilder.Entity<PatientHealthReminder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PatientH__3214EC07A144B1D4");

            entity.HasIndex(e => new { e.PatientId, e.ScheduledDate }, "IX_PatientHealthReminders_Patient_Date").HasFilter("([IsCompleted]=(0))");

            entity.HasIndex(e => new { e.ReminderTypeCode, e.ScheduledDate }, "IX_PatientHealthReminders_Type_Date");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.RecurrencePattern).HasMaxLength(50);
            entity.Property(e => e.ReminderTypeCode).HasMaxLength(20);
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.Patient).WithMany(p => p.PatientHealthReminders)
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PatientHealthReminders_Patient");

            entity.HasOne(d => d.RelatedAppointment).WithMany(p => p.PatientHealthReminders)
                .HasForeignKey(d => d.RelatedAppointmentId)
                .HasConstraintName("FK_PatientHealthReminders_Appointment");

            entity.HasOne(d => d.ReminderTypeCodeNavigation).WithMany(p => p.PatientHealthReminders)
                .HasForeignKey(d => d.ReminderTypeCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PatientHealthReminders_Type");
        });

        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Prescrip__3214EC07E7FED934");

            entity.HasIndex(e => e.MedicalRecordId, "IX_Prescriptions_MedicalRecord");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
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
            entity.HasKey(e => e.Id).HasName("PK__Promotio__3214EC078B240364");

            entity.HasIndex(e => new { e.IsActive, e.StartDate, e.EndDate }, "IX_Promotions_Active_Date").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => e.Code, "UQ__Promotio__A25C5AA71BD14BAA").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.DiscountType).HasMaxLength(20);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.ApplicableTargets);
        });

        modelBuilder.Entity<RefAppointmentStatus>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefAppoi__A25C5AA69D1F88AE");

            entity.ToTable("RefAppointmentStatus");

            entity.Property(e => e.Code).HasMaxLength(30);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefArticleStatus>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefArtic__A25C5AA6F03EC7E2");

            entity.ToTable("RefArticleStatus");

            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefBloodType>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefBlood__A25C5AA67734F70E");

            entity.Property(e => e.Code).HasMaxLength(5);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefFileType>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefFileT__A25C5AA6DA4D8D4A");

            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefGender>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefGende__A25C5AA6939BEE5A");

            entity.Property(e => e.Code).HasMaxLength(10);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefPaymentMethod>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefPayme__A25C5AA6127F3AEB");

            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefPaymentStatus>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefPayme__A25C5AA68CA5D6F4");

            entity.ToTable("RefPaymentStatus");

            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefReminderType>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefRemin__A25C5AA6D9076352");

            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefRole>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefRoles__A25C5AA610CF02ED");

            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefSeverityLevel>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefSever__A25C5AA6FEF4392B");

            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.ColorCode).HasMaxLength(10);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefWalletTransactionType>(entity =>
        {
            entity.HasKey(e => e.Code).HasName("PK__RefWalle__A25C5AA64B3E1BC8");

            entity.Property(e => e.Code).HasMaxLength(30);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RefreshT__3214EC077F541F45");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Token).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_RefreshTokens_User");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Reviews__3214EC07E5D5FDA6");

            entity.HasIndex(e => e.AppointmentId, "IX_Reviews_Appointment");

            entity.HasIndex(e => new { e.Rating, e.Status }, "IX_Reviews_Rating_Status").HasFilter("([Status]='Approved')");

            entity.HasIndex(e => e.AppointmentId, "UQ__Reviews__8ECDFCC3FD5AE396").IsUnique();

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
            entity.HasKey(e => e.Id).HasName("PK__ServiceP__3214EC076D503B46");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MonthlyFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<ServiceTierSubscription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ServiceT__3214EC0746F9D665");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Doctor).WithMany(p => p.ServiceTierSubscriptions)
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceTi__Docto__04459E07");

            entity.HasOne(d => d.ServiceTier).WithMany(p => p.ServiceTierSubscriptions)
                .HasForeignKey(d => d.ServiceTierId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceTi__Servi__0539C240");
        });

        modelBuilder.Entity<SiteBanner>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SiteBann__3214EC07DAA32833");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.BannerImageUrl).HasMaxLength(500);
            entity.Property(e => e.BannerTitle).HasMaxLength(200);
            entity.Property(e => e.BannerUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Specialization>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Speciali__3214EC0715D27EBA");

            entity.HasIndex(e => e.Code, "UQ__Speciali__A25C5AA7EB45B12D").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");
        });

        modelBuilder.Entity<SystemAnalytic>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SystemAn__3214EC07FE817288");

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
            entity.HasKey(e => e.ConfigKey).HasName("PK__SystemCo__4A30678590C15854");

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
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC074D948F2F");

            entity.HasIndex(e => e.Status, "IX_Users_Active");

            entity.HasIndex(e => new { e.EmailConfirmed, e.Status }, "IX_Users_Email_Confirmed").HasFilter("([EmailConfirmed]=(1))");

            entity.HasIndex(e => e.GenderCode, "IX_Users_Gender").HasFilter("([Status]=(1))");

            entity.HasIndex(e => e.NormalizedEmail, "UK_Users_NormalizedEmail").IsUnique();

            entity.HasIndex(e => e.NormalizedUserName, "UK_Users_NormalizedUserName").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.GenderCode).HasMaxLength(10);
            entity.Property(e => e.IdentificationNumber).HasMaxLength(50);
            entity.Property(e => e.LockoutEnabled).HasDefaultValue(true);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Status).HasDefaultValue((byte)1);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.UserName).HasMaxLength(256);

            entity.HasOne(d => d.GenderCodeNavigation).WithMany(p => p.Users)
                .HasForeignKey(d => d.GenderCode)
                .HasConstraintName("FK_Users_Gender");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleCode }).HasName("PK__UserRole__DAEA0715A1420B36");

            entity.HasIndex(e => e.RoleCode, "IX_UserRoles_Role");

            entity.HasIndex(e => e.UserId, "IX_UserRoles_User");

            entity.HasIndex(e => new { e.UserId, e.RoleCode }, "IX_UserRoles_User_Role");

            entity.Property(e => e.RoleCode).HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.RoleCodeNavigation).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Role");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_UserRoles_User");
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Wallets__3214EC07309AA23A");

            entity.HasIndex(e => e.UserId, "IX_Wallets_User").HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => e.UserId, "UQ__Wallets__1788CC4DBAD76322").IsUnique();

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

        modelBuilder.Entity<NoticeSetup>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__NoticeSe__3214EC07XXXXXXXX");

            // Index for quick lookup by NoticeCode
            entity.HasIndex(e => e.NoticeCode, "IX_NoticeSetup_NoticeCode");

            // Index for active notices
            entity.HasIndex(e => e.Status, "IX_NoticeSetup_Status")
                .HasFilter("([Status]=(1))");

            // Primary key configuration
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            // String properties
            entity.Property(e => e.ReminderHeader).HasMaxLength(500);
            entity.Property(e => e.ReminderBody).HasMaxLength(2000);
            entity.Property(e => e.NoticeCode).HasMaxLength(50);
            entity.Property(e => e.TemplateEmailHeader).HasMaxLength(500);
            entity.Property(e => e.TemplateEmailBody).HasMaxLength(4000);

            // ✅ Status default value = true (1)
            entity.Property(e => e.Status).HasDefaultValue(true);

            // DateTime properties with defaults
            entity.Property(e => e.CreatedDate).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.UpdatedDate).HasDefaultValueSql("(getutcdate())");
        });

        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WalletTr__3214EC07BA7F72EC");

            entity.HasIndex(e => e.RelatedAppointmentId, "IX_WalletTransactions_Appointment").HasFilter("([RelatedAppointmentId] IS NOT NULL)");

            entity.HasIndex(e => new { e.TransactionTypeCode, e.TransactionDate }, "IX_WalletTransactions_Type_Date");

            entity.HasIndex(e => new { e.WalletId, e.TransactionDate }, "IX_WalletTransactions_Wallet_Date").IsDescending(false, true);

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OrderCode).HasColumnType("bigint");
            entity.Property(e => e.BalanceAfter).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.BalanceBefore).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Completed");
            entity.Property(e => e.TransactionDate).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.TransactionTypeCode).HasMaxLength(30);

            entity.HasOne(d => d.RelatedAppointment).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.RelatedAppointmentId)
                .HasConstraintName("FK_WalletTransactions_Appointment");

            entity.HasOne(d => d.TransactionTypeCodeNavigation).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.TransactionTypeCode)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WalletTransactions_Type");

            entity.HasOne(d => d.Wallet).WithMany(p => p.WalletTransactions)
                .HasForeignKey(d => d.WalletId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WalletTransactions_Wallet");

            entity.HasOne(d => d.TransferTransaction) // WalletTransaction có MỘT TransferTransaction
        .WithOne(p => p.WalletTransaction)    // TransferTransaction trỏ về MỘT WalletTransaction
        .HasForeignKey<TransferTransaction>(d => d.WalletTransactionID) // Sử dụng FK trong TransferTransaction
        .HasConstraintName("FK_TransferTransaction_WalletTransaction");
        });

        modelBuilder.Entity<TransferTransaction>(entity =>
        {
            entity.HasKey(e => e.Id); // Đã có sẵn trong class
            entity.ToTable("TransferTransaction"); // Tùy chọn, đặt tên bảng

            // 1. Mối quan hệ N-1 với User (User 1-N TransferTransaction)
            entity.HasOne(d => d.User)
                .WithMany(p => p.TransferTransactions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull) // Giả định là bắt buộc (ClientSetNull/Restrict)
                .HasConstraintName("FK_TransferTransaction_User");

          
            entity.HasOne(d => d.WalletTransaction)
                .WithOne(p => p.TransferTransaction)
              
                .HasForeignKey<TransferTransaction>(d => d.WalletTransactionID)
        
                .HasConstraintName("FK_TransferTransaction_WalletTransaction");

            // Bạn có thể thêm các cấu hình khác (Index, MaxLength, DefaultValue) tại đây nếu cần
            // Ví dụ:
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Amount).HasColumnType("bigint");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.ToBin).HasMaxLength(50);
            entity.Property(e => e.ToAccountNumber).HasMaxLength(100);
            entity.Property(e => e.FromBin).HasMaxLength(50);
            entity.Property(e => e.FromAccountNumber).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");
            entity.Property(e => e.ReferenceCode).HasMaxLength(255);
        });
        // Thêm vào phương thức OnModelCreating
        modelBuilder.Entity<UserPromotion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__UserProm__3214EC07XXXXXXXX");

            entity.ToTable("UserPromotions");

            // Indexes
            entity.HasIndex(e => e.UserId, "IX_UserPromotions_UserId");

            entity.HasIndex(e => e.PromotionId, "IX_UserPromotions_PromotionId");

          
            entity.HasIndex(e => new { e.IsActive, e.UserId }, "IX_UserPromotions_Active")
                .HasFilter("([IsActive]=(1))");

            entity.HasIndex(e => new { e.ExpiryDate, e.IsActive }, "IX_UserPromotions_Expiry_Active")
                .HasFilter("([IsActive]=(1))");

            // Properties
            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");

            entity.Property(e => e.UsedCount).HasDefaultValue(0);

            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.Property(e => e.AssignedAt).HasDefaultValueSql("(getutcdate())");

            entity.Property(e => e.ExpiryDate)
                .IsRequired()
                .HasColumnType("datetime2(7)");

            entity.Property(e => e.LastUsedAt).HasColumnType("datetime2(7)");

            // Relationships
            entity.HasOne(d => d.User)
                .WithMany(p => p.UserPromotions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_UserPromotions_User");

            entity.HasOne(d => d.Promotion)
                .WithMany(p => p.UserPromotions)
                .HasForeignKey(d => d.PromotionId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_UserPromotions_Promotion");
        });
        modelBuilder.Entity<RefPromotionTarget>(entity =>
        {
            entity.ToTable("RefPromotionTargets");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(x => x.Description)
                  .HasMaxLength(500);

            entity.Property(x => x.Target)
                  .IsRequired()
                  .HasMaxLength(200);
            entity.Property(x => x.IsActive)
                  .HasDefaultValue(true);
        });
        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);



    public override int SaveChanges()
    {
        AddAuditLogs();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        AddAuditLogs();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void AddAuditLogs()
    {
        var auditEntries = new List<AuditLog>();

        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added
                     || e.State == EntityState.Modified
                     || e.State == EntityState.Deleted)
            .ToList();

        // Kiểm tra xem đây có phải là một hoạt động đăng nhập không (tạo mới RefreshToken)
        bool isLoginOperation = entries.Any(e => e.Entity is RefreshToken && e.State == EntityState.Added);

        foreach (var entry in entries)
        {
            var entityName = entry.Entity.GetType().Name;

            // Skip tất cả bảng nhiều-nhiều
            if (entityName == "ArticleCategories"
                || entityName == "HealthArticleContentCategory"
                || entityName.EndsWith("CategoryMapping"))
            {
                continue;
            }

            // Nếu là hoạt động đăng nhập, bỏ qua việc ghi log cho hành động UPDATE User không cần thiết
            if (isLoginOperation && entry.Entity is User && entry.State == EntityState.Modified)
            {
                continue;
            }

            if (entry.Entity is AuditLog)
                continue; // tránh vòng lặp

            var audit = new AuditLog
            {
                Timestamp = DateTime.UtcNow,
                EntityType = entityName,
                UserId = _userContext?.UserId,
                IpAddress = _userContext?.IpAddress ?? "System",
                EntityId = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString()
            };

            object oldValues = null;
            object newValues = null;

            try
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        audit.ActionType = "CREATE";
                        newValues = GetSafeProperties(entry.CurrentValues.ToObject());
                        audit.NewValues = JsonSerializer.Serialize(newValues);
                        break;

                    case EntityState.Modified:
                        audit.ActionType = "UPDATE";
                        var changedProperties = entry.Properties
                            .Where(p => p.IsModified && p.OriginalValue?.ToString() != p.CurrentValue?.ToString())
                            .ToList();

                        if (!changedProperties.Any()) continue; // Bỏ qua nếu không có thay đổi thực sự

                        var oldProps = new Dictionary<string, object?>();
                        var newProps = new Dictionary<string, object?>();

                        foreach (var prop in changedProperties)
                        {
                            oldProps[prop.Metadata.Name] = MaskIfSensitive(prop.Metadata.Name, prop.OriginalValue);
                            newProps[prop.Metadata.Name] = MaskIfSensitive(prop.Metadata.Name, prop.CurrentValue);
                        }
                        audit.OldValues = JsonSerializer.Serialize(oldProps);
                        audit.NewValues = JsonSerializer.Serialize(newProps);
                        break;

                    case EntityState.Deleted:
                        audit.ActionType = "DELETE";
                        oldValues = GetSafeProperties(entry.OriginalValues.ToObject());
                        audit.OldValues = JsonSerializer.Serialize(oldValues);
                        break;
                }
            }
            catch (Exception ex)
            {
                // Nếu serialize bị lỗi, ghi tên entity để debug
                Console.WriteLine($"[AuditLog Error] Cannot serialize {entityName}: {ex.Message}");
                continue;
            }

            auditEntries.Add(audit);
        }

        if (auditEntries.Any())
        {
            AuditLogs.AddRange(auditEntries);
        }
    }

    // Chỉ lấy các field an toàn: primitive / string / Guid / enum / decimal
    private Dictionary<string, object?> GetSafeProperties(object entity)
    {
        var dict = new Dictionary<string, object?>();
        var props = entity.GetType().GetProperties();

        foreach (var prop in props)
        {
            var value = prop.GetValue(entity);
            if (value == null) continue;

            var type = value.GetType();

            // Skip collection hoặc navigation property
            if (!(type.IsPrimitive || type == typeof(string) || type == typeof(Guid) || type.IsEnum || type == typeof(decimal)))
                continue;

            dict[prop.Name] = MaskIfSensitive(prop.Name, value);
        }

        return dict;
    }

    // Mask field nhạy cảm
    private object MaskIfSensitive(string propertyName, object value)
    {
        if (value == null) return null;

        var lower = propertyName.ToLower();
        if (lower.Contains("token") || lower.Contains("password") || lower.Contains("secret") || lower.Contains("refresh"))
            return "****";

        return value;
    }

}