using Medix.API.Models.DTOs.ContentCategory;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IContentCategoryService
    {
        Task<(int total, IEnumerable<ContentCategoryDTO> data)> GetPagedAsync(int page = 1, int pageSize = 10);
        Task<IEnumerable<ContentCategoryDTO>> SearchAsync(string keyword);
        Task<ContentCategoryDTO?> GetByIdAsync(Guid id);
        Task<ContentCategoryDTO> CreateAsync(ContentCategoryCreateDto createDto);
        Task<ContentCategoryDTO> UpdateAsync(Guid id, ContentCategoryUpdateDto updateDto);
        Task<bool> DeleteAsync(Guid id);
    }
}
