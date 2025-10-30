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
            // Truy vấn an toàn không cần lazy loading
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

            // Cập nhật thông tin chính
            _context.Entry(existing).CurrentValues.SetValues(record);

            // Cập nhật danh sách Prescriptions
            _context.Prescriptions.RemoveRange(existing.Prescriptions);
            await _context.Prescriptions.AddRangeAsync(record.Prescriptions);

            await _context.SaveChangesAsync();
        }
    }
}
