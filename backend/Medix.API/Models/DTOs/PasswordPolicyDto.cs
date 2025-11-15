namespace Medix.API.Models.DTOs
{
    public class PasswordPolicyDto
    {
        public int MinLength { get; set; }
        public bool RequireUppercase { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireDigit { get; set; }
        public bool RequireSpecial { get; set; }
        public int? MaxLength { get; set; }
    }
}
