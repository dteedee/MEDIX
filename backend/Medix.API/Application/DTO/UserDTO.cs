namespace Medix.API.Application.DTO
{
    public class UserDTO
    {
        public Guid Id { get; set; }
        public Guid TypeUserID { get; set; } // lưu trữ ID loại người dùng (bác sĩ, bệnh nhân, quản trị viên, v.v.)

        public string NormalizedUserName { get; set; }
       
        public string NormalizedEmail { get; set; }
        public string? PhoneNumber { get; set; }
    
        public string FullName { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? GenderCode { get; set; }
        public string? IdentificationNumber { get; set; }
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsActive { get; set; }
        public bool IsProfileCompleted { get; set; }
        public DateTime? LockoutEnd { get; set; }
        public bool LockoutEnabled { get; set; }
        public int AccessFailedCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

      
    }
}
