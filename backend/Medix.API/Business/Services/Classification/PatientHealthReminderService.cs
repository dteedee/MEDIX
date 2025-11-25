using Hangfire;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.ApointmentDTO;
using Medix.API.Models.Entities;
using System.Text.RegularExpressions;

namespace Medix.API.Business.Services.Classification
{
    public class PatientHealthReminderService : IPatientHealthReminderService
    {

        private readonly IPatientHealthReminderRepository patientHealthReminderRepository;
        private readonly IAppointmentService appointmentService;


        public PatientHealthReminderService(IPatientHealthReminderRepository patientHealthReminderRepository, IAppointmentService appointmentService)
        {
            this.patientHealthReminderRepository = patientHealthReminderRepository;
            this.appointmentService = appointmentService;
        }

        public async Task<List<PatientHealthReminder>> SendHealthReminderAppointmentAsync(AppointmentDto createAppointment)
        {
            var appointmentTime = createAppointment.AppointmentStartTime ;
       
            // Nếu appointmentTime không hợp lệ thì trả về danh sách rỗng
            if (appointmentTime == DateTime.MinValue)
                return new List<PatientHealthReminder>();

            var reminders = new List<PatientHealthReminder>();

            // 1) Nhắc 1 ngày trước vào 08:00 sáng của ngày trước đó
            var dayBeforeAt8 = appointmentTime.Date.AddDays(-1).AddHours(8);
            reminders.Add(new PatientHealthReminder
            {
                Title = "Nhắc nhở lịch khám - 1 ngày trước",
                Description = $"Bạn có một cuộc hẹn với bác sĩ vào ngày {appointmentTime:dd/MM/yyyy} lúc {appointmentTime:HH:mm}. Vui lòng đến đúng giờ.",
                PatientId = (Guid)createAppointment.PatientID,
                RelatedAppointmentId = createAppointment.Id,
                ReminderTypeCode = "FollowUp",
                ScheduledDate = dayBeforeAt8
            });

            // 2) Nhắc 4 giờ trước start time
            var fourHoursBefore = appointmentTime.AddHours(-4);
            reminders.Add(new PatientHealthReminder
            {
                Title = "Nhắc nhở lịch khám - 4 giờ trước",
                Description = $"Bạn có một cuộc hẹn với bác sĩ vào ngày {appointmentTime:dd/MM/yyyy} lúc {appointmentTime:HH:mm}.",
                PatientId = (Guid)createAppointment.PatientID,
                RelatedAppointmentId = createAppointment.Id,
                ReminderTypeCode = "FollowUp",
                ScheduledDate = fourHoursBefore
            });

            // 3) Nhắc 2 giờ trước start time
            var twoHoursBefore = appointmentTime.AddHours(-2);
            reminders.Add(new PatientHealthReminder
            {
                Title = "Nhắc nhở lịch khám - 2 giờ trước",
                Description = $"Bạn có một cuộc hẹn với bác sĩ vào ngày {appointmentTime:dd/MM/yyyy} lúc {appointmentTime:HH:mm}.",
                PatientId = (Guid)createAppointment.PatientID,
                RelatedAppointmentId = createAppointment.Id,
                ReminderTypeCode = "FollowUp",
                ScheduledDate = twoHoursBefore
            });

            // Đặt lịch cho những reminder có thời gian > now
            foreach (var reminder in reminders)
            {
                if (reminder.ScheduledDate > DateTime.Now)
                {
                  
                    BackgroundJob.Schedule<IPatientHealthReminderService>(
                        service => service.ExecuteSendReminderAsync(reminder),
                        reminder.ScheduledDate
                    );
                }
                else
                {
                   
                    BackgroundJob.Enqueue<IPatientHealthReminderService>(s => s.ExecuteSendReminderAsync(reminder));
                }
            }

            return reminders;
        }





        public async Task ExecuteSendReminderAsync(PatientHealthReminder healthReminder)
        {
            var x = appointmentService.GetByIdAsync(healthReminder.Id).Result;
            if (x.StatusCode != "Completed") { return; }

            await patientHealthReminderRepository.SendHealthReminderAsync(healthReminder);
        }

        public Task<PatientHealthReminder> CreateHealthReminder(PatientHealthReminder healthReminder)
        {
            throw new NotImplementedException();
        }

        public async Task<PatientHealthReminder> sendHealthReminderPrescription(Prescription prescription)
        {
            // Parse duration từ string sang số ngày
            int durationDays = ParseDurationToDays(prescription.Duration);

            if (durationDays <= 0)
            {
                throw new ArgumentException("Duration không hợp lệ hoặc không thể parse");
            }

            var startDate = prescription.CreatedAt.AddDays(1).Date; // Bắt đầu từ ngày hôm sau, lúc 00:00
            var endDate = prescription.CreatedAt.AddDays(durationDays).Date;

            // Lấy PatientId từ MedicalRecord -> Appointment -> Patient
            var patientId = prescription.MedicalRecord?.Appointment?.PatientId
                ?? throw new ArgumentException("Không tìm thấy thông tin bệnh nhân");

            var medicationName = prescription.MedicationName;
            var dosage = prescription.Dosage ?? "theo chỉ định";
            var frequency = prescription.Frequency ?? "theo toa";

            // Lên lịch job cho từng ngày
            for (DateTime currentDate = startDate; currentDate <= endDate; currentDate = currentDate.AddDays(1))
            {
                // Đặt giờ nhắc nhở vào 8:00 sáng mỗi ngày
                var scheduledTime = currentDate.AddHours(8);

                var description = $"🔔 Nhắc nhở uống thuốc\n\n" +
                                $"- Thuốc: {medicationName}\n" +
                                $"- Liều lượng: {dosage}\n" +
                                $"- Tần suất: {frequency}\n" +
                                $"- Ngày: {currentDate:dd/MM/yyyy}\n\n" +
                                $"Vui lòng uống thuốc đúng giờ theo chỉ định của bác sĩ.";

                var healthReminder = new PatientHealthReminder
                {
                    Id = Guid.NewGuid(),
                    Title = $"Nhắc uống thuốc: {medicationName}",
                    Description = description,
                    PatientId = patientId,
                    ReminderTypeCode = "Medication",
                    ScheduledDate = scheduledTime,
                    IsRecurring = false,
                    IsCompleted = true,
                    CreatedAt = DateTime.Now
                };

                // Chỉ lên lịch nếu thời gian chưa qua
                if (scheduledTime > DateTime.Now)
                {
                    BackgroundJob.Schedule<IPatientHealthReminderService>(
                        service => service.ExecuteSendReminderAsync(healthReminder)
                        , scheduledTime);
                }
            }

            // Trả về reminder đầu tiên làm sample
            return new PatientHealthReminder
            {
                Title = $"Nhắc uống thuốc: {medicationName}",
                Description = $"Đã lên lịch {durationDays} ngày nhắc nhở uống thuốc",
                PatientId = patientId,
                ReminderTypeCode = "Medication",
                ScheduledDate = startDate.AddHours(8),
                CreatedAt = DateTime.Now
            };
        }

        private int ParseDurationToDays(string? duration)
        {
            if (string.IsNullOrWhiteSpace(duration))
                return 0;

            duration = duration.ToLower().Trim();

            // Pattern: "số đơn_vị" (VD: "7 ngày", "2 tuần")
            var match = Regex.Match(duration, @"(\d+)\s*(ngày|ngay|day|days|tuần|tuan|week|weeks|tháng|thang|month|months)");

            if (match.Success)
            {
                int number = int.Parse(match.Groups[1].Value);
                string unit = match.Groups[2].Value;

                return unit switch
                {
                    "ngày" or "ngay" or "day" or "days" => number,
                    "tuần" or "tuan" or "week" or "weeks" => number * 7,
                    "tháng" or "thang" or "month" or "months" => number * 30,
                    _ => 0
                };
            }

            // Nếu chỉ là số thuần (giả sử là ngày)
            if (int.TryParse(duration, out int days))
            {
                return days;
            }

            return 0;
        }

        public async Task<List<PatientHealthReminderDto>> getReminderswithPatientID(Guid patientId, string Code)
        {
            var reminders = await patientHealthReminderRepository.getReminderswithPatientID(patientId, Code);


            var reminderDtos = reminders.Where(x=>x.ReminderTypeCode== Code).Select(r => new PatientHealthReminderDto
            {
                Id = r.Id,
                PatientId = r.PatientId,
                ReminderTypeCode = r.ReminderTypeCode,
                Title = r.Title,
                Description = r.Description,
                ScheduledDate = r.ScheduledDate,
                IsRecurring = r.IsRecurring,
                RecurrencePattern = r.RecurrencePattern,
                IsCompleted = r.IsCompleted,
                CompletedAt = r.CompletedAt,
                RelatedAppointmentId = r.RelatedAppointmentId,
                CreatedAt = r.CreatedAt
            }).ToList();
            return reminderDtos;
        }

        public async Task<PatientHealthReminderDto> updateReminder(PatientHealthReminderDto reminderDto)
        {
            // Validate input
            if (reminderDto.Id == null || reminderDto.Id == Guid.Empty)
            {
                throw new ArgumentException("Reminder ID là bắt buộc");
            }

            // Map DTO sang Entity
            var reminder = new PatientHealthReminder
            {
                Id = reminderDto.Id.Value,
                PatientId = reminderDto.PatientId ?? throw new ArgumentException("PatientId là bắt buộc"),
                ReminderTypeCode = reminderDto.ReminderTypeCode ?? throw new ArgumentException("ReminderTypeCode là bắt buộc"),
                Title = reminderDto.Title ?? throw new ArgumentException("Title là bắt buộc"),
                Description = reminderDto.Description,
                ScheduledDate = reminderDto.ScheduledDate ?? throw new ArgumentException("ScheduledDate là bắt buộc"),
                IsRecurring = reminderDto.IsRecurring ?? false,
                RecurrencePattern = reminderDto.RecurrencePattern,
                IsCompleted = reminderDto.IsCompleted ?? false,
                CompletedAt = reminderDto.CompletedAt,
                RelatedAppointmentId = reminderDto.RelatedAppointmentId,
                CreatedAt = reminderDto.CreatedAt ?? DateTime.Now
            };

            // Cập nhật thông qua repository
            await patientHealthReminderRepository.updateReminder(reminder);

            // Trả về DTO đã cập nhật
            return new PatientHealthReminderDto
            {
                Id = reminder.Id,
                PatientId = reminder.PatientId,
                ReminderTypeCode = reminder.ReminderTypeCode,
                Title = reminder.Title,
                Description = reminder.Description,
                ScheduledDate = reminder.ScheduledDate,
                IsRecurring = reminder.IsRecurring,
                RecurrencePattern = reminder.RecurrencePattern,
                IsCompleted = reminder.IsCompleted,
                CompletedAt = reminder.CompletedAt,
                RelatedAppointmentId = reminder.RelatedAppointmentId,
                CreatedAt = reminder.CreatedAt
            };
        }
    }
}