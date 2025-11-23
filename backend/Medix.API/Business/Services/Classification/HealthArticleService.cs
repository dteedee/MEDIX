using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.HealthArticle;
using Medix.API.Models.Entities;
using Medix.API.Business.Helper;
using Microsoft.AspNetCore.Http.HttpResults;
using System.Security.Claims;

namespace Medix.API.Business.Services.Classification
{
    public class HealthArticleService : IHealthArticleService
    {
        private readonly IHealthArticleRepository _healthArticleRepository;
        private readonly IContentCategoryRepository _contentCategoryRepository;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;


        public HealthArticleService(IHealthArticleRepository healthArticleRepository, IContentCategoryRepository contentCategoryRepository, IMapper mapper)
        {
            _healthArticleRepository = healthArticleRepository;
            _contentCategoryRepository = contentCategoryRepository;
            _mapper = mapper;
        }
        private Guid GetCurrentUserId()
        {
            var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedAccessException("User ID not found in token.");

            return Guid.Parse(userId);
        }
        public async Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetPagedAsync(int page = 1, int pageSize = 10)
        {
            var (articles, total) = await _healthArticleRepository.GetPagedAsync(page, pageSize);

            // CHỈ trả về articles có ít nhất 1 category active
            var filteredArticles = articles.Where(a => a.Categories.Any(c => c.IsActive)).ToList();

            var data = filteredArticles.Select(a => new HealthArticlePublicDto
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                Summary = a.Summary,
                Content = a.Content, 
                MetaTitle = a.MetaTitle, 
                MetaDescription = a.MetaDescription, 
                PublishedAt = a.PublishedAt, 
                IsHomepageVisible = a.IsHomepageVisible,
                DisplayOrder = a.DisplayOrder,
                
                CoverImageUrl = a.CoverImageUrl,
                ThumbnailUrl = a.ThumbnailUrl,
                StatusCode = a.StatusCode,
                ViewCount = a.ViewCount,
                LikeCount = a.LikeCount,
                DisplayType = a.DisplayType,

                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,

                Categories = a.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            });

            return (filteredArticles.Count, data);
        }

        public async Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetPublishedPagedAsync(int page = 1, int pageSize = 10)
        {
            var (articles, total) = await _healthArticleRepository.GetPublishedPagedAsync(page, pageSize);

            // CHỈ trả về articles có ít nhất 1 category active
            var filteredArticles = articles.Where(a => a.Categories.Any(c => c.IsActive)).ToList();

            var data = filteredArticles.Select(a => new HealthArticlePublicDto
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                Summary = a.Summary,
                CoverImageUrl = a.CoverImageUrl,
                ThumbnailUrl = a.ThumbnailUrl,
                StatusCode = a.StatusCode,
                ViewCount = a.ViewCount,
                LikeCount = a.LikeCount,
                PublishedAt = a.PublishedAt,
                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                DisplayType = a.DisplayType,
                Categories = a.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            });

            return (filteredArticles.Count, data);
        }

        public async Task<HealthArticlePublicDto?> GetByIdAsync(Guid id)
        {
            var article = await _healthArticleRepository.GetByIdWithDetailsAsync(id);

            if (article == null)
                return null;

            // CHỈ trả về nếu article có ít nhất 1 category active
            if (!article.Categories.Any(c => c.IsActive))
                return null;

            return new HealthArticlePublicDto
            {
                Id = article.Id,
                Title = article.Title,
                Slug = article.Slug,
                Summary = article.Summary,
                Content = article.Content,
                CoverImageUrl = article.CoverImageUrl,
                ThumbnailUrl = article.ThumbnailUrl,
                MetaTitle = article.MetaTitle,
                MetaDescription = article.MetaDescription,
                StatusCode = article.StatusCode,
                ViewCount = article.ViewCount,
                LikeCount = article.LikeCount,
                PublishedAt = article.PublishedAt,
                IsHomepageVisible = article.IsHomepageVisible,
                DisplayOrder = article.DisplayOrder,
                DisplayType = article.DisplayType,
                AuthorName = article.Author?.FullName ?? string.Empty,
                CreatedAt = article.CreatedAt,
                UpdatedAt = article.UpdatedAt,
                Categories = article.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            };
        }

        public async Task<HealthArticlePublicDto?> GetBySlugAsync(string slug)
        {
            var article = await _healthArticleRepository.GetBySlugAsync(slug);

            if (article == null)
                return null;

            // CHỈ trả về nếu article có ít nhất 1 category active
            if (!article.Categories.Any(c => c.IsActive))
                return null;

            return new HealthArticlePublicDto
            {
                Id = article.Id,
                Title = article.Title,
                Slug = article.Slug,
                Summary = article.Summary,
                Content = article.Content,
                CoverImageUrl = article.CoverImageUrl,
                ThumbnailUrl = article.ThumbnailUrl,
                MetaTitle = article.MetaTitle,
                MetaDescription = article.MetaDescription,
                StatusCode = article.StatusCode,
                ViewCount = article.ViewCount, // Return the actual current count
                LikeCount = article.LikeCount,
                PublishedAt = article.PublishedAt,
                IsHomepageVisible = article.IsHomepageVisible,
                DisplayOrder = article.DisplayOrder,
                DisplayType = article.DisplayType,
                AuthorName = article.Author?.FullName ?? string.Empty,
                CreatedAt = article.CreatedAt,
                UpdatedAt = article.UpdatedAt,
                Categories = article.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            };
        }

        // New method specifically for incrementing view count
        public async Task IncrementViewCountOnlyAsync(Guid articleId)
        {
            await _healthArticleRepository.IncrementViewCountAsync(articleId);
        }

        public async Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetByCategoryAsync(Guid categoryId, int page = 1, int pageSize = 10)
        {
            var (articles, total) = await _healthArticleRepository.GetByCategoryAsync(categoryId, page, pageSize);

            // CHỈ trả về articles có ít nhất 1 category active
            var filteredArticles = articles.Where(a => a.Categories.Any(c => c.IsActive)).ToList();

            var data = filteredArticles.Select(a => new HealthArticlePublicDto
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                Summary = a.Summary,
                CoverImageUrl = a.CoverImageUrl,
                ThumbnailUrl = a.ThumbnailUrl,
                StatusCode = a.StatusCode,
                ViewCount = a.ViewCount,
                LikeCount = a.LikeCount,
                PublishedAt = a.PublishedAt,
                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                DisplayType = a.DisplayType,
                Categories = a.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            });

            return (total, data);
        }

        public async Task<IEnumerable<HealthArticlePublicDto>> GetHomepageArticlesAsync(int limit = 5)
        {
            var articles = await _healthArticleRepository.GetHomepageArticlesAsync(limit);

            // CHỈ trả về articles có ít nhất 1 category active
            var filteredArticles = articles.Where(a => a.Categories.Any(c => c.IsActive));

            return filteredArticles.Select(a => new HealthArticlePublicDto
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                Summary = a.Summary,
                CoverImageUrl = a.CoverImageUrl,
                ThumbnailUrl = a.ThumbnailUrl,
                StatusCode = a.StatusCode,
                ViewCount = a.ViewCount,
                LikeCount = a.LikeCount,
                IsHomepageVisible = a.IsHomepageVisible,
                DisplayOrder = a.DisplayOrder,
                DisplayType = a.DisplayType,
                PublishedAt = a.PublishedAt,
                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                Categories = a.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            });
        }

        public async Task<IEnumerable<HealthArticlePublicDto>> SearchByNameAsync(string name)
        {
            var articles = await _healthArticleRepository.SearchByNameAsync(name);

            // CHỈ trả về articles có ít nhất 1 category active
            var filteredArticles = articles.Where(a => a.Categories.Any(c => c.IsActive));

            var data = filteredArticles.Select(a => new HealthArticlePublicDto
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                Summary = a.Summary,
                CoverImageUrl = a.CoverImageUrl,
                ThumbnailUrl = a.ThumbnailUrl,
                StatusCode = a.StatusCode,
                ViewCount = a.ViewCount,
                LikeCount = a.LikeCount,
                PublishedAt = a.PublishedAt,
                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                DisplayType = a.DisplayType,
                Categories = a.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            });

            return data;
        }

        public async Task<HealthArticlePublicDto> CreateAsync(HealthArticleCreateDto createDto)
        {
            var slugExists = await _healthArticleRepository.SlugExistsAsync(createDto.Slug);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Slug", new[] { "Article slug already exists" } }
                });
            }
            var titleExists = await _healthArticleRepository.TitleExistsAsync(createDto.Title);
            if (titleExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Title", new[] { "Article title đã tồn tại" } }
                });
            }

            var article = new HealthArticle
            {
                Id = Guid.NewGuid(),
                Title = createDto.Title,
                Slug = createDto.Slug,
                Summary = createDto.Summary,
                Content = createDto.Content,
                CoverImageUrl = createDto.CoverImageUrl,
                ThumbnailUrl = createDto.ThumbnailUrl,
                MetaTitle = createDto.MetaTitle,
                MetaDescription = createDto.MetaDescription,
                StatusCode = createDto.StatusCode ?? "Draft",
                ViewCount = 0,
                LikeCount = 0,
                PublishedAt = createDto.PublishedAt,
                IsHomepageVisible = createDto.IsHomepageVisible,
                DisplayOrder = createDto.DisplayOrder,
                DisplayType = createDto.DisplayType ?? "Standard",
                AuthorId = createDto.AuthorId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Nếu bài viết được tạo với trạng thái Published, gán luôn ngày xuất bản
            if (article.StatusCode == "Published" && article.PublishedAt == null)
            {
                article.PublishedAt = DateTime.UtcNow;
            }

            // Validate categories - Bắt buộc phải có ít nhất 1 category
            if (createDto.CategoryIds == null || !createDto.CategoryIds.Any())
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CategoryIds", new[] { "Phải chọn ít nhất một danh mục bài viết" } }
                });
            }

            // Attach categories
            var distinctIds = createDto.CategoryIds.Distinct().ToList();
            var categories = await _contentCategoryRepository.GetAllActiveAsync();
            var matched = categories.Where(c => distinctIds.Contains(c.Id)).ToList();

            if (matched.Count != distinctIds.Count)
            {
                var missing = distinctIds.Except(matched.Select(c => c.Id)).ToList();
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CategoryIds", new[] { $"Một số danh mục không tồn tại hoặc không hoạt động: {string.Join(',', missing)}" } }
                });
            }

            // Validate tất cả categories phải active
            var inactiveCategories = matched.Where(c => !c.IsActive).ToList();
            if (inactiveCategories.Any())
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CategoryIds", new[] { $"Các danh mục sau không hoạt động: {string.Join(',', inactiveCategories.Select(c => c.Name))}" } }
                });
            }

            foreach (var cat in matched)
                article.Categories.Add(cat);

            // Tự động điều chỉnh thứ tự hiển thị: tăng các bài viết có DisplayOrder >= giá trị mới lên 1
            await _healthArticleRepository.IncrementDisplayOrderForConflictsAsync(createDto.DisplayOrder);

            await _healthArticleRepository.CreateAsync(article);

            return await GetByIdAsync(article.Id) ?? throw new MedixException("Failed to retrieve created article");
        }

        public async Task<HealthArticlePublicDto> UpdateAsync(Guid id, HealthArticleUpdateDto updateDto)
        {
            var article = await _healthArticleRepository.GetByIdWithDetailsAsync(id);
            if (article == null)
            {
                throw new NotFoundException("Article not found");
            }
            // Normalize current vs new values and skip checks when unchanged to avoid false-positive duplicates
            string Normalize(string? s) => string.IsNullOrWhiteSpace(s) ? string.Empty : s.Trim().ToLowerInvariant();

            var currentTitleNorm = Normalize(article.Title);
            var newTitleNorm = Normalize(updateDto.Title);
            if (currentTitleNorm != newTitleNorm)
            {
                var titleExists = await _healthArticleRepository.TitleExistsAsync(updateDto.Title, id);
                if (titleExists)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "Title", new[] { "Article title already exists" } }
                    });
                }
            }

            var currentSlugNorm = Normalize(article.Slug);
            var newSlugNorm = Normalize(updateDto.Slug);
            if (currentSlugNorm != newSlugNorm)
            {
                var slugExists = await _healthArticleRepository.SlugExistsAsync(updateDto.Slug, id);
                if (slugExists)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "Slug", new[] { "Article slug đã tồn tại" } }
                    });
                }
            }



            var authorExists = await _healthArticleRepository.UserExistsAsync(updateDto.AuthorId);
            if (!authorExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "AuthorId", new[] { "Author does not exist" } }
                });
            }

            // Ghi lại trạng thái cũ và DisplayOrder cũ trước khi map
            var oldStatusCode = article.StatusCode;
            var oldDisplayOrder = article.DisplayOrder;
            var newDisplayOrder = updateDto.DisplayOrder;

            // Logic cập nhật PublishedAt an toàn
            // Chỉ gán PublishedAt khi chuyển trạng thái sang "Published" lần đầu tiên.
            if (updateDto.StatusCode == "Published" && oldStatusCode != "Published")
            {
                if (article.PublishedAt == null)
                {
                    article.PublishedAt = DateTime.UtcNow;
                }
            }

            // Map các giá trị từ DTO vào entity
            _mapper.Map(updateDto, article);

            article.UpdatedAt = DateTime.UtcNow;

            // Validate categories - Bắt buộc phải có ít nhất 1 category
            if (updateDto.CategoryIds == null || !updateDto.CategoryIds.Any())
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CategoryIds", new[] { "Phải chọn ít nhất một danh mục bài viết" } }
                });
            }

            // Update categories
            var distinctIds = updateDto.CategoryIds.Distinct().ToList();
            var categories = await _contentCategoryRepository.GetAllActiveAsync();
            var matched = categories.Where(c => distinctIds.Contains(c.Id)).ToList();

            if (matched.Count != distinctIds.Count)
            {
                var missing = distinctIds.Except(matched.Select(c => c.Id)).ToList();
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CategoryIds", new[] { $"Một số danh mục không tồn tại hoặc không hoạt động: {string.Join(',', missing)}" } }
                });
            }

            // Validate tất cả categories phải active
            var inactiveCategories = matched.Where(c => !c.IsActive).ToList();
            if (inactiveCategories.Any())
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "CategoryIds", new[] { $"Các danh mục sau không hoạt động: {string.Join(',', inactiveCategories.Select(c => c.Name))}" } }
                });
            }

            // Replace article categories with requested set
            article.Categories.Clear();
            foreach (var cat in matched)
                article.Categories.Add(cat);

            // Nếu DisplayOrder thay đổi, điều chỉnh các bài viết khác có DisplayOrder >= giá trị mới
            // (DisplayOrder đã được map từ updateDto vào article ở dòng _mapper.Map)
            if (oldDisplayOrder != newDisplayOrder)
            {
                await _healthArticleRepository.IncrementDisplayOrderForConflictsAsync(newDisplayOrder, id);
            }

            await _healthArticleRepository.UpdateAsync(article);

            return await GetByIdAsync(id) ?? throw new MedixException("Failed to retrieve updated article");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var deleted = await _healthArticleRepository.DeleteAsync(id);
            if (!deleted)
            {
                throw new NotFoundException("Article not found");
            }

            return true;
        }
        public async Task<HealthArticlePublicDto?> LikeAsync(Guid id, Guid userId)
        {
            var article = await _healthArticleRepository.GetByIdWithDetailsAsync(id);
            if (article == null)
                return null;

            // If user already liked, return current state (idempotent)
            var already = await _healthArticleRepository.HasUserLikedAsync(id, userId);
            if (!already)
            {
                await _healthArticleRepository.AddLikeAsync(id, userId);
            }

            var updated = await _healthArticleRepository.GetByIdWithDetailsAsync(id);
            if (updated == null)
                return null;

            return new HealthArticlePublicDto
            {
                Id = updated.Id,
                Title = updated.Title,
                Slug = updated.Slug,
                Summary = updated.Summary,
                Content = updated.Content,
                CoverImageUrl = updated.CoverImageUrl,
                ThumbnailUrl = updated.ThumbnailUrl,
                MetaTitle = updated.MetaTitle,
                MetaDescription = updated.MetaDescription,
                StatusCode = updated.StatusCode,
                ViewCount = updated.ViewCount,
                LikeCount = updated.LikeCount,

                IsHomepageVisible = updated.IsHomepageVisible,
                DisplayOrder = updated.DisplayOrder,
                DisplayType = updated.DisplayType,
                AuthorName = updated.Author?.FullName ?? string.Empty,
                CreatedAt = updated.CreatedAt,
                UpdatedAt = updated.UpdatedAt,
                Categories = updated.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            };
        }

        public async Task<HealthArticlePublicDto?> UnlikeAsync(Guid id, Guid userId)
        {
            var article = await _healthArticleRepository.GetByIdWithDetailsAsync(id);
            if (article == null)
                return null;

            var already = await _healthArticleRepository.HasUserLikedAsync(id, userId);
            if (already)
            {
                await _healthArticleRepository.RemoveLikeAsync(id, userId);
            }

            var updated = await _healthArticleRepository.GetByIdWithDetailsAsync(id);
            if (updated == null)
                return null;

            return new HealthArticlePublicDto
            {
                Id = updated.Id,
                Title = updated.Title,
                Slug = updated.Slug,
                Summary = updated.Summary,
                Content = updated.Content,
                CoverImageUrl = updated.CoverImageUrl,
                ThumbnailUrl = updated.ThumbnailUrl,
                MetaTitle = updated.MetaTitle,
                MetaDescription = updated.MetaDescription,
                StatusCode = updated.StatusCode,
                ViewCount = updated.ViewCount,
                LikeCount = updated.LikeCount,

                IsHomepageVisible = updated.IsHomepageVisible,
                DisplayOrder = updated.DisplayOrder,
                DisplayType = updated.DisplayType,
                AuthorName = updated.Author?.FullName ?? string.Empty,
                CreatedAt = updated.CreatedAt,
                UpdatedAt = updated.UpdatedAt,
                Categories = updated.Categories
                    .Where(c => c.IsActive) // CHỈ trả về categories đang active
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            };
        }
    }
}
