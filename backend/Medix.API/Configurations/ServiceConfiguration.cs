using AutoMapper;
using Medix.API.BackgroundServices;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Business.Services.Classification;
using Medix.API.Business.Services.Community;
using Medix.API.Business.Services.UserManagement;
using Medix.API.Business.Validators;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.DataAccess.Repositories.Classification;
using Medix.API.DataAccess.Repositories.UserManagement;
//using Medix.API.Business.Job;

namespace Medix.API.Configurations
{
    public static class ServiceConfiguration
    {
        public static void ConfigureServices(this IServiceCollection services)
        {
            RegisterRepositories(services);
            RegisterServices(services);

            RegisterBackgroundJobs(services);

            // AutoMapper configuration - after all services
            services.AddAutoMapper(typeof(MappingProfile));
        }

        private static void RegisterRepositories(IServiceCollection services)
        {
            services.AddScoped<ICmspageRepository, CmspageRepository>();
            services.AddScoped<IContentCategoryRepository, ContentCategoryRepository>();
            services.AddScoped<IHealthArticleRepository, HealthArticleRepository>();
            services.AddScoped<ISiteBannerRepository, SiteBannerRepository>();
            services.AddScoped<IDoctorRepository, DoctorRepository>();
            services.AddScoped<ISpecializationRepository, SpecializationRepository>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IPatientRepository, PatientRepository>();
            services.AddScoped<IUserRoleRepository, UserRoleRepository>();
            services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            services.AddScoped<IArticleRepository, ArticleRepitory>();
            services.AddScoped<IReviewRepository, ReviewRepository>();
            services.AddScoped<IServiceTierRepository, ServiceTierRepository>();
            services.AddScoped<INotificationRepository, NotificationRepostiory>();
            services.AddScoped<IDoctorScheduleRepository, DoctorScheduleRepository>();
            services.AddScoped<IWalletRepository, WalletRepository>();
            services.AddScoped<IWalletTransactionRepository, WalletTransactionRepository>();
            services.AddScoped<IAppointmentRepository, AppointmentRepository>();
            services.AddScoped<IMedicalRecordRepository, MedicalRecordRepository>();
            services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
            services.AddScoped<IDoctorScheduleOverrideRepository, DoctorScheduleOverrideRepository>();
            services.AddScoped<IRefArticleStatusRepository, RefArticleStatusRepository>();

            services.AddScoped<IMedicationRepository, MedicationRepository>();
            services.AddScoped<IDoctorRegistrationFormRepository, DoctorRegistrationFormRepository>();
            services.AddScoped<IDoctorSalaryRepository, DoctorSalaryRepository>();
            services.AddScoped<IServiceTierSubscriptionsRepository, ServiceTierSubscriptionsRepository>();
            services.AddScoped<IDoctorDashboardRepository, DoctorDashboardRepository>();

            services.AddScoped<IPromotionRepository, PromotionRepository>();
            services.AddScoped<INoticeSetupRepository, NoticeSetupRepository>();
            services.AddScoped<ITransferTransactionRepository, TransferTransactionRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();



        }

        private static void RegisterServices(IServiceCollection services)
        {
            services.AddScoped<ICmspageService, CmspageService>();
            services.AddScoped<IContentCategoryService, ContentCategoryService>();
            services.AddScoped<IHealthArticleService, HealthArticleService>();
            services.AddScoped<ISiteBannerService, SiteBannerService>();
            // DTO validators for checks that DataAnnotations can't handle (slug uniqueness, user existence, etc.)
            services.AddScoped<IDtoValidatorService, DtoValidatorService>();
            services.AddScoped<IDoctorService, DoctorService>();
            services.AddScoped<ISpecializationService, SpecializationService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IPatientService, PatientService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<CloudinaryService>();
            services.AddScoped<IArticleService, ArticleService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IVnpay, Vnpay>();
            services.AddScoped<IWalletService, WalletService>();
            services.AddScoped<IWalletTransactionService, WalletTransactionService>();


            services.AddScoped<IDoctorScheduleService, DoctorScheduleService>();
            services.AddScoped<IAppointmentService, AppointmentService>();
            services.AddScoped<IMedicalRecordService, MedicalRecordService>();
            services.AddScoped<IPrescriptionService, PrescriptionService>();
            services.AddScoped<IReviewService, ReviewService>();
            services.AddScoped<IDoctorScheduleOverrideService, DoctorScheduleOverrideService>();
            services.AddScoped<IMedicationService, MedicationService>();

            services.AddScoped<IDoctorRegistrationFormService, DoctorRegistrationFormService>();
            services.AddScoped<IDoctorSalaryService, DoctorSalaryService>();
            services.AddScoped<IDoctorServiceTierService, DoctorServiceTierService>();
            services.AddScoped<IDoctorDashboardService, DoctorDashboardService>();
            services.AddScoped<IPromotionService, PromotionService>();
            services.AddScoped<INoticeSetupService, NoticeSetupService>();
            services.AddScoped<ITransferTransactionService, TransferTransactionService>();
            services.AddScoped<IAuditLogService, AuditLogService>();

        }


        private static void RegisterBackgroundJobs(IServiceCollection services)
        {
            
            services.AddHostedService<JobDoctorScheduleOveride>();


        }
    }
}
