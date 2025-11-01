namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorReviewRequest
    {
        public bool IsApproved { get; set; }
        public string? Education {  get; set; }
        public string? RejectReason { get; set; }
    }
}
