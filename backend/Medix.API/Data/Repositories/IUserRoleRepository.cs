namespace Medix.API.Data.Repositories
{
    public interface IUserRoleRepository
    {

        public Task<string> AssignRole(String Role, Guid userId);
    }
}
