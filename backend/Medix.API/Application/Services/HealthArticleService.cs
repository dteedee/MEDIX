using AutoMapper;
using Medix.API.Application.Exceptions;
using Medix.API.Data;
using Medix.API.Data.Models;
using Medix.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Application.Services
{
    public class HealthArticleService : IHealthArticleService
    {
        private readonly MedixContext _context;
        private readonly IMapper _mapper;

        public HealthArticleService(MedixContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetAllAsync(int page = 1, int pageSize = 10)
        {
            var query = _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.Categories)
                .OrderByDescending(a => a.PublishedAt)
                .AsQueryable();

            var total = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new HealthArticlePublicDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    Content = a.Content,
                    ThumbnailUrl = a.ThumbnailUrl,
                    CoverImageUrl = a.CoverImageUrl,
                    AuthorName = a.Author.FullName,
                    PublishedAt = a.PublishedAt,
                    ViewCount = a.ViewCount,
                    LikeCount = a.LikeCount,
                    Categories = a.Categories.Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    }).ToList()
                })
                .ToListAsync();

            return (total, data);
        }

        public async Task<HealthArticlePublicDto?> GetByIdAsync(Guid id)
        {
            var article = await _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.Categories)
                .Where(a => a.Id == id)
                .Select(a => new HealthArticlePublicDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    Content = a.Content,
                    ThumbnailUrl = a.ThumbnailUrl,
                    CoverImageUrl = a.CoverImageUrl,
                    AuthorName = a.Author.FullName,
                    PublishedAt = a.PublishedAt,
                    ViewCount = a.ViewCount,
                    LikeCount = a.LikeCount,
                    Categories = a.Categories.Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            return article;
        }

        public async Task<IEnumerable<HealthArticlePublicDto>> SearchAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Keyword", new[] { "Vui lòng nhập từ khóa tìm kiếm" } }
                });
            }

            var data = await _context.HealthArticles
                .Include(a => a.Author)
                .Include(a => a.Categories)
                .Where(a => a.Title.Contains(keyword) || (a.Summary ?? "").Contains(keyword))
                .OrderByDescending(a => a.PublishedAt)
                .Select(a => new HealthArticlePublicDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Slug = a.Slug,
                    Summary = a.Summary,
                    Content = a.Content,
                    ThumbnailUrl = a.ThumbnailUrl,
                    CoverImageUrl = a.CoverImageUrl,
                    AuthorName = a.Author.FullName,
                    PublishedAt = a.PublishedAt,
                    ViewCount = a.ViewCount,
                    LikeCount = a.LikeCount,
                    Categories = a.Categories.Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    }).ToList()
                })
                .ToListAsync();

            return data;
        }

        public async Task<HealthArticlePublicDto> CreateAsync(HealthArticleCreateDto createDto)
        {
            var slugExists = await _context.HealthArticles.AnyAsync(a => a.Slug == createDto.Slug);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Slug", new[] { "Slug đã tồn tại. Vui lòng chọn slug khác" } }
                });
            }

            var statusExists = await _context.RefArticleStatuses.AnyAsync(s => s.Code == createDto.StatusCode);
            if (!statusExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "StatusCode", new[] { "StatusCode không hợp lệ" } }
                });
            }

            var article = new HealthArticle
            {
                Id = Guid.NewGuid(),
                Title = createDto.Title,
                Slug = createDto.Slug,
                Summary = createDto.Summary,
                Content = createDto.Content,
                DisplayType = createDto.DisplayType,
                ThumbnailUrl = createDto.ThumbnailUrl,
                CoverImageUrl = createDto.CoverImageUrl,
                IsHomepageVisible = createDto.IsHomepageVisible,
                DisplayOrder = createDto.DisplayOrder,
                MetaTitle = createDto.MetaTitle,
                MetaDescription = createDto.MetaDescription,
                AuthorId = createDto.AuthorId,
                StatusCode = createDto.StatusCode,
                PublishedAt = createDto.PublishedAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.HealthArticles.Add(article);
            await _context.SaveChangesAsync();

            var categories = await _context.ContentCategories
                .Where(c => createDto.CategoryIds.Contains(c.Id))
                .ToListAsync();

            article.Categories = categories;
            await _context.SaveChangesAsync();

            return await GetByIdAsync(article.Id) ?? throw new MedixException("Failed to retrieve created article");
        }

        public async Task<HealthArticleUpdateDto> GetForEditAsync(Guid id)
        {
            var article = await _context.HealthArticles
                .Include(a => a.Categories)
                .Include(a => a.Author)
                .Include(a => a.StatusCodeNavigation)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (article == null)
            {
                throw new NotFoundException("Không tìm thấy bài viết");
            }

            var dto = new HealthArticleUpdateDto
            {
                Title = article.Title,
                Slug = article.Slug,
                Summary = article.Summary,
                Content = article.Content,
                DisplayType = article.DisplayType,
                ThumbnailUrl = article.ThumbnailUrl,
                CoverImageUrl = article.CoverImageUrl,
                IsHomepageVisible = article.IsHomepageVisible,
                DisplayOrder = article.DisplayOrder,
                MetaTitle = article.MetaTitle,
                MetaDescription = article.MetaDescription,
                AuthorId = article.AuthorId,
                StatusCode = article.StatusCode,
                PublishedAt = article.PublishedAt,
                CategoryIds = article.Categories.Select(c => c.Id).ToList()
            };

            return dto;
        }

        public async Task<HealthArticlePublicDto> UpdateAsync(Guid id, HealthArticleUpdateDto updateDto)
        {
            var article = await _context.HealthArticles
                .Include(a => a.Categories)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (article == null)
            {
                throw new NotFoundException("Không tìm thấy bài viết để cập nhật");
            }

            var slugExists = await _context.HealthArticles
                .AnyAsync(a => a.Slug == updateDto.Slug && a.Id != id);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Slug", new[] { "Slug đã tồn tại. Vui lòng chọn slug khác" } }
                });
            }

            var authorExists = await _context.Users.AnyAsync(u => u.Id == updateDto.AuthorId);
            if (!authorExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "AuthorId", new[] { "AuthorId không hợp lệ" } }
                });
            }

            var statusExists = await _context.RefArticleStatuses.AnyAsync(s => s.Code == updateDto.StatusCode);
            if (!statusExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "StatusCode", new[] { "StatusCode không hợp lệ" } }
                });
            }

            article.Title = updateDto.Title;
            article.Slug = updateDto.Slug;
            article.Summary = updateDto.Summary;
            article.Content = updateDto.Content;
            article.DisplayType = updateDto.DisplayType;
            article.ThumbnailUrl = updateDto.ThumbnailUrl;
            article.CoverImageUrl = updateDto.CoverImageUrl;
            article.IsHomepageVisible = updateDto.IsHomepageVisible;
            article.DisplayOrder = updateDto.DisplayOrder;
            article.MetaTitle = updateDto.MetaTitle;
            article.MetaDescription = updateDto.MetaDescription;
            article.AuthorId = updateDto.AuthorId;
            article.StatusCode = updateDto.StatusCode;
            article.PublishedAt = updateDto.PublishedAt;
            article.UpdatedAt = DateTime.UtcNow;

            article.Categories.Clear();
            article.Categories = await _context.ContentCategories
                .Where(c => updateDto.CategoryIds.Contains(c.Id))
                .ToListAsync();

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id) ?? throw new MedixException("Failed to retrieve updated article");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var article = await _context.HealthArticles.FindAsync(id);
            if (article == null)
            {
                throw new NotFoundException("Không tìm thấy bài viết để xóa");
            }

            _context.HealthArticles.Remove(article);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
