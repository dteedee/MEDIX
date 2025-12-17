using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.Manager;
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
            var appointmentStatuses = new[] { "Completed", "MissedByPatient" };
            const string appointmentPaymentStatus = "Paid";

            const string walletTransactionType = "AppointmentPayment";
            const string walletTransactionStatus = "Completed";

            var baseAppts = _context.Appointments
                .AsNoTracking()
                .Where(a => a.AppointmentStartTime.Year == year
                            && (doctorId == null || a.DoctorId == doctorId));

            var apptCounts = await baseAppts
                .GroupBy(a => a.AppointmentStartTime.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();

            // Wallet transactions linked to appointments whose appointment.StatusCode is in appointmentStatuses
            var wtGrouped = await _context.WalletTransactions
                .AsNoTracking()
                .Where(wt =>
                    wt.TransactionTypeCode == walletTransactionType &&
                    wt.Status == walletTransactionStatus &&
                    wt.TransactionDate.Year == year &&
                    wt.RelatedAppointmentId != null)
                .Join(
                    _context.Appointments.AsNoTracking(),
                    wt => wt.RelatedAppointmentId,
                    a => a.Id,
                    (wt, a) => new { Wallet = wt, Appointment = a })
                .Where(x => appointmentStatuses.Contains(x.Appointment.StatusCode)
                            && (doctorId == null || x.Appointment.DoctorId == doctorId))
                .GroupBy(x => x.Wallet.TransactionDate.Month)
                .Select(g => new { Month = g.Key, WalletRevenue = g.Sum(x => (decimal?)x.Wallet.Amount) ?? 0m })
                .ToListAsync();

            // Related appointment ids that have wallet transactions and whose appointment status is within appointmentStatuses.
            var relatedAppointmentIds = await _context.WalletTransactions
                .AsNoTracking()
                .Where(wt =>
                    wt.TransactionTypeCode == walletTransactionType &&
                    wt.Status == walletTransactionStatus &&
                    wt.TransactionDate.Year == year &&
                    wt.RelatedAppointmentId != null)
                .Join(
                    _context.Appointments.AsNoTracking(),
                    wt => wt.RelatedAppointmentId,
                    a => a.Id,
                    (wt, a) => a)
                .Where(a => appointmentStatuses.Contains(a.StatusCode)
                            && (doctorId == null || a.DoctorId == doctorId))
                .Select(a => a.Id)
                .Distinct()
                .ToListAsync();

            if (doctorId != null && relatedAppointmentIds.Any())
            {
                // Keep this check for safety / compatibility — relatedAppointmentIds already filtered by doctor above,
                // but we keep same pattern as original code to avoid behavioral changes in other paths.
                relatedAppointmentIds = await _context.Appointments
                    .AsNoTracking()
                    .Where(a => relatedAppointmentIds.Contains(a.Id) && a.DoctorId == doctorId)
                    .Select(a => a.Id)
                    .Distinct()
                    .ToListAsync();
            }


            var apptRevenueQuery = baseAppts
                .Where(a => appointmentStatuses.Contains(a.StatusCode) && a.PaymentStatusCode == appointmentPaymentStatus);

            if (relatedAppointmentIds.Any())
            {
                // Exclude appointments already counted via linked wallet transactions (to avoid double counting)
                apptRevenueQuery = apptRevenueQuery.Where(a => !relatedAppointmentIds.Contains(a.Id));
            }

            var apptRevenueGrouped = await apptRevenueQuery
                .GroupBy(a => a.AppointmentStartTime.Month)
                .Select(g => new { Month = g.Key, AppointmentRevenue = g.Sum(a => (decimal?)a.TotalAmount) ?? 0m })
                .ToListAsync();

            var months = Enumerable.Range(1, 12)
                .Select(m => new MonthlyAppointmentTrendDto
                {
                    Month = m,
                    AppointmentCount = 0,
                    AppointmentRevenue = 0m,
                    WalletRevenue = 0m
                })
                .ToDictionary(x => x.Month);

            foreach (var c in apptCounts)
            {
                if (months.ContainsKey(c.Month))
                    months[c.Month].AppointmentCount = c.Count;
            }

            foreach (var r in apptRevenueGrouped)
            {
                if (months.ContainsKey(r.Month))
                    months[r.Month].AppointmentRevenue = r.AppointmentRevenue;
            }

            foreach (var w in wtGrouped)
            {
                if (months.ContainsKey(w.Month))
                    months[w.Month].WalletRevenue = w.WalletRevenue;
            }

            // Ensure TotalRevenue reflects only appointments with the desired statuses.
       

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
                .Include(a=>a.MedicalRecord)
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
                .Include(a => a.StatusCodeNavigation)
                .Include(a => a.PaymentStatusCodeNavigation)
                .Include(a => a.PaymentMethodCodeNavigation)
                .Where(a => a.DoctorId == doctorId &&
                            a.AppointmentStartTime >= startDate &&
                            a.AppointmentStartTime < endDate)
                .OrderBy(a => a.AppointmentStartTime)
                .ToListAsync();
        }

        public async Task<bool> HasFutureAppointmentsForDoctorOnDay(Guid doctorId, int dayOfWeek)
        {
            var today = DateTime.Today;
            var dotNetDayOfWeek = dayOfWeek == 7 ? 0 : dayOfWeek; 
            var day = (DayOfWeek)dotNetDayOfWeek;
            
            var futureAppointments = await _context.Appointments
                .Where(a =>
                    a.DoctorId == doctorId &&
                    a.AppointmentStartTime >= today && 
                    a.TransactionId != null) 
                .Select(a => a.AppointmentStartTime) 
                .ToListAsync();


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

        public async Task<(int Total, int Completed, int Cancelled)> GetDoctorAppointmentStatsAsync(Guid doctorId)
        {
            var appointments = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.DoctorId == doctorId)
                .ToListAsync();

            var total = appointments.Count;
            var completed = appointments.Count(a => a.StatusCode == "Completed");
            var cancelled = appointments.Count(a => (a.StatusCode == "CancelledByDoctor" || a.StatusCode == "CancelledByPatient" || a.StatusCode == "MissedByDoctor"||a.StatusCode== "MissedByPatient"));

            return (total, completed, cancelled);
        }
    }
}
