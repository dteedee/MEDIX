using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Exceptions;
using Medix.API.Models.DTOs.SiteBanner;
using Medix.API.Models.Entities;
using Medix.API.Business.Helper;
using Medix.API.Business.Validators;

namespace Medix.API.Business.Services.Classification
{
    public class SiteBannerService : ISiteBannerService
    {
        private readonly ISiteBannerRepository _siteBannerRepository;
        private readonly IMapper _mapper;
        private readonly IDtoValidatorService _validator;

        public SiteBannerService(ISiteBannerRepository siteBannerRepository, IMapper mapper, IDtoValidatorService validator)
        {
            _siteBannerRepository = siteBannerRepository;
            _mapper = mapper;
            _validator = validator;
        }

        public async Task<(int total, IEnumerable<SiteBannerDto> data)> GetPagedAsync(int page = 1, int pageSize = 10)
        {
            // Nếu pageSize lớn (ví dụ: > 1000), coi như yêu cầu lấy tất cả
            if (pageSize > 1000)
            {
                pageSize = int.MaxValue; // Lấy tất cả bản ghi
            }

            var (banners, total) = await _siteBannerRepository.GetPagedAsync(page, pageSize);

            var data = banners.Select(b => new SiteBannerDto
            {
                Id = b.Id,
                BannerTitle = b.BannerTitle,
                BannerImageUrl = b.BannerImageUrl,
                BannerUrl = b.BannerUrl,
                IsActive = b.IsActive,
                DisplayOrder = b.DisplayOrder,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                CreatedAt = b.CreatedAt
            });

            return (total, data);
        }

        public async Task<(int total, IEnumerable<SiteBannerDto> data)> GetActivePagedAsync(int page = 1, int pageSize = 10)
        {
            var (banners, total) = await _siteBannerRepository.GetActivePagedAsync(page, pageSize);

            var data = banners.Select(b => new SiteBannerDto
            {
                Id = b.Id,
                BannerTitle = b.BannerTitle,
                BannerImageUrl = b.BannerImageUrl,
                BannerUrl = b.BannerUrl,
                IsActive = b.IsActive,
                DisplayOrder = b.DisplayOrder,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                CreatedAt = b.CreatedAt
            });

            return (total, data);
        }

        public async Task<SiteBannerDto?> GetByIdAsync(Guid id)
        {
            var banner = await _siteBannerRepository.GetByIdAsync(id);
            
            if (banner == null)
                return null;

            return new SiteBannerDto
            {
                Id = banner.Id,
                BannerTitle = banner.BannerTitle,
                BannerImageUrl = banner.BannerImageUrl,
                BannerUrl = banner.BannerUrl,
                IsActive = banner.IsActive,
                DisplayOrder = banner.DisplayOrder,
                StartDate = banner.StartDate,
                EndDate = banner.EndDate,
                CreatedAt = banner.CreatedAt
            };
        }

        public async Task<IEnumerable<SiteBannerDto>> GetActiveBannersAsync(int? limit = null)
        {
            var banners = await _siteBannerRepository.GetActiveBannersAsync(limit);

            return banners.Select(b => new SiteBannerDto
            {
                Id = b.Id,
                BannerTitle = b.BannerTitle,
                BannerImageUrl = b.BannerImageUrl,
                BannerUrl = b.BannerUrl,
                IsActive = b.IsActive,
                DisplayOrder = b.DisplayOrder,
                CreatedAt = b.CreatedAt
            });
        }

        public async Task<SiteBannerDto> CreateAsync(SiteBannerCreateDto createDto)
        {
            // Validate using DtoValidatorService
            await _validator.ValidateSiteBannerCreateAsync(createDto);

            var banner = new SiteBanner
            {
                Id = Guid.NewGuid(),
                BannerTitle = createDto.BannerTitle,
                BannerImageUrl = createDto.BannerImageUrl,
                BannerUrl = createDto.BannerUrl,
                IsActive = createDto.IsActive,
                DisplayOrder = createDto.DisplayOrder,
                StartDate = createDto.StartDate,
                EndDate = createDto.EndDate,
                CreatedAt = DateTime.UtcNow
            };

            await _siteBannerRepository.CreateAsync(banner);

            return await GetByIdAsync(banner.Id) ?? throw new MedixException("Failed to retrieve created banner");
        }

        public async Task<SiteBannerDto> UpdateAsync(Guid id, SiteBannerUpdateDto updateDto)
        {
            var banner = await _siteBannerRepository.GetByIdAsync(id);
            if (banner == null)
            {
                throw new NotFoundException("Banner not found");
            }

            // Validate using DtoValidatorService
            await _validator.ValidateSiteBannerUpdateAsync(id, updateDto);

            banner.BannerTitle = updateDto.BannerTitle;
            // Only update the image URL if a new one is provided.
            if (!string.IsNullOrEmpty(updateDto.BannerImageUrl))
            {
                banner.BannerImageUrl = updateDto.BannerImageUrl;
            }
            banner.BannerUrl = updateDto.BannerUrl;
            banner.IsActive = updateDto.IsActive;
            banner.DisplayOrder = updateDto.DisplayOrder;
            banner.StartDate = updateDto.StartDate;
            banner.EndDate = updateDto.EndDate;

            await _siteBannerRepository.UpdateAsync(banner);

            return await GetByIdAsync(id) ?? throw new MedixException("Failed to retrieve updated banner");
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var deleted = await _siteBannerRepository.DeleteAsync(id);
            if (!deleted)
            {
                throw new NotFoundException("Banner not found");
            }

            return true;
        }

        public async Task UpdateDisplayOrderAsync(Guid id, int displayOrder)
        {
            var banner = await _siteBannerRepository.GetByIdAsync(id);
            if (banner == null)
            {
                throw new NotFoundException("Banner not found");
            }

            await _siteBannerRepository.UpdateDisplayOrderAsync(id, displayOrder);
        }

        public async Task ToggleActiveStatusAsync(Guid id, bool isActive)
        {
            var banner = await _siteBannerRepository.GetByIdAsync(id);
            if (banner == null)
            {
                throw new NotFoundException("Banner not found");
            }

            await _siteBannerRepository.ToggleActiveStatusAsync(id, isActive);
        }

        public async Task<List<SiteBanner>> GetHomePageBanners()
        {
            var banners = await _siteBannerRepository.GetRunningBannersAsync(); // Lấy các banner đang hoạt động
            return banners.OrderBy(b => b.DisplayOrder) // Sắp xếp theo thứ tự hiển thị tăng dần
                          .ThenByDescending(b => b.CreatedAt) // Nếu trùng, sắp xếp theo ngày tạo giảm dần
                          .ToList(); // Lấy tất cả banner đang hoạt động
        }
        public async Task<(int total, IEnumerable<SiteBannerDto> data)> SearchByNameAsync(string name, int page = 1, int pageSize = 10)
        {
            var (banners, total) = await _siteBannerRepository.SearchByNameAsync(name, page, pageSize);

            var data = banners.Select(b => new SiteBannerDto
            {
                Id = b.Id,
                BannerTitle = b.BannerTitle,
                BannerImageUrl = b.BannerImageUrl,
                BannerUrl = b.BannerUrl,
                IsActive = b.IsActive,
                DisplayOrder = b.DisplayOrder,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                CreatedAt = b.CreatedAt
            });

            return (total, data);
        }
    }
}
