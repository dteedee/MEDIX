﻿﻿﻿using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly MedixContext _context;

        public AppointmentRepository(MedixContext context)
        {
            _context = context;
        }
        public async Task<List<MonthlyAppointmentTrendDto>> GetMonthlyAppointmentAndRevenueAsync(Guid? doctorId, int year)
        {
            // Appointments query (restrict by year, optional doctor)
            var apptQuery = _context.Appointments
                .AsNoTracking()
                .Where(a => a.AppointmentStartTime.Year == year
                            && (doctorId == null || a.DoctorId == doctorId));

            var apptGrouped = await apptQuery
                .GroupBy(a => a.AppointmentStartTime.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Count = g.Count(),
                    AppointmentRevenue = g
                        .Where(a => a.StatusCode == "Completed" && a.PaymentStatusCode == "Paid")
                        .Sum(a => (decimal?)a.TotalAmount) ?? 0m
                })
                .ToListAsync();

            // Wallet transactions related to appointments (use RelatedAppointmentId navigation)
            var wtQuery = _context.WalletTransactions
                .AsNoTracking()
                .Where(wt => wt.RelatedAppointmentId != null
                             && wt.TransactionDate.Year == year
                             && (doctorId == null || wt.RelatedAppointment != null && wt.RelatedAppointment.DoctorId == doctorId));

            var wtGrouped = await wtQuery
                .GroupBy(wt => wt.TransactionDate.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    WalletRevenue = g.Sum(wt => (decimal?)wt.Amount) ?? 0m
                })
                .ToListAsync();

            // Merge results into months 1..12
            var months = Enumerable.Range(1, 12)
                .Select(m => new MonthlyAppointmentTrendDto
                {
                    Month = m,
                    AppointmentCount = 0,
                    AppointmentRevenue = 0m,
                    WalletRevenue = 0m
                })
                .ToDictionary(x => x.Month);

            foreach (var a in apptGrouped)
            {
                if (months.ContainsKey(a.Month))
                {
                    months[a.Month].AppointmentCount = a.Count;
                    months[a.Month].AppointmentRevenue = a.AppointmentRevenue;
                }
            }

            foreach (var w in wtGrouped)
            {
                if (months.ContainsKey(w.Month))
                {
                    months[w.Month].WalletRevenue = w.WalletRevenue;
                }
            }

            return months.Values.OrderBy(m => m.Month).ToList();
        }
        public async Task<IEnumerable<Appointment>> GetAllAsync()
        {
            return await _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.PaymentStatusCodeNavigation)
                .Include(a => a.PaymentMethodCodeNavigation)
                .ToListAsync();
        }

        public async Task<Appointment?> GetByIdAsync(Guid id)
        {
            return await _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.PaymentStatusCodeNavigation)
                .Include(a => a.PaymentMethodCodeNavigation)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task AddAsync(Appointment entity)
        {
            await _context.Appointments.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Appointment entity)
        {
            _context.Appointments.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await _context.Appointments.FindAsync(id);
            if (entity != null)
            {
                _context.Appointments.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }
        public async Task<bool> IsDoctorBusyAsync(Guid doctorId, DateTime start, DateTime end, Guid? ignoreAppointmentId = null)
        {
            return await _context.Appointments.AnyAsync(a =>
                a.DoctorId == doctorId &&
                a.Id != (ignoreAppointmentId ?? Guid.Empty) &&
                (
                    (start >= a.AppointmentStartTime && start < a.AppointmentEndTime) ||
                    (end > a.AppointmentStartTime && end <= a.AppointmentEndTime) ||
                    (start <= a.AppointmentStartTime && end >= a.AppointmentEndTime)
                )
            );
        }
        public async Task<IEnumerable<Appointment>> GetByDoctorAsync(Guid doctorId)
        {
            return await _context.Appointments
                 
                .Where(a => a.DoctorId == doctorId)
                .OrderBy(a => a.AppointmentStartTime)
                .ToListAsync();
        }

        public async Task<IEnumerable<Appointment>> GetByPatientAsync(Guid patientId)
        {
            return await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Where(a => a.PatientId == patientId && a.TransactionId != null)
                .OrderByDescending(a => a.AppointmentStartTime)
                .ToListAsync();
        }

        public async Task<IEnumerable<Appointment>> GetByDateAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            return await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Where(a =>
                    a.TransactionId != null &&
                    a.AppointmentStartTime >= startDate &&
                    a.AppointmentStartTime < endDate)
                .OrderBy(a => a.AppointmentStartTime)
                .ToListAsync();
        }
        public async Task<Doctor?> GetDoctorByUserIdAsync(Guid userId)
        {
            return await _context.Doctors
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.User.Id == userId);
        }

        public async Task<IEnumerable<Appointment>> GetByDoctorAndDateAsync(Guid doctorId, DateTime startDate, DateTime endDate)
        {
            return await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Doctor).ThenInclude(d => d.User)
                .Where(a => a.DoctorId == doctorId &&
                            a.AppointmentStartTime >= startDate &&
                            a.AppointmentStartTime < endDate &&
                            a.TransactionId != null)
                .OrderBy(a => a.AppointmentStartTime)
                .ToListAsync();
        }

        public async Task<bool> HasFutureAppointmentsForDoctorOnDay(Guid doctorId, int dayOfWeek)
        {
            var today = DateTime.Today;
            // DayOfWeek trong .NET là một enum (Sunday = 0, ..., Saturday = 6), khớp với giá trị int đầu vào.
            var day = (DayOfWeek)dayOfWeek;
            
            // Lọc trước các điều kiện có thể dịch sang SQL ở phía server
            var futureAppointments = await _context.Appointments
                .Where(a =>
                    a.DoctorId == doctorId &&
                    a.AppointmentStartTime >= today && // Điều kiện này dịch được
                    a.TransactionId != null) // Điều kiện này dịch được
                .Select(a => a.AppointmentStartTime) // Chỉ lấy cột ngày giờ để giảm dữ liệu truyền tải
                .ToListAsync();

            // Thực hiện kiểm tra DayOfWeek ở phía client (trong bộ nhớ)
            // Vì dữ liệu đã được lọc trước nên thao tác này rất nhanh.
            return futureAppointments.Any(appointmentDate => appointmentDate.DayOfWeek == day);
        }

        public async Task<bool> HasAppointmentsInTimeRangeAsync(Guid doctorId, DateTime overrideDate, TimeOnly startTime, TimeOnly endTime)
        {
            var startDate = overrideDate.Date.Add(startTime.ToTimeSpan());
            var endDate = overrideDate.Date.Add(endTime.ToTimeSpan());

            return await _context.Appointments.AnyAsync(a =>
                a.DoctorId == doctorId &&
                a.AppointmentStartTime < endDate &&
                a.AppointmentEndTime > startDate
            );
        }



       public async Task<Appointment> CreateApppointmentAsync(Appointment entity)
        {
            await _context.Appointments.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<int> CountStatus(Guid id, string Status)
        {
            return await _context.Appointments.Where(d => d.DoctorId == id && d.StatusCode == Status).CountAsync();
        }
    }
}
