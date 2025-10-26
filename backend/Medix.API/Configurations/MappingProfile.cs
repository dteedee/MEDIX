using AutoMapper;
using Medix.API.Application.DTOs.Doctor;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.DTOs.CMSPage;
using Medix.API.Models.DTOs.ContentCategory;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs.HealthArticle;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Medix.API.Models.DTOs.ReviewDTO;
using Medix.API.Models.DTOs.SiteBanner;
using Medix.API.Models.Entities;



namespace Medix.API.Configurations
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(
                    src => src.UserRoles.FirstOrDefault().RoleCodeNavigation.DisplayName ?? "Patient"
                ));
            CreateMap<Patient, PatientDTO>();
            CreateMap<Cmspage, CmspageDto>();
            CreateMap<ContentCategory, ContentCategoryDTO>();
            CreateMap<HealthArticle, HealthArticlePublicDto>()
                 .ForMember(dest => dest.AuthorName,
                            opt => opt.MapFrom(src => src.Author != null ? src.Author.FullName : string.Empty))
                 .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Content))
                 .ForMember(dest => dest.MetaTitle, opt => opt.MapFrom(src => src.MetaTitle))
                 .ForMember(dest => dest.MetaDescription, opt => opt.MapFrom(src => src.MetaDescription))
                 .ForMember(dest => dest.PublishedAt, opt => opt.MapFrom(src => src.PublishedAt))
                 .ForMember(dest => dest.IsHomepageVisible, opt => opt.MapFrom(src => src.IsHomepageVisible))
                 .ForMember(dest => dest.DisplayOrder, opt => opt.MapFrom(src => src.DisplayOrder));

            CreateMap<SiteBanner, SiteBannerDto>();
            CreateMap<PasswordUpdatePresenter, PasswordUpdateRequest>();
            CreateMap<DoctorRegisterPresenter, DoctorRegisterRequest>();
            CreateMap<User, UserBasicInfoDto>();
            CreateMap<DoctorSchedule, DoctorScheduleDto>()
                .ForMember(dest => dest.DoctorName,
                    opt => opt.MapFrom(src => src.Doctor != null && src.Doctor.User != null
                        ? src.Doctor.User.FullName
                        : string.Empty));
            CreateMap<CreateDoctorScheduleDto, DoctorSchedule>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

            CreateMap<UpdateDoctorScheduleDto, DoctorSchedule>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

            CreateMap<Appointment, AppointmentDto>()
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.User.FullName))
            .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Doctor.User.FullName))
            .ForMember(dest => dest.StatusDisplayName, opt => opt.MapFrom(src => src.StatusCodeNavigation.DisplayName))
            .ForMember(dest => dest.PaymentStatusName, opt => opt.MapFrom(src => src.PaymentStatusCodeNavigation.DisplayName))
            .ForMember(dest => dest.PaymentMethodName, opt => opt.MapFrom(src => src.PaymentMethodCodeNavigation != null
                ? src.PaymentMethodCodeNavigation.DisplayName
                : null));

            // ✅ DTO → Entity
            CreateMap<CreateAppointmentDto, Appointment>();
            CreateMap<UpdateAppointmentDto, Appointment>();
            CreateMap<MedicalRecord, MedicalRecordDto>()
               .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Appointment.Patient.User.FullName))
               .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Appointment.Doctor.User.FullName))
               .ForMember(dest => dest.AppointmentDate, opt => opt.MapFrom(src => src.Appointment.AppointmentStartTime))
               .ForMember(dest => dest.Prescriptions, opt => opt.MapFrom(src => src.Prescriptions));

            CreateMap<MedicalRecord, MedicalRecordDto>()
     .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Appointment.Patient.User.FullName))
     .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Appointment.Doctor.User.FullName))
     .ForMember(dest => dest.AppointmentDate, opt => opt.MapFrom(src => src.Appointment.AppointmentStartTime))
     .ForMember(dest => dest.Prescriptions, opt => opt.MapFrom(src => src.Prescriptions));

            CreateMap<CreateOrUpdateMedicalRecordDto, MedicalRecord>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());


            // --- ✅ Prescription ---
            CreateMap<Prescription, PrescriptionDto>();
            CreateMap<CreatePrescriptionDto, Prescription>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.MedicalRecordId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());


            CreateMap<Review, ReviewDoctorDto>()
                 .ForMember(dest => dest.DoctorId, opt => opt.MapFrom(src => src.Appointment.DoctorId))
                 .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Appointment.Doctor.User.FullName))
                 .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Appointment.Patient.User.FullName))
                 .ReverseMap();

            CreateMap<Review, ReviewDoctorDto>()
               .ForMember(dest => dest.DoctorId, opt => opt.MapFrom(src => src.Appointment.DoctorId))
               .ForMember(dest => dest.DoctorName, opt => opt.MapFrom(src => src.Appointment.Doctor.User.FullName))
               .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Appointment.Patient.User.FullName))
               .ReverseMap();

            CreateMap<CreateReviewDto, Review>()
                .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
                .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.Rating))
                .ForMember(dest => dest.AppointmentId, opt => opt.MapFrom(src => src.AppointmentId))
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.AdminResponse, opt => opt.Ignore());
            CreateMap<UpdateReviewDto, Review>()
               .ForMember(dest => dest.Comment, opt => opt.MapFrom(src => src.Comment))
               .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.Rating))
               .ForMember(dest => dest.AppointmentId, opt => opt.MapFrom(src => src.AppointmentId))
               .ForMember(dest => dest.Status, opt => opt.Ignore())
               .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
               .ForMember(dest => dest.AdminResponse, opt => opt.Ignore());

            CreateMap<DoctorScheduleOverride, DoctorScheduleOverrideDto>().ReverseMap();
            CreateMap<CreateDoctorScheduleOverrideDto, DoctorScheduleOverride>();
            CreateMap<UpdateDoctorScheduleOverrideDto, DoctorScheduleOverride>();
        }
    }
}
