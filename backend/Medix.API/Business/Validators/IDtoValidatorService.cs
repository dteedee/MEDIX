using Medix.API.Models.DTOs.CMSPage;
using Medix.API.Models.DTOs.ContentCategory;
using Medix.API.Models.DTOs.HealthArticle;
using Medix.API.Models.DTOs.SiteBanner;

namespace Medix.API.Business.Validators
{
    public interface IDtoValidatorService
    {
        Task ValidateCmsPageCreateAsync(CmspageCreateDto dto);
        Task ValidateCmsPageUpdateAsync(Guid id, CmspageUpdateDto dto);

        Task ValidateContentCategoryCreateAsync(ContentCategoryCreateDto dto);
        Task ValidateContentCategoryUpdateAsync(Guid id, ContentCategoryUpdateDto dto);

        Task ValidateHealthArticleCreateAsync(HealthArticleCreateDto dto);
        Task ValidateHealthArticleUpdateAsync(Guid id, HealthArticleUpdateDto dto);

        Task ValidateSiteBannerCreateAsync(SiteBannerCreateDto dto);
        Task ValidateSiteBannerUpdateAsync(Guid id, SiteBannerUpdateDto dto);
    }
}
