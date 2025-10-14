using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public interface IUserRepository
    {
        Task<User> CreateUserAsync(User user);
        Task<UserRole> CreateUserRoleAsync(UserRole role);
    }
}
