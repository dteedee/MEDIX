using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.Entities;

namespace Medix.API.Application.Util
{
    public class NoticeUtil
    {
        private readonly IUserRepository _userService;
        private readonly IDoctorRepository _doctorService;

        public NoticeUtil(IDoctorRepository doctorService, IUserRepository userService)
        {
            _doctorService = doctorService;
            _userService = userService;
        }

        public static string getNoticeBookingAppoinemnt(CreateAppointmentDto appointment, NoticeSetup notice)
        {
            if (notice.TemplateEmailBody == null)
            {
                return string.Empty;
            }

            return notice.TemplateEmailBody
                   .Replace("{{DOCTOR_NAME}}", appointment.DoctorName.ToString())
                   .Replace("{{APPOINTMENT_START_TIME}}", appointment.AppointmentStartTime?.ToString("dd/MM/yyyy") ?? string.Empty)
                   .Replace("{{TOTAL_AMOUNT}}", appointment.TotalAmount.ToString());
        }

    }
}
