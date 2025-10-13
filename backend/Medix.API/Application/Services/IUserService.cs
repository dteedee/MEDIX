using Medix.API.Application.DTO;
using Medix.API.Application.DTOs.Auth;

namespace Medix.API.Application.Services
{
    public interface IUserService
    {
      public Task<UserDto> RegisterUserAsync(RegisterRequestPatientDto registerDTo);
}
}
