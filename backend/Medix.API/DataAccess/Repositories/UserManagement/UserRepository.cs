using CloudinaryDotNet.Actions;
using Medix.API.Application.Util;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.DTOs.Manager;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.UserManagement
{
    public class UserRepository : IUserRepository
    {
        private readonly MedixContext _context;

        private readonly ISystemConfigurationService _systemConfigurationService;
        private const string PatientCancelRefundConfigKey = "APPOINTMENT_PATIENT_CANCEL_REFUND_PERCENT";

        public UserRepository(MedixContext context, ISystemConfigurationService systemConfigurationService)
        {
            _context = context;
            _systemConfigurationService = systemConfigurationService;
        }

        public async Task<User?> GetByIdAsync(Guid? id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.RoleCodeNavigation)
                .FirstOrDefaultAsync(u => u.NormalizedEmail == email.ToUpperInvariant());
        }

        public async Task<User> CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsByEmailAsync(string email)
        {
            return await _context.Users
                .AnyAsync(u => u.NormalizedEmail == email.ToUpperInvariant());
        }

        public async Task<User?> GetByUserNameAsync(string userName)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.NormalizedUserName == userName.ToUpperInvariant());
        }

        public async Task<User> SaveUserAsync(User user)
        {
            return await CreateAsync(user);
        }

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.RoleCodeNavigation)
                .ToListAsync();
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.RoleCodeNavigation)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<List<MonthlyUserGrowthDto>> GetMonthlyUserAndDoctorCountsAsync(int year)
        {
            var usersByMonth = await _context.Users
                .AsNoTracking()
                .Where(u => u.CreatedAt.Year == year)
                .GroupBy(u => u.CreatedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();

            var doctorsByMonth = await _context.Doctors
                .AsNoTracking()
                .Where(d => d.CreatedAt.Year == year)
                .GroupBy(d => d.CreatedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();

            var result = Enumerable.Range(1, 12)
                .Select(m => new MonthlyUserGrowthDto
                {
                    Month = m,
                    NewUsers = usersByMonth.FirstOrDefault(x => x.Month == m)?.Count ?? 0,
                    NewDoctors = doctorsByMonth.FirstOrDefault(x => x.Month == m)?.Count ?? 0
                })
                .ToList();

            return result;
        }

        public async Task<(int total, IEnumerable<User> data)> GetPagedAsync(int page, int pageSize)
        {
            var query = _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.RoleCodeNavigation)
                .OrderByDescending(u => u.CreatedAt);

            var total = await query.CountAsync();
            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (total, users);
        }


        public async Task<(int total, IEnumerable<User> data)> SearchAsync(string keyword, int page, int pageSize)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var k = keyword.Trim().ToLower();
                query = query.Where(u => (u.FullName != null && u.FullName.ToLower().Contains(k)) ||
                                         (u.Email != null && u.Email.ToLower().Contains(k)) ||
                                         (u.PhoneNumber != null && u.PhoneNumber.Contains(k)));
            }

            var total = await query.CountAsync();
            var users = await query.OrderByDescending(u => u.CreatedAt)
                                   .Skip((page - 1) * pageSize)
                                   .Take(pageSize)
                                   .ToListAsync();
            return (total, users);
        }

        public async Task<IEnumerable<User>> SearchByNameAsync(string keyword)
        {
            keyword = keyword?.Trim() ?? string.Empty;

            return await _context.Users
                .Where(u => !string.IsNullOrEmpty(u.FullName) && u.FullName.Contains(keyword))
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<UserRole> CreateUserRoleAsync(UserRole userRole)
        {
            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();
            return userRole;
        }

        public async Task<bool> ExistsByPhoneNumberAsync(string phoneNumber)
        {
            return await _context.Users
                .AnyAsync(u => u.PhoneNumber == phoneNumber);
        }

        //public async Task<Role?> GetRoleByDisplayNameAsync(string displayName)
        //{
        //    return await _context.Roles.FirstOrDefaultAsync(r => r.DisplayName == displayName);
        //}

        public async Task RemoveAllRolesForUserAsync(Guid userId)
        {
            var roles = _context.UserRoles.Where(ur => ur.UserId == userId);
            _context.UserRoles.RemoveRange(roles);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsByUserNameAsync(string userName) => await _context.Users
            .AnyAsync(u => u.NormalizedUserName == userName.ToUpperInvariant());
        public async Task<bool> ExistsByIdentificationNumberAsync(string identificationNumber) => await _context.Users
            .AnyAsync(u => u.IdentificationNumber == identificationNumber);

        public async Task<ManagerDashboardSummaryDto> GetSummaryAsync(
       DateTime startCurrentPeriodUtc,
       DateTime endCurrentPeriodUtc,
       DateTime startPreviousPeriodUtc,
       DateTime endPreviousPeriodUtc)
        {
            var refundPercentageConfig = await _systemConfigurationService.GetValueAsync<decimal?>(PatientCancelRefundConfigKey);

            var refundPercentage = refundPercentageConfig ?? 0.80m;

            if (refundPercentage > 1m && refundPercentage <= 100m)
            {
                refundPercentage /= 100m;
            }

            if (refundPercentage < 0m) refundPercentage = 0m;
            if (refundPercentage > 1m) refundPercentage = 1m;

            var totalUsers = await _context.Users.AsNoTracking().LongCountAsync();
            var newUsersCurrent = await _context.Users.AsNoTracking()
                .LongCountAsync(u => u.CreatedAt >= startCurrentPeriodUtc && u.CreatedAt <= endCurrentPeriodUtc);
            var newUsersPrev = await _context.Users.AsNoTracking()
                .LongCountAsync(u => u.CreatedAt >= startPreviousPeriodUtc && u.CreatedAt <= endPreviousPeriodUtc);

            var totalDoctors = await _context.Doctors.AsNoTracking().LongCountAsync();
            var newDoctorsCurrent = await _context.Doctors.AsNoTracking()
                .LongCountAsync(d => d.CreatedAt >= startCurrentPeriodUtc && d.CreatedAt <= endCurrentPeriodUtc);
            var newDoctorsPrev = await _context.Doctors.AsNoTracking()
                .LongCountAsync(d => d.CreatedAt >= startPreviousPeriodUtc && d.CreatedAt <= endPreviousPeriodUtc);

            var totalAppointments = await _context.Appointments.AsNoTracking().LongCountAsync();
            var apptCurrent = await _context.Appointments.AsNoTracking()
                .LongCountAsync(a => a.CreatedAt >= startCurrentPeriodUtc && a.CreatedAt <= endCurrentPeriodUtc);
            var apptPrev = await _context.Appointments.AsNoTracking()
                .LongCountAsync(a => a.CreatedAt >= startPreviousPeriodUtc && a.CreatedAt <= endPreviousPeriodUtc);

            var revenueTotal = (await _context.WalletTransactions.AsNoTracking()
                .Where(wt => wt.TransactionTypeCode == "AppointmentPayment" && wt.Status == "Completed")
                .Select(wt => (decimal?)wt.Amount)
                .SumAsync()) ?? 0m;

            // Apply appointment-based revenue rules for period calculations:
            // - "Completed" => TotalAmount * 0.3
            // - "MissedByPatient" => TotalAmount * 0.3
            // - "CancelledByPatient" => TotalAmount * (1 - refundPercentage)
            var consideredStatuses = new[] { "Completed", "MissedByPatient", "CancelledByPatient" };

            var revenueCurrent = (await _context.Appointments.AsNoTracking()
                .Where(a => a.CreatedAt >= startCurrentPeriodUtc && a.CreatedAt <= endCurrentPeriodUtc
                            && consideredStatuses.Contains(a.StatusCode))
                .Select(a => (decimal?)
                    (a.StatusCode == "Completed" ? a.TotalAmount * 0.3m
                     : a.StatusCode == "MissedByPatient" ? a.TotalAmount * 0.3m
                     : /* CancelledByPatient */ a.TotalAmount * (1 - refundPercentage)))
                .SumAsync()) ?? 0m;

            var revenuePrev = (await _context.Appointments.AsNoTracking()
                .Where(a => a.CreatedAt >= startPreviousPeriodUtc && a.CreatedAt <= endPreviousPeriodUtc
                            && consideredStatuses.Contains(a.StatusCode))
                .Select(a => (decimal?)
                    (a.StatusCode == "Completed" ? a.TotalAmount * 0.3m
                     : a.StatusCode == "MissedByPatient" ? a.TotalAmount * 0.3m
                     : /* CancelledByPatient */ a.TotalAmount * (1 - refundPercentage)))
                .SumAsync()) ?? 0m;

            var dto = new ManagerDashboardSummaryDto
            {
                Users = new StatDto
                {
                    Total = totalUsers,
                    Growth = GrowthPercentage.CalculateGrowthPercentage(newUsersPrev, newUsersCurrent)
                },
                Doctors = new StatDto
                {
                    Total = totalDoctors,
                    Growth = GrowthPercentage.CalculateGrowthPercentage(newDoctorsPrev, newDoctorsCurrent)
                },
                Appointments = new StatDto
                {
                    Total = totalAppointments,
                    Growth = GrowthPercentage.CalculateGrowthPercentage(apptPrev, apptCurrent)
                },
                Revenue = new StatDto
                {
                    Total = (long)revenueCurrent,
                    Growth = GrowthPercentage.CalculateGrowthPercentage(revenuePrev, revenueCurrent)
                }
            };

            return dto;
        }
    }
}