using CloudinaryDotNet.Actions;
using Medix.API.Business.Helper;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class MedicalRecordRepository : IMedicalRecordRepository
    {
        private readonly MedixContext _context;

        public MedicalRecordRepository(MedixContext context)
        {
            _context = context;
        }

        public IQueryable<MedicalRecord> Query()
        {
            return _context.MedicalRecords.AsQueryable();
        }

        public async Task<MedicalRecord?> GetByPatientIdAsync(Guid patientId)
        {
            return await _context.MedicalRecords
                .Include(r => r.Prescriptions)
                .Include(r => r.Appointment)
                .ThenInclude(a => a.Patient)
                .FirstOrDefaultAsync(r =>
                    _context.Appointments
                        .Any(a => a.Id == r.AppointmentId && a.PatientId == patientId)
                );
        }

        public async Task<MedicalRecord?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            return await _context.MedicalRecords
        .Include(r => r.Prescriptions)
            .ThenInclude(p => p.Medication)
        .Include(r => r.Appointment)
            .ThenInclude(a => a.Patient)
                .ThenInclude(p => p.User)
        .Include(r => r.Appointment)
            .ThenInclude(a => a.Doctor)
                .ThenInclude(d => d.User)
        .FirstOrDefaultAsync(r => r.AppointmentId == appointmentId);

        }


        public async Task AddAsync(MedicalRecord record)
        {
            await _context.MedicalRecords.AddAsync(record);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(MedicalRecord record)
        {
            var existing = await _context.MedicalRecords
                .Include(r => r.Prescriptions)
                .FirstOrDefaultAsync(r => r.Id == record.Id);

            if (existing == null)
                throw new InvalidOperationException("Medical record not found.");

            _context.Entry(existing).CurrentValues.SetValues(record);

            _context.Prescriptions.RemoveRange(existing.Prescriptions);
            await _context.Prescriptions.AddRangeAsync(record.Prescriptions);

            await _context.SaveChangesAsync();
        }

        public async Task<List<MedicalRecord>> GetRecordsByUserIdAsync(Guid userId, MedicalRecordQuery? query = null)
        {
            var queryable = _context.MedicalRecords
                .Where(mr => mr.Appointment.Patient.UserId == userId && mr.Appointment.StatusCode == "Completed")
                .OrderByDescending(mr => mr.Appointment.AppointmentEndTime)
                .AsQueryable();
            if (!queryable.Any())
            {
                return [];
            }

            if (query != null) {
                if (query.DateFrom == null && query.DateTo == null) { }
                else if (query.DateTo == null)
                {
                    queryable = queryable.Where(mr => mr.Appointment.AppointmentEndTime >= query.DateFrom);
                }
                else
                {
                    query.DateTo = query.DateTo.Value.AddDays(1);
                    if (query.DateFrom == null)
                    {
                        queryable = queryable.Where(mr => mr.Appointment.AppointmentEndTime <= query.DateTo);
                    }
                    else
                    {
                        queryable = queryable.Where(mr =>
                            mr.Appointment.AppointmentEndTime <= query.DateTo
                            && mr.Appointment.AppointmentEndTime >= query.DateFrom);
                    }
                }

            }

            return await queryable
                .Include(mr => mr.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(mr => mr.MedicalRecordAttachments)
                .ToListAsync();
        }

        public async Task<MedicalRecord?> GetRecordDetailsByIdAsync(Guid id)
        {
            return await _context.MedicalRecords
                .Include(mr => mr.Appointment)
                    .ThenInclude(mr => mr.Patient)
                .Include(mr => mr.Appointment)
                    .ThenInclude(a => a.Doctor)
                        .ThenInclude(d => d.User)
                .Include(mr => mr.MedicalRecordAttachments)
                .Include(mr => mr.Prescriptions)
                    .ThenInclude(p => p.Medication)
                .FirstOrDefaultAsync(mr => mr.Id == id);
        }
        public async Task<List<MedicalRecord>> GetByPatientIdAllAsync(Guid patientId)
        {
            return await _context.MedicalRecords
                .Include(r => r.Prescriptions)
                .Include(r => r.Appointment)
                .ThenInclude(a => a.Doctor)
                .ThenInclude(d => d.User)
                .Where(r => r.Appointment.PatientId == patientId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

    }
}
