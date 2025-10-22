namespace Medix.API.Models.DTOs
{


    public class PaginationParams
    {
        // THAY ĐỔI Ở ĐÂY: Giới hạn tối đa là 3
        private const int MaxPageSize = 3;

        // THAY ĐỔI Ở ĐÂY: Mặc định là 3
        private int _pageSize = 3;

        public int PageNumber { get; set; } = 1; // Mặc định vẫn là trang 1

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }
    }

    // Models/DTO/PaginatedListDto.cs
    // DTO chung để trả về dữ liệu đã phân trang
    public class PaginatedListDto<T> where T : class
    {
        public List<T> Items { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }

        public PaginatedListDto(List<T> items, int pageNumber, int pageSize, int totalCount)
        {
            Items = items;
            PageNumber = pageNumber;
            PageSize = pageSize;
            TotalCount = totalCount;
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        }
    }

    public class DoctorBookinDto
    {
        public Guid userId { get; set; }
        public Guid DoctorId { get; set; }
        public string DoctorName { get; set; }
        public string specialization { get; set; }
        public string? Education { get; set; } // Ví dụ: "MD", "PhD", "BS", "MS"
        public string? Experience { get; set; } // Ví dụ: "MD", "PhD", "BS", "MS"
        public decimal? price { get; set; }
        public string? bio { get; set; }
        public decimal? rating { get; set; }

        // Models/DTO/ServiceTierWithDoctorsDto.cs
        // DTO cho mỗi phân khúc, chứa danh sách bác sĩ thuộc phân khúc đó
        public class ServiceTierWithPaginatedDoctorsDto
        {
            public Guid Id { get; set; }
            public string Name { get; set; }
            public string? Description { get; set; }

            // Thay vì List<DoctorDto>, chúng ta dùng PaginatedListDto
            public PaginatedListDto<DoctorBookinDto> Doctors { get; set; }
        }


    }
}
