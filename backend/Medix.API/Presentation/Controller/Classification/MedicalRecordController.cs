using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.UserManagement;
using Medix.API.Models.DTOs.MedicalRecordDTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Medix.API.Presentation.Controllers.Classification
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicalRecordController : ControllerBase
    {
        private readonly IMedicalRecordService _service;
        private readonly IPatientService _patientService;
        private readonly IMedicalRecordService _medicalRecordService;
        private ILogger<MedicalRecordController> _logger;

        public MedicalRecordController(
            IMedicalRecordService service,
            IPatientService patientService,
            IMedicalRecordService medicalRecordService,
            ILogger<MedicalRecordController> logger)
        {
            _service = service;
            _patientService = patientService;
            _medicalRecordService = medicalRecordService;
            _logger = logger;
        }



        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointment(Guid appointmentId)
        {
            var record = await _service.GetByAppointmentIdAsync(appointmentId);

            if (record == null)
            {
                try
                {
                    var newRecordDto = new CreateOrUpdateMedicalRecordDto
                    {
                        AppointmentId = appointmentId,
                        ChiefComplaint = "",
                        PhysicalExamination = "",
                        Diagnosis = "", 
                        AssessmentNotes = "",
                        TreatmentPlan = "",
                        FollowUpInstructions = "",
                        DoctorNotes = "",
                        Prescriptions = new List<CreatePrescriptionDto>()
                    };

                    var createdRecord = await _service.CreateAsync(newRecordDto);

                    return Ok(createdRecord);
                }
                catch (Exception ex)
                {
                    return BadRequest(new { message = $"Không thể tạo hồ sơ mới: {ex.Message}" });
                }
            }

            return Ok(record);
        }



        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrUpdateMedicalRecordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(
                nameof(GetByAppointment),
                new { appointmentId = created.AppointmentId },
                created
            );
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] CreateOrUpdateMedicalRecordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _service.UpdateAsync(dto);
            return Ok(updated);
        }

        [HttpGet("patient")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GetPatientsMedicalRecords([FromQuery] MedicalRecordQuery query)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (userIdClaim == null)
                {
                    return Unauthorized(new { Message = "User ID not found in token" });
                }

                var userId = Guid.Parse(userIdClaim.Value);

                var recordList = await _medicalRecordService.GetRecordsByUserIdAsync(userId, query);
                var list = recordList.Select(mr => new
                {
                    mr.Id,
                    Date = mr.Appointment.AppointmentEndTime.ToString("dd/MM/yyyy"),
                    Doctor = mr.Appointment.Doctor.User.FullName,
                    mr.ChiefComplaint,
                    mr.Diagnosis,
                    mr.TreatmentPlan,
                    Attatchments = mr.MedicalRecordAttachments
                        .Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileUrl,
                        }).ToList(),
                }).ToList();

                return Ok(list);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get medical records of patient");
                return StatusCode(500);
            }

        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GetDetailsById([FromRoute] Guid id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                var userId = Guid.Parse(userIdClaim.Value);
                var record = await _medicalRecordService.GetRecordDetailsByIdAsync(id);
                if (record == null)
                {
                    return NotFound();
                }
                if (record.Appointment.Patient.UserId != userId)
                {
                    return Forbid();
                }

                return Ok(new
                {
                    record.Id,
                    Date = record.Appointment.AppointmentEndTime.ToString("dd/MM/yyyy"),
                    Doctor = record.Appointment.Doctor.User.FullName,
                    record.ChiefComplaint,
                    record.Diagnosis,
                    record.TreatmentPlan,
                    Prescription = record.Prescriptions
                        .Select(p => new
                        {
                            p.Id,
                            p.Medication?.MedicationName,
                            p.Instructions,
                        }).ToList(),
                    Attatchments = record.MedicalRecordAttachments
                        .Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileUrl,
                        }).ToList(),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get medical records with id = {id}");
                return StatusCode(500);
            }
        }
    }
}
