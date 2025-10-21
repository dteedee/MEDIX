using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.HealthArticle;
using Medix.API.Models.Entities;
using Medix.API.Business.Helper;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Medix.API.Business.Services.Classification
{
    public class HealthArticleService : IHealthArticleService
    {
        private readonly IHealthArticleRepository _healthArticleRepository;
        private readonly IContentCategoryRepository _contentCategoryRepository;
        private readonly IMapper _mapper;

        public HealthArticleService(IHealthArticleRepository healthArticleRepository, IContentCategoryRepository contentCategoryRepository, IMapper mapper)
        {
            _healthArticleRepository = healthArticleRepository;
            _contentCategoryRepository = contentCategoryRepository;
            _mapper = mapper;
        }

        public async Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetPagedAsync(int page = 1, int pageSize = 10)
        {
            var (articles, total) = await _healthArticleRepository.GetPagedAsync(page, pageSize);

            var data = articles.Select(a => new HealthArticlePublicDto
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
         .Select(c => new HealthArticlePublicDto.CategoryInfo
         {
             Name = c.Name,
             Slug = c.Slug
         })
         .ToList()
            });


            return (total, data);
        }

        public async Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetPublishedPagedAsync(int page = 1, int pageSize = 10)
        {
            var (articles, total) = await _healthArticleRepository.GetPublishedPagedAsync(page, pageSize);

            var data = articles.Select(a => new HealthArticlePublicDto
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

                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                DisplayType = a.DisplayType,
                Categories = a.Categories
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            });

            return (total, data);
        }

        public async Task<HealthArticlePublicDto?> GetByIdAsync(Guid id)
        {
            var article = await _healthArticleRepository.GetByIdWithDetailsAsync(id);

            if (article == null)
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

                IsHomepageVisible = article.IsHomepageVisible,
                DisplayOrder = article.DisplayOrder,
                DisplayType = article.DisplayType,
                AuthorName = article.Author?.FullName ?? string.Empty,
                CreatedAt = article.CreatedAt,
                UpdatedAt = article.UpdatedAt,
                Categories = article.Categories
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
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

            // Increment view count
            await _healthArticleRepository.IncrementViewCountAsync(article.Id);

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
                ViewCount = article.ViewCount + 1, // Show incremented count
                LikeCount = article.LikeCount,

                IsHomepageVisible = article.IsHomepageVisible,
                DisplayOrder = article.DisplayOrder,
                DisplayType = article.DisplayType,
                AuthorName = article.Author?.FullName ?? string.Empty,
                CreatedAt = article.CreatedAt,
                UpdatedAt = article.UpdatedAt,
                Categories = article.Categories
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            };
        }

        public async Task<(int total, IEnumerable<HealthArticlePublicDto> data)> GetByCategoryAsync(Guid categoryId, int page = 1, int pageSize = 10)
        {
            var (articles, total) = await _healthArticleRepository.GetByCategoryAsync(categoryId, page, pageSize);

            var data = articles.Select(a => new HealthArticlePublicDto
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

                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                DisplayType = a.DisplayType,
                Categories = a.Categories
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
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

            return articles.Select(a => new HealthArticlePublicDto
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

                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                Categories = a.Categories
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            });
        }

        public async Task<IEnumerable<HealthArticlePublicDto>> SearchByNameAsync(string name)
        {
            var articles = await _healthArticleRepository.SearchByNameAsync(name);

            var data = articles.Select(a => new HealthArticlePublicDto
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

                AuthorName = a.Author?.FullName ?? string.Empty,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                DisplayType = a.DisplayType,
                Categories = a.Categories
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
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
                    { "Title", new[] { "Article title already exists" } }
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

                IsHomepageVisible = createDto.IsHomepageVisible,
                DisplayOrder = createDto.DisplayOrder,
                DisplayType = createDto.DisplayType ?? "Standard",
                AuthorId = createDto.AuthorId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Attach categories if provided
            if (createDto.CategoryIds != null && createDto.CategoryIds.Any())
            {
                var distinctIds = createDto.CategoryIds.Distinct().ToList();
                var categories = await _contentCategoryRepository.GetAllActiveAsync();
                var matched = categories.Where(c => distinctIds.Contains(c.Id)).ToList();

                if (matched.Count != distinctIds.Count)
                {
                    var missing = distinctIds.Except(matched.Select(c => c.Id)).ToList();
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "CategoryIds", new[] { $"Some categories not found: {string.Join(',', missing)}" } }
                    });
                }

                foreach (var cat in matched)
                    article.Categories.Add(cat);
            }

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
                        { "Slug", new[] { "Article slug already exists" } }
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

            article.Title = updateDto.Title;
            article.Slug = updateDto.Slug;
            article.Summary = updateDto.Summary;
            article.Content = updateDto.Content;
            article.CoverImageUrl = updateDto.CoverImageUrl;
            article.ThumbnailUrl = updateDto.ThumbnailUrl;
            article.MetaTitle = updateDto.MetaTitle;
            article.MetaDescription = updateDto.MetaDescription;
            article.StatusCode = updateDto.StatusCode;
            article.IsHomepageVisible = updateDto.IsHomepageVisible;
            article.DisplayOrder = updateDto.DisplayOrder;
            article.DisplayType = updateDto.DisplayType;
            article.AuthorId = updateDto.AuthorId;
            article.UpdatedAt = DateTime.UtcNow;

            // Update categories if provided
            if (updateDto.CategoryIds != null)
            {
                var distinctIds = updateDto.CategoryIds.Distinct().ToList();
                var categories = await _contentCategoryRepository.GetAllActiveAsync();
                var matched = categories.Where(c => distinctIds.Contains(c.Id)).ToList();

                if (matched.Count != distinctIds.Count)
                {
                    var missing = distinctIds.Except(matched.Select(c => c.Id)).ToList();
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "CategoryIds", new[] { $"Some categories not found: {string.Join(',', missing)}" } }
                    });
                }

                // Replace article categories with requested set
                article.Categories.Clear();
                foreach (var cat in matched)
                    article.Categories.Add(cat);
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
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
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
                    .Select(c => new HealthArticlePublicDto.CategoryInfo
                    {
                        Name = c.Name,
                        Slug = c.Slug
                    })
                    .ToList()
            };
        }
    }
}
