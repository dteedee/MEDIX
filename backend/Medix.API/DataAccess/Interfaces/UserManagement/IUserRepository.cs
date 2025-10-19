using Medix.API.Models.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Medix.API.DataAccess.Interfaces.UserManagement
{
    public interface IUserRepository
    {
        Task<User> CreateAsync(User user);
        Task<User?> GetByIdAsync(Guid id);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByUserNameAsync(string userName);
        Task<User> UpdateAsync(User user);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<User>> GetAllAsync();
        Task<(int total, IEnumerable<User> data)> GetPagedAsync(int page, int pageSize);
        Task<(int total, IEnumerable<User> data)> SearchAsync(string keyword, int page, int pageSize);
        Task<IEnumerable<User>> SearchByNameAsync(string keyword);
    }
}