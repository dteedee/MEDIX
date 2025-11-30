using System.Linq;
using Medix.API.Business.Interfaces.Classification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Medix.API.Models.DTOs.Manager;

namespace Medix.API.Presentation.Controller.Classification;

[Route("api/[controller]")]
[ApiController]
public class ServicePackageController : ControllerBase
{
    private readonly IServicePackageService _servicePackageService;

    public ServicePackageController(IServicePackageService servicePackageService)
    {
        _servicePackageService = servicePackageService;
    }

    [HttpGet("top")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTopServicePackages([FromQuery] int limit = 10)
    {
        var packages = await _servicePackageService.GetTopAsync(limit);

        if (!packages.Any())
        {
            return NoContent();
        }

        return Ok(packages);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetServicePackageDetail(Guid id)
    {
        var package = await _servicePackageService.GetByIdAsync(id);

        if (package == null)
        {
            return NotFound();
        }

        return Ok(package);
    }

    [HttpPut("{id:guid}/basic-info")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateBasicInfo(Guid id, [FromBody] ServicePackageUpdateRequest request)
    {
        if (request == null)
        {
            return BadRequest("Payload is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Tên gói không được bỏ trống.");
        }

        if (request.MonthlyFee <= 0)
        {
            return BadRequest("Phí hàng tháng phải lớn hơn 0.");
        }

        var result = await _servicePackageService.UpdateBasicInfoAsync(id, request);
        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }
}

