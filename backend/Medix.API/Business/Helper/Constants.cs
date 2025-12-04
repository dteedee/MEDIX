using Medix.API.Models.DTOs.AIChat;

namespace Medix.API.Business.Helper
{
    public class Constants
    {
        public const string DefaultAvatarUrl = "https://res.cloudinary.com/dvyswwdcz/image/upload/v1760970670/default_avatar_cnnmzg.jpg";
        public const string CompletedAppointmentStatusCode = "Completed";
        public const double DoctorSalaryShare = 0.7;
        
        public static string[] SuccessfulAppointmentStatusCode = ["Completed", "Confirmed"];
    }

    public class RecommendedMedicineList
    {
        public List<MedicineDto> List { get; set; } = new List<MedicineDto>();
    }

    public class RecommenedDoctorIdList
    {
        public List<string> IdList { get; set; } = new List<string>();
    }
}
