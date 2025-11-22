using CloudinaryDotNet.Actions;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.UserManagement
{
    public class UserRepository : IUserRepository
    {
        private readonly MedixContext _context;

        public UserRepository(MedixContext context)
        {
            _context = context;
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
            // Users grouped by month
            var usersByMonth = await _context.Users
                .AsNoTracking()
                .Where(u => u.CreatedAt.Year == year)
                .GroupBy(u => u.CreatedAt.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() })
                .ToListAsync();

            // Doctors grouped by month
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

    }
}