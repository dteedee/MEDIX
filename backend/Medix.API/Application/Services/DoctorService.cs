using Medix.API.Data;
using Medix.API.Data.Models;
using Medix.API.Data.Repositories;

namespace Medix.API.Application.Services
{
    public class DoctorService : IDoctorService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly IUserRepository _userRepository;
        private readonly MedixContext _context;

        public DoctorService(IDoctorRepository doctorRepository, IUserRepository userRepository, MedixContext context)
        {
            _doctorRepository = doctorRepository;
            _userRepository = userRepository;
            _context = context;
        }

        public async Task<bool> RegisterDoctorAsync(User user, Doctor doctor, UserRole role)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var createdUser = await _userRepository.CreateAsync(user);
                if (createdUser == null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }
                var createdDoctor = await _doctorRepository.CreateDoctorAsync(doctor);
                if (createdDoctor == null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }
                var userRole = await _userRepository.CreateUserRoleAsync(role);
                if (userRole == null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }
    }
}
