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
        private readonly ILogger<HomeController> _logger;

        public HomeController(ISiteBannerService siteBannerService, IDoctorService doctorService,
            IArticleService articleService, ILogger<HomeController> logger)
        {
            _siteBannerService = siteBannerService;
            _doctorService = doctorService;
            _articleService = articleService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetHomeMetadata()
        {
            try
            {
                var banners = await _siteBannerService.GetHomePageBanners();
                var bannerUrls = banners.Select(b => b.BannerImageUrl).ToList();

                var doctors = await _doctorService.GetHomePageDoctorsAsync();
                var displayedDoctors = doctors.Select(d => new
                {
                    d.Id,
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
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "An error occurred while fetching home page metadata.");
                throw;
            }
        }
    }
}