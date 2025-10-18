using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.CMSPage;
using Medix.API.Models.DTOs.ContentCategory;
using Medix.API.Models.DTOs.HealthArticle;
using Medix.API.Models.DTOs.SiteBanner;

namespace Medix.API.Business.Validators
{
    public class DtoValidatorService : IDtoValidatorService
    {
        private readonly ICmspageRepository _cmspageRepo;
        private readonly IContentCategoryRepository _categoryRepo;
        private readonly IHealthArticleRepository _articleRepo;
        private readonly ISiteBannerRepository _bannerRepo;

        public DtoValidatorService(
            ICmspageRepository cmspageRepo,
            IContentCategoryRepository categoryRepo,
            IHealthArticleRepository articleRepo,
            ISiteBannerRepository bannerRepo)
        {
            _cmspageRepo = cmspageRepo;
            _categoryRepo = categoryRepo;
            _articleRepo = articleRepo;
            _bannerRepo = bannerRepo;
        }

        public async Task ValidateCmsPageCreateAsync(CmspageCreateDto dto)
        {
            var errors = new Dictionary<string, string[]>();

            if (await _cmspageRepo.SlugExistsAsync(dto.PageSlug))
                errors.Add("PageSlug", new[] { "Page slug already exists" });

            if (!await _cmspageRepo.UserExistsAsync(dto.AuthorId))
                errors.Add("AuthorId", new[] { "Author does not exist" });

            if (errors.Any()) throw new ValidationException(errors);
        }

        public async Task ValidateCmsPageUpdateAsync(Guid id, CmspageUpdateDto dto)
        {
            var errors = new Dictionary<string, string[]>();
            if (await _cmspageRepo.SlugExistsAsync(dto.PageSlug, id))
                errors.Add("PageSlug", new[] { "Page slug already exists" });

            if (!await _cmspageRepo.UserExistsAsync(dto.AuthorId))
                errors.Add("AuthorId", new[] { "Author does not exist" });

            if (errors.Any()) throw new ValidationException(errors);
        }

        public async Task ValidateContentCategoryCreateAsync(ContentCategoryCreateDto dto)
        {
            var errors = new Dictionary<string, string[]>();

            if (await _categoryRepo.SlugExistsAsync(dto.Slug))
                errors.Add("Slug", new[] { "Slug already exists" });

            if (await _categoryRepo.NameExistsAsync(dto.Name))
                errors.Add("Name", new[] { "Category name already exists" });

            if (errors.Any()) throw new ValidationException(errors);
        }

        public async Task ValidateContentCategoryUpdateAsync(Guid id, ContentCategoryUpdateDto dto)
        {
            var errors = new Dictionary<string, string[]>();

            if (await _categoryRepo.SlugExistsAsync(dto.Slug, id))
                errors.Add("Slug", new[] { "Slug already exists" });

            if (await _categoryRepo.NameExistsAsync(dto.Name, id))
                errors.Add("Name", new[] { "Category name already exists" });

            if (errors.Any()) throw new ValidationException(errors);
        }

        public async Task ValidateHealthArticleCreateAsync(HealthArticleCreateDto dto)
        {
            var errors = new Dictionary<string, string[]>();

            if (await _articleRepo.SlugExistsAsync(dto.Slug))
                errors.Add("Slug", new[] { "Article slug already exists" });

            if (await _articleRepo.TitleExistsAsync(dto.Title))
                errors.Add("Title", new[] { "Article title already exists" });

            if (!await _articleRepo.UserExistsAsync(dto.AuthorId))
                errors.Add("AuthorId", new[] { "Author does not exist" });

            if (errors.Any()) throw new ValidationException(errors);
        }

        public async Task ValidateHealthArticleUpdateAsync(Guid id, HealthArticleUpdateDto dto)
        {
            var errors = new Dictionary<string, string[]>();

            if (await _articleRepo.SlugExistsAsync(dto.Slug, id))
                errors.Add("Slug", new[] { "Article slug already exists" });

            if (await _articleRepo.TitleExistsAsync(dto.Title, id))
                errors.Add("Title", new[] { "Article title already exists" });

            if (!await _articleRepo.UserExistsAsync(dto.AuthorId))
                errors.Add("AuthorId", new[] { "Author does not exist" });

            if (errors.Any()) throw new ValidationException(errors);
        }

        public async Task ValidateSiteBannerCreateAsync(SiteBannerCreateDto dto)
        {
            var errors = new Dictionary<string, string[]>();

            if (dto.EndDate < dto.StartDate)
                errors.Add("DateRange", new[] { "EndDate must be equal or later than StartDate." });

            if (errors.Any()) throw new ValidationException(errors);
        }

        public async Task ValidateSiteBannerUpdateAsync(Guid id, SiteBannerUpdateDto dto)
        {
            var errors = new Dictionary<string, string[]>();

            if (dto.EndDate < dto.StartDate)
                errors.Add("DateRange", new[] { "EndDate must be equal or later than StartDate." });

            if (errors.Any()) throw new ValidationException(errors);
        }
    }
}
