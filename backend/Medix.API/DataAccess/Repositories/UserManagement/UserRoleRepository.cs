using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.UserManagement
{
    public class UserRoleRepository : IUserRoleRepository
    {
        private readonly MedixContext _context;

        public UserRoleRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<UserRole> CreateAsync(UserRole userRole)
        {
            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();
            return userRole;
        }

        public async Task<UserRole?> GetAsync(Guid userId, string roleCode)
        {
            return await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleCode == roleCode);
        }

        public async Task<IEnumerable<UserRole>> GetAllAsync()
        {
            return await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.RoleCodeNavigation)
                .ToListAsync();
        }

        public async Task<UserRole?> GetByIdAsync(Guid userId)
        {
            return await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.RoleCodeNavigation)
                .FirstOrDefaultAsync(ur => ur.UserId == userId);
        }

        public async Task<bool> DeleteAsync(Guid userId, string roleCode)
        {
            var userRole = await GetAsync(userId, roleCode);
            if (userRole == null) return false;

            _context.UserRoles.Remove(userRole);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string> AssignRole(string role, Guid userId)
        {
            var userRole = new UserRole
            {
                UserId = userId,
                RoleCode = role,
                CreatedAt = DateTime.UtcNow
            };

            await CreateAsync(userRole);
            return role;
        }
    }
}