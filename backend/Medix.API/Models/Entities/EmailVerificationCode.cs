using System;
using System.ComponentModel.DataAnnotations;

namespace Medix.API.Models.Entities
{
    public class EmailVerificationCode
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Code { get; set; }
        public DateTime ExpirationTime { get; set; }
        public bool IsUsed { get; set; } = false;
    }
}
