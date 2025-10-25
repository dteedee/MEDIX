namespace Medix.API.Models.DTOs.Doctor
{
    public class DoctorProfileReviewRequest
    {
        public bool IsApproved { get; set; }
        public string? Education {  get; set; }
        public string? RejectReason { get; set; }
    }
}
