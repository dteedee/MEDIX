using AutoMapper;
using Medix.API.Application.DTOs.Doctor;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.CMSPage;
using Medix.API.Models.DTOs.ContentCategory;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs.HealthArticle;
using Medix.API.Models.DTOs.SiteBanner;
using Medix.API.Models.Entities;

namespace Medix.API.Configurations
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<User, UserDto>();
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

           
        }
    }
}
