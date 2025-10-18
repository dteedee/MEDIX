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
        }
    }
}
