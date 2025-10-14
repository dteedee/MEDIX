using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetByEmailAsync(string email);
        Task<User> CreateAsync(User user);
        Task<User> UpdateAsync(User user);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsByEmailAsync(string email);
        Task<UserRole> CreateUserRoleAsync(UserRole role);
    }
}
