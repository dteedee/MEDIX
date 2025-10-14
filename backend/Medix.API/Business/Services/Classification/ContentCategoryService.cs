using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.ContentCategory;
using Medix.API.Models.Entities;
using Medix.API.Business.Helper;

namespace Medix.API.Business.Services.Classification
{
    public class ContentCategoryService : IContentCategoryService
    {
        private readonly IContentCategoryRepository _contentCategoryRepository;

        public ContentCategoryService(IContentCategoryRepository contentCategoryRepository)
        {
            _contentCategoryRepository = contentCategoryRepository;
        }

        public async Task<(int total, IEnumerable<ContentCategoryDTO> data)> GetPagedAsync(int page = 1, int pageSize = 10)
        {
            var (categories, total) = await _contentCategoryRepository.GetPagedAsync(page, pageSize);

            var data = categories.Select(c => new ContentCategoryDTO
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                IsActive = c.IsActive,
                ParentId = c.ParentId,
                ParentName = c.Parent?.Name
            });

            return (total, data);
        }

        public async Task<IEnumerable<ContentCategoryDTO>> SearchAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Keyword", new[] { "Please enter a search keyword" } }
                });
            }

            var categories = await _contentCategoryRepository.GetAllActiveAsync();
            var filteredCategories = categories.Where(c => c.Name.Contains(keyword, StringComparison.OrdinalIgnoreCase));

            return filteredCategories.Select(c => new ContentCategoryDTO
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                IsActive = c.IsActive,
                ParentId = c.ParentId,
                ParentName = c.Parent?.Name
            });
        }

        public async Task<ContentCategoryDTO?> GetByIdAsync(Guid id)
        {
            var category = await _contentCategoryRepository.GetByIdWithParentAsync(id);
            
            if (category == null)
                return null;

            return new ContentCategoryDTO
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                IsActive = category.IsActive,
                ParentId = category.ParentId,
                ParentName = category.Parent?.Name
            };
        }

        public async Task<ContentCategoryDTO> CreateAsync(ContentCategoryCreateDto createDto)
        {
            var slugExists = await _contentCategoryRepository.SlugExistsAsync(createDto.Slug);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Slug", new[] { "Slug already exists. Please choose a different slug" } }
                });
            }

            var nameExists = await _contentCategoryRepository.NameExistsAsync(createDto.Name);
            if (nameExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Name", new[] { "Category name already exists" } }
                });
            }

            if (createDto.ParentId.HasValue)
            {
                var parent = await _contentCategoryRepository.GetByIdWithParentAsync(createDto.ParentId.Value);
                if (parent == null)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "ParentId", new[] { "Parent category does not exist" } }
                    });
                }
            }

            var category = new ContentCategory
            {
                Id = Guid.NewGuid(),
                Name = createDto.Name,
                Slug = createDto.Slug,
                Description = createDto.Description,
                IsActive = createDto.IsActive,
                ParentId = createDto.ParentId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _contentCategoryRepository.CreateAsync(category);

            return await GetByIdAsync(category.Id) ?? throw new MedixException("Failed to retrieve created category");
        }

        public async Task<ContentCategoryDTO> UpdateAsync(Guid id, ContentCategoryUpdateDto updateDto)
        {
            var category = await _contentCategoryRepository.GetByIdWithParentAsync(id);
            if (category == null)
            {
                throw new NotFoundException("Category not found");
            }

            var slugExists = await _contentCategoryRepository.SlugExistsAsync(updateDto.Slug, id);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Slug", new[] { "Slug already exists. Please choose a different slug" } }
                });
            }

            var nameExists = await _contentCategoryRepository.NameExistsAsync(updateDto.Name, id);
            if (nameExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Name", new[] { "Category name already exists" } }
                });
            }

            if (updateDto.ParentId.HasValue)
            {
                if (updateDto.ParentId == id)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "ParentId", new[] { "Category cannot be its own parent" } }
                    });
                }

                var parent = await _contentCategoryRepository.GetByIdWithParentAsync(updateDto.ParentId.Value);
                if (parent == null)
                {
                    throw new ValidationException(new Dictionary<string, string[]>
                    {
                        { "ParentId", new[] { "Parent category does not exist" } }
                    });
                }
            }

            category.Name = updateDto.Name;
            category.Slug = updateDto.Slug;
            category.Description = updateDto.Description;
            category.IsActive = updateDto.IsActive;
            category.ParentId = updateDto.ParentId;
            category.UpdatedAt = DateTime.UtcNow;

            await _contentCategoryRepository.UpdateAsync(category);

            return await GetByIdAsync(id) ?? throw new MedixException("Failed to retrieve updated category");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var hasChildren = await _contentCategoryRepository.HasChildrenAsync(id);
            if (hasChildren)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "Id", new[] { "Cannot delete category that has child categories" } }
                });
            }

            var deleted = await _contentCategoryRepository.DeleteAsync(id);
            if (!deleted)
            {
                throw new NotFoundException("Category not found");
            }

            return true;
        }
    }
}
