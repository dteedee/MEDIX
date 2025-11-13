using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Interfaces.Classification
{
    public interface IPatientHealthReminderService
    {
        /// <summary>
        /// Gửi nhắc nhở sức khỏe cho một cuộc hẹn khám bệnh.
        /// </summary>
        /// <param name="createAppointment">Thông tin cuộc hẹn.</param>
        /// <returns>Đối tượng PatientHealthReminder đã được lên lịch.</returns>
        Task<PatientHealthReminder> SendHealthReminderAppointmentAsync(CreateAppointmentDto createAppointment);

        /// <summary>
        /// Thực thi việc gửi nhắc nhở sức khỏe (thường được gọi bởi Hangfire).
        /// </summary>
        /// <param name="healthReminder">Thông tin nhắc nhở cần gửi.</param>
        /// <returns>Một Task đại diện cho thao tác không đồng bộ.</returns>
        Task ExecuteSendReminderAsync(PatientHealthReminder healthReminder);

        /// <summary>
        /// Gửi nhắc nhở uống thuốc dựa trên thông tin toa thuốc.
        /// </summary>
        /// <param name="prescription">Thông tin toa thuốc.</param>
        /// <returns>Một PatientHealthReminder mẫu (vì nhiều job được lên lịch).</returns>
        Task<PatientHealthReminder> sendHealthReminderPrescription(Prescription prescription);


        /// <summary>
        /// Tạo một nhắc nhở sức khỏe mới.
        /// </summary>
        /// <param name="healthReminder">Đối tượng nhắc nhở cần tạo.</param>
        /// <returns>Đối tượng PatientHealthReminder đã được tạo.</returns>
        Task<PatientHealthReminder> CreateHealthReminder(PatientHealthReminder healthReminder);
        Task<List<PatientHealthReminderDto>> getReminderswithPatientID(Guid patientId, string Code);

        Task<PatientHealthReminderDto> updateReminder(PatientHealthReminderDto reminder);

    }
}