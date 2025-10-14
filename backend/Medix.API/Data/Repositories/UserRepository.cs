using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly MedixContext _context;

        public UserRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<User> CreateUserAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<UserRole> CreateUserRoleAsync(UserRole role)
        {
            await _context.UserRoles.AddAsync(role);
            await _context.SaveChangesAsync();
            return role;
        }
    }
}
