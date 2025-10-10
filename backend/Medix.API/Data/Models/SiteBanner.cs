using System;
using System.Collections.Generic;

namespace Medix.API.Data.Models;

public partial class SiteBanner
{
    public Guid Id { get; set; }

    public string BannerTitle { get; set; } = null!;

    public string BannerImageUrl { get; set; } = null!;

    public string? BannerUrl { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
}
