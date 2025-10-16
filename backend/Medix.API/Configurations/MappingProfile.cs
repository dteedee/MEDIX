using AutoMapper;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.CMSPage;
using Medix.API.Models.DTOs.ContentCategory;
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
            CreateMap<HealthArticle, HealthArticlePublicDto>();
            CreateMap<SiteBanner, SiteBannerDto>();
            CreateMap<User, UserBasicInfoDto>();
        }
    }
}
