using Medix.API.Data.Models;

namespace Medix.API.Data.Repositories
{
    public class DoctorRepository : IDoctorRepository
    {
        public MedixContext _context;

        public DoctorRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<Doctor> CreateDoctorAsync(Doctor doctor)
        {
            await _context.Doctors.AddAsync(doctor);
            await _context.SaveChangesAsync();
            return doctor;
        }
    }
}
