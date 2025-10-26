using Medix.API.Models.Entities;
using Medix.API.Models.Enums;

namespace Medix.API.DataAccess.Interfaces.UserManagement
{
    public interface IUserRoleRepository
    {
        Task<UserRole> CreateAsync(UserRole userRole);
        Task<UserRole?> GetAsync(Guid userId, string roleCode);
        Task<IEnumerable<UserRole>> GetAllAsync();
        Task<UserRole?> GetByIdAsync(Guid userId);
        Task<bool> DeleteAsync(Guid userId, string roleCode);
        Task<string> AssignRole(string role, Guid userId);
        Task<RefRole?> GetRoleByDisplayNameAsync(string displayName);
        Task RemoveAllRolesForUserAsync(Guid userId);

    }
}