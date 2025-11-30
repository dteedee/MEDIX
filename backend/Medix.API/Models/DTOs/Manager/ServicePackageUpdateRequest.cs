using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs.Manager;

public class ServicePackageUpdateRequest
{
    [Required]
    [MaxLength(225)]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Monthly fee must be greater than 0.")]
    public decimal MonthlyFee { get; set; }
}

