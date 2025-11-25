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
        private readonly IAppointmentRepository appointmentService;
        private readonly IMedicalRecordRepository medicalRecordRepository;


        public PatientHealthReminderService(IPatientHealthReminderRepository patientHealthReminderRepository, IAppointmentRepository appointmentService, IMedicalRecordRepository medicalRecordRepository)
        {
            this.patientHealthReminderRepository = patientHealthReminderRepository;
            this.appointmentService = appointmentService;
            this.medicalRecordRepository = medicalRecordRepository;
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
            var x = await appointmentService.GetByIdAsync((Guid)healthReminder.RelatedAppointmentId);
            if (x.StatusCode != "Completed") {
                return; }

            await patientHealthReminderRepository.SendHealthReminderAsync(healthReminder);
        }

        public Task<PatientHealthReminder> CreateHealthReminder(PatientHealthReminder healthReminder)
        {
            throw new NotImplementedException();
        }

        public async Task<PatientHealthReminder> sendHealthReminderPrescription(List<Prescription> prescriptions)
        {
            if (prescriptions == null || !prescriptions.Any())
                throw new ArgumentException("Danh sách prescription rỗng");

            PatientHealthReminder? firstScheduled = null;
            var now = DateTime.Now;

            foreach (var prescription in prescriptions)
            {
                // Try to parse duration (fall back to 0 => skip)
                int durationDays = 0;
                try
                {
                    durationDays = ParseDurationToDays(prescription.Duration);
                }
                catch
                {
                    durationDays = 0;
                }

                if (durationDays <= 0)
                    continue; // skip invalid/unknown duration

                // Start the first reminder the day after prescription.CreatedAt at 08:00
                var startDate = prescription.CreatedAt.AddDays(1).Date;
                var endDate = startDate.AddDays(durationDays - 1).Date; // inclusive

                var app = appointmentService.GetByIdAsync(prescription.MedicalRecord.AppointmentId);
                var patientId = app.Result.PatientId;



                var medicationName = string.IsNullOrWhiteSpace(prescription.MedicationName) ? "Thuốc" : prescription.MedicationName;
                var dosage = !string.IsNullOrWhiteSpace(prescription.Dosage) ? prescription.Dosage : "theo chỉ định";
                var frequency = !string.IsNullOrWhiteSpace(prescription.Frequency) ? prescription.Frequency : "theo toa";

                for (var current = startDate; current <= endDate; current = current.AddDays(1))
                {
                    var scheduledTime = current.AddHours(8); // 08:00 each day

                    var description = $"🔔 Nhắc nhở uống thuốc\n\n" +
                                      $"- Thuốc: {medicationName}\n" +
                                      $"- Liều lượng: {dosage}\n" +
                                      $"- Tần suất: {frequency}\n" +
                                      $"- Ngày: {current:dd/MM/yyyy}\n\n" +
                                      "Vui lòng uống thuốc đúng giờ theo chỉ định của bác sĩ.";

                    var healthReminder = new PatientHealthReminder
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Nhắc uống thuốc: {medicationName}",
                        Description = description,
                        PatientId = patientId,
                        ReminderTypeCode = "Medication",
                        ScheduledDate = scheduledTime,
                        IsRecurring = false,
                        IsCompleted = false,
                        RelatedAppointmentId = null,
                        CreatedAt = now
                    };

                    // Schedule job: if scheduledTime is in the future -> schedule; otherwise enqueue immediately.
                    if (scheduledTime > now)
                    {
                        BackgroundJob.Schedule<IPatientHealthReminderService>(
                            service => service.ExecuteSendReminderAsync(healthReminder),
                            scheduledTime);
                    }
                    else
                    {
                        BackgroundJob.Enqueue<IPatientHealthReminderService>(s => s.ExecuteSendReminderAsync(healthReminder));
                    }

                    firstScheduled ??= healthReminder;
                }
            }

            if (firstScheduled == null)
                throw new ArgumentException("Không có toa thuốc hợp lệ để lên lịch nhắc");

            return firstScheduled;
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