using Medix.API.Models.Entities;

namespace Medix.API.DataAccess.Interfaces.UserManagement
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetByEmailAsync(string email);
        Task<User> CreateAsync(User user);
        Task<User> UpdateAsync(User user);
        Task<bool> DeleteAsync(Guid id);
        Task<bool> ExistsByEmailAsync(string email);
        Task<User> SaveUserAsync(User user);
        Task<IEnumerable<User>> GetAllAsync();
        Task<UserRole> CreateUserRoleAsync(UserRole userRole);
    }
}
