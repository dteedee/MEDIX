using AutoMapper;
using Medix.API.Application.Exceptions;
using Medix.API.Data;
using Medix.API.Data.Models;
using Medix.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Application.Services
{
    public class CmspageService : ICmspageService
    {
        private readonly MedixContext _context;
        private readonly IMapper _mapper;

        public CmspageService(MedixContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CmspageDto>> GetAllAsync()
        {
            var pages = await _context.Cmspages
                .Include(p => p.Author)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new CmspageDto
                {
                    Id = p.Id,
                    PageTitle = p.PageTitle,
                    PageSlug = p.PageSlug,
                    PageContent = p.PageContent,
                    MetaTitle = p.MetaTitle,
                    MetaDescription = p.MetaDescription,
                    IsPublished = p.IsPublished,
                    PublishedAt = p.PublishedAt,
                    AuthorName = p.Author.FullName,
                    ViewCount = p.ViewCount,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            return pages;
        }

        public async Task<CmspageDto?> GetByIdAsync(Guid id)
        {
            var page = await _context.Cmspages
                .Include(p => p.Author)
                .Where(p => p.Id == id)
                .Select(p => new CmspageDto
                {
                    Id = p.Id,
                    PageTitle = p.PageTitle,
                    PageSlug = p.PageSlug,
                    PageContent = p.PageContent,
                    MetaTitle = p.MetaTitle,
                    MetaDescription = p.MetaDescription,
                    IsPublished = p.IsPublished,
                    PublishedAt = p.PublishedAt,
                    AuthorName = p.Author.FullName,
                    ViewCount = p.ViewCount,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .FirstOrDefaultAsync();

            return page;
        }

        public async Task<CmspageDto> CreateAsync(CmspageCreateDto createDto)
        {
            var slugExists = await _context.Cmspages.AnyAsync(p => p.PageSlug == createDto.PageSlug);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "PageSlug", new[] { "PageSlug đã tồn tại" } }
                });
            }

            var authorExists = await _context.Users.AnyAsync(u => u.Id == createDto.AuthorId);
            if (!authorExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "AuthorId", new[] { "AuthorId không hợp lệ" } }
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

            _context.Cmspages.Add(page);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(page.Id) ?? throw new MedixException("Failed to retrieve created page");
        }

        public async Task<CmspageDto> UpdateAsync(Guid id, CmspageUpdateDto updateDto)
        {
            var page = await _context.Cmspages.FindAsync(id);
            if (page == null)
            {
                throw new NotFoundException("Không tìm thấy trang");
            }

            var slugExists = await _context.Cmspages
                .AnyAsync(p => p.PageSlug == updateDto.PageSlug && p.Id != id);
            if (slugExists)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "PageSlug", new[] { "PageSlug đã tồn tại" } }
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

            page.PageTitle = updateDto.PageTitle;
            page.PageSlug = updateDto.PageSlug;
            page.PageContent = updateDto.PageContent;
            page.MetaTitle = updateDto.MetaTitle;
            page.MetaDescription = updateDto.MetaDescription;
            page.IsPublished = updateDto.IsPublished;
            page.PublishedAt = updateDto.PublishedAt;
            page.AuthorId = updateDto.AuthorId;
            page.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(id) ?? throw new MedixException("Failed to retrieve updated page");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var page = await _context.Cmspages.FindAsync(id);
            if (page == null)
            {
                throw new NotFoundException("Không tìm thấy trang");
            }

            _context.Cmspages.Remove(page);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
