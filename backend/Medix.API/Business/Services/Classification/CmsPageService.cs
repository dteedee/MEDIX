using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.CMSPage;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class CmspageService : ICmspageService
    {
        private readonly ICmspageRepository _cmspageRepository;

        public CmspageService(ICmspageRepository cmspageRepository)
        {
            _cmspageRepository = cmspageRepository;
        }

        public async Task<IEnumerable<CmspageDto>> GetAllAsync()
        {
            var pages = await _cmspageRepository.GetAllWithAuthorAsync();
            
            return pages.Select(p => new CmspageDto
            {
                Id = p.Id,
                PageTitle = p.PageTitle,
                PageSlug = p.PageSlug,
                PageContent = p.PageContent,
                MetaTitle = p.MetaTitle,
                MetaDescription = p.MetaDescription,
                IsPublished = p.IsPublished,
                PublishedAt = p.PublishedAt,
                AuthorName = p.Author?.FullName ?? string.Empty,
                ViewCount = p.ViewCount,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            });
        }

        public async Task<CmspageDto?> GetByIdAsync(Guid id)
        {
            var page = await _cmspageRepository.GetByIdWithAuthorAsync(id);
            
            if (page == null)
                return null;

            return new CmspageDto
            {
                Id = page.Id,
                PageTitle = page.PageTitle,
                PageSlug = page.PageSlug,
                PageContent = page.PageContent,
                MetaTitle = page.MetaTitle,
                MetaDescription = page.MetaDescription,
                IsPublished = page.IsPublished,
                PublishedAt = page.PublishedAt,
                AuthorName = page.Author?.FullName ?? string.Empty,
                ViewCount = page.ViewCount,
                CreatedAt = page.CreatedAt,
                UpdatedAt = page.UpdatedAt
            };
        }

        public async Task<CmspageDto> CreateAsync(CmspageCreateDto createDto)
        {
            var slugExists = await _cmspageRepository.SlugExistsAsync(createDto.PageSlug);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "PageSlug", new[] { "Page slug already exists" } }
                });
            }

            var authorExists = await _cmspageRepository.UserExistsAsync(createDto.AuthorId);
            if (!authorExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "AuthorId", new[] { "Author does not exist" } }
                });
            }

            var page = new Cmspage
            {
                Id = Guid.NewGuid(),
                PageTitle = createDto.PageTitle,
                PageSlug = createDto.PageSlug,
                PageContent = createDto.PageContent,
                MetaTitle = createDto.MetaTitle,
                MetaDescription = createDto.MetaDescription,
                IsPublished = createDto.IsPublished,
                PublishedAt = createDto.PublishedAt,
                AuthorId = createDto.AuthorId,
                ViewCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _cmspageRepository.CreateAsync(page);

            return await GetByIdAsync(page.Id) ?? throw new MedixException("Failed to retrieve created page");
        }

        public async Task<CmspageDto> UpdateAsync(Guid id, CmspageUpdateDto updateDto)
        {
            var page = await _cmspageRepository.GetByIdWithAuthorAsync(id);
            if (page == null)
            {
                throw new NotFoundException("Page not found");
            }

            var slugExists = await _cmspageRepository.SlugExistsAsync(updateDto.PageSlug, id);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "PageSlug", new[] { "Page slug already exists" } }
                });
            }

            var authorExists = await _cmspageRepository.UserExistsAsync(updateDto.AuthorId);
            if (!authorExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "AuthorId", new[] { "Author does not exist" } }
                });
            }

            page.PageTitle = updateDto.PageTitle;
            page.PageSlug = updateDto.PageSlug;
            page.PageContent = updateDto.PageContent;
            page.MetaTitle = updateDto.MetaTitle;
            page.MetaDescription = updateDto.MetaDescription;
            page.IsPublished = updateDto.IsPublished;
            page.PublishedAt = updateDto.PublishedAt;
            page.AuthorId = updateDto.AuthorId;
            page.UpdatedAt = DateTime.UtcNow;

            await _cmspageRepository.UpdateAsync(page);

            return await GetByIdAsync(id) ?? throw new MedixException("Failed to retrieve updated page");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var deleted = await _cmspageRepository.DeleteAsync(id);
            if (!deleted)
            {
                throw new NotFoundException("Page not found");
            }

            return true;
        }

        public async Task<(int total, IEnumerable<CmspageDto> data)> GetPagedAsync(int page = 1, int pageSize = 10)
        {
            var (pages, total) = await _cmspageRepository.GetPagedAsync(page, pageSize);

            var data = pages.Select(p => new CmspageDto
            {
                Id = p.Id,
                PageTitle = p.PageTitle,
                PageSlug = p.PageSlug,
                PageContent = p.PageContent,
                MetaTitle = p.MetaTitle,
                MetaDescription = p.MetaDescription,
                IsPublished = p.IsPublished,
                PublishedAt = p.PublishedAt,
                AuthorName = p.Author?.FullName ?? string.Empty,
                ViewCount = p.ViewCount,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            });

            return (total, data);
        }

        public async Task<IEnumerable<CmspageDto>> SearchByNameAsync(string name)
        {
            var pages = await _cmspageRepository.SearchByNameAsync(name);

            var data = pages.Select(p => new CmspageDto
            {
                Id = p.Id,
                PageTitle = p.PageTitle,
                PageSlug = p.PageSlug,
                PageContent = p.PageContent,
                MetaTitle = p.MetaTitle,
                MetaDescription = p.MetaDescription,
                IsPublished = p.IsPublished,
                PublishedAt = p.PublishedAt,
                AuthorName = p.Author?.FullName ?? string.Empty,
                ViewCount = p.ViewCount,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            });

            return data;
        }
    }
}
