using Medix.API.Data;
using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{

    public interface IUserRepository
    {
        public  Task<User> SaveUserAsync(User user);
    }
    public class UserRepository : IUserRepository
    {
        private readonly MedixContext _context;

        public UserRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<User> SaveUserAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }
    }
}

