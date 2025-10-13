using Medix.API.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Data.Repositories
{
    public class UserRoleRepository : IUserRoleRepository
    {
        private readonly MedixContext _context;

        public UserRoleRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<string> AssignRole(string roleCode, Guid userId)
        {
            // Kiểm tra xem đã có role này cho user chưa
            var exists = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == userId && ur.RoleCode == roleCode);

            if (exists)
                return null; // Đã có role này cho user
                
            var userRole = new UserRole
            {
                UserId = userId,
                RoleCode = roleCode
            };

            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();
            return userRole.RoleCode;
        }
    }
}
