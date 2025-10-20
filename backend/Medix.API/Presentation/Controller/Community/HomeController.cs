using Medix.API.Business.Interfaces.Classification;
using Microsoft.AspNetCore.Mvc;

namespace Medix.API.Presentation.Controller.Community
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly ISiteBannerService _siteBannerService;
        private readonly IDoctorService _doctorService;
        private readonly IArticleService _articleService;

        public HomeController(ISiteBannerService siteBannerService, IDoctorService doctorService, IArticleService articleService)
        {
            _siteBannerService = siteBannerService;
            _doctorService = doctorService;
            _articleService = articleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetHomeMetadata()
        {
            try
            {
                // TEMPORARY: Return mock data to avoid database errors
                var mockData = new
                {
                    bannerUrls = new[] { "/images/banner1.jpg", "/images/banner2.jpg" },
                    displayedDoctors = new[]
                    {
                        new
                        {
                            AvatarUrl = "/images/doctor1.jpg",
                            FullName = "Dr. Nguyễn Văn A",
                            UserName = "dr.nguyenvana",
                            SpecializationName = "Tim mạch",
                            YearsOfExperience = 10,
                            AverageRating = 4.8
                        },
                        new
                        {
                            AvatarUrl = "/images/doctor2.jpg",
                            FullName = "Dr. Trần Thị B",
                            UserName = "dr.tranthib",
                            SpecializationName = "Nhi khoa",
                            YearsOfExperience = 8,
                            AverageRating = 4.9
                        }
                    },
                    articles = new[]
                    {
                        new
                        {
                            Title = "Cách phòng chống bệnh tim mạch",
                            Summary = "Những cách đơn giản để bảo vệ sức khỏe tim mạch",
                            ThumbnailUrl = "/images/article1.jpg",
                            PublishedAt = "20/10/2025"
                        },
                        new
                        {
                            Title = "Dinh dưỡng cho trẻ em",
                            Summary = "Chế độ dinh dưỡng hợp lý cho sự phát triển của trẻ",
                            ThumbnailUrl = "/images/article2.jpg",
                            PublishedAt = "19/10/2025"
                        }
                    }
                };

                Console.WriteLine("=== HOME API CALLED - RETURNING MOCK DATA ===");
                return Ok(mockData);

                // TODO: Uncomment when database is ready
                /*
                var banners = await _siteBannerService.GetHomePageBanners();
                var bannerUrls = banners.Select(b => b.BannerImageUrl).ToList();

                var doctors = await _doctorService.GetHomePageDoctorsAsync();
                var displayedDoctors = doctors.Select(d => new
                {
                    d.User.AvatarUrl,
                    d.User.FullName,
                    d.User.UserName,
                    SpecializationName = d.Specialization.Name,
                    d.YearsOfExperience,
                    d.AverageRating,
                }).ToList();

                var homeArticles = await _articleService.GetHomePageArticles();
                var articles = homeArticles.Select(a => new
                {
                    a.Title,
                    a.Summary,
                    a.ThumbnailUrl,
                    PublishedAt = a.PublishedAt?.ToString("dd/MM/yyyy")
                }).Take(3).ToList();

                return Ok(new { bannerUrls, displayedDoctors, articles });
                */
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetHomeMetadata: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                // Return empty data instead of throwing error
                return Ok(new 
                { 
                    bannerUrls = new string[0], 
                    displayedDoctors = new object[0], 
                    articles = new object[0] 
                });
            }
        }
    }
}
