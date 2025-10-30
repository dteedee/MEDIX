using Medix.API.Business.Helper;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.DataAccess.Repositories.Classification
{
    public class DoctorRegistrationFormRepository : IDoctorRegistrationFormRepository
    {
        private readonly MedixContext _context;

        public DoctorRegistrationFormRepository(MedixContext context)
        {
            _context = context;
        }

        public async Task<bool> UserNameExistAsync(string userName) =>
            await _context.DoctorRegistrationForms.AnyAsync(d => d.UserNameNormalized == userName.ToUpper());

        public async Task<bool> EmailExistAsync(string email) =>
            await _context.DoctorRegistrationForms.AnyAsync(d => d.EmailNormalized == email.ToUpper());

        public async Task<bool> PhoneNumberExistAsync(string phoneNumber) =>
            await _context.DoctorRegistrationForms.AnyAsync(d => d.PhoneNumber == phoneNumber);

        public async Task<bool> IdentificationNumberExistAsync(string identificationNumber) =>
            await _context.DoctorRegistrationForms.AnyAsync(d => d.IdentificationNumber == identificationNumber);

        public async Task<bool> LicenseNumberExistAsync(string licenseNumber) =>
            await _context.DoctorRegistrationForms.AnyAsync(d => d.LicenseNumber.ToLower() == licenseNumber.ToLower());

        public async Task AddAsync(DoctorRegistrationForm form)
        {
            await _context.DoctorRegistrationForms.AddAsync(form);
            await _context.SaveChangesAsync();
        }

        public async Task<PagedList<DoctorRegistrationForm>> GetAllAsync(DoctorQuery query)
        {
            var listQueryable = _context.DoctorRegistrationForms.AsQueryable();

            query.SearchTerm = query.SearchTerm?.Trim().ToLower();

            if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            {
                listQueryable = listQueryable.Where(d =>
                    d.FullName.ToLower().Contains(query.SearchTerm) ||
                    d.EmailNormalized.Contains(query.SearchTerm.ToUpper()) ||
                    d.Specialization.Name.ToLower().Contains(query.SearchTerm)
                );
            }

            if (query.PageSize <= 0)
            {
                query.PageSize = 10;
            }

            if (query.Page <= 0)
            {
                query.Page = 1;
            }

            var doctors = await listQueryable
                .Include(d => d.Specialization)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedList<DoctorRegistrationForm>
            {
                Items = doctors,
                TotalPages = (int)Math.Ceiling((double)await listQueryable.CountAsync() / query.PageSize),
            };
        }

        public async Task<DoctorRegistrationForm?> GetByIdAsync(Guid id)
        {
            return await _context.DoctorRegistrationForms
                .Include(d => d.Specialization)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var form = await _context.DoctorRegistrationForms.FindAsync(id);
            if (form == null)
            {
                return false;
            }
            _context.DoctorRegistrationForms.Remove(form);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
