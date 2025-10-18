using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.DTOs
{
    public class UserUpdateDto
    {
        [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters.")]
        public string? FullName { get; set; }

        [Phone(ErrorMessage = "Phone number is not valid.")]
        [StringLength(15, ErrorMessage = "Phone number cannot exceed 15 digits.")]
        public string? PhoneNumber { get; set; }

        [RegularExpression("^(male|female|other)$",
            ErrorMessage = "Gender code must be one of: male, female, other.")]
        public string? GenderCode { get; set; }

        [StringLength(13, ErrorMessage = "Identification number cannot exceed 13 characters.")]
        [RegularExpression("^[0-9A-Za-z]+$",
            ErrorMessage = "Identification number can only contain letters and numbers.")]
        public string? IdentificationNumber { get; set; }

        [MinLength(1, ErrorMessage = "At least one role code must be provided.")]
        public List<string>? RoleCodes { get; set; }

        [StringLength(255, ErrorMessage = "Address cannot exceed 255 characters.")]
        public string? Address { get; set; }

        public bool? EmailConfirmed { get; set; }

        public DateOnly? DateOfBirth { get; set; }
    }
}
