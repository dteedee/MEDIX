using Medix.API.Business.Helper;
using System.Text.Json.Serialization;

namespace Medix.API.Models.DTOs.Patient
{
    public class PaginationParams
    {
        private const int MaxPageSize = 4;
        private int _pageSize = 4;
        public int PageNumber { get; set; } = 1;
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
        }
    }

    public class DoctorQueryParameters : PaginationParams
    {
        public string? EducationCode { get; set; }
        public string? SpecializationCode { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
    }

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
        public string? specializationCode { get; set; }
        public string specialization { get; set; }
        public string? AvatarUrl { get; set; }
        public string? educationcode { get; set; }
        public string? Education { get; set; }
        public string? Experience { get; set; }
        public decimal? price { get; set; }
        public string? bio { get; set; }
        public decimal? rating { get; set; }

        public bool? IsAcceptingAppointments { get; set; }
        [JsonConverter(typeof(CustomDateTimeConverter))]
        public DateTime? startbandate;
        [JsonConverter(typeof(CustomDateTimeConverter))]
        public DateTime? endbandadate;
        public int? TotalDone { get; set; }

        public int TotalAppointments { get; set; }  


        public double SuccessPercentage
        {
            get
            {
               
                if (TotalAppointments == 0)
                {
                    return 0;
                }

              
                return (double)TotalDone / TotalAppointments * 100;
            }
        }
        public int TotalReviews { get; set; }



    }

    public class ServiceTierWithPaginatedDoctorsDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public PaginatedListDto<DoctorBookinDto> Doctors { get; set; }
    }
}