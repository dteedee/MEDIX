using Medix.API.Application.DTOs.Doctor;
using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Services.Community;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorRegistrationFormService : IDoctorRegistrationFormService
    {
        private readonly IDoctorRegistrationFormRepository _doctorRegistrationFormRepository;
        private readonly CloudinaryService _cloudinaryService;

        public DoctorRegistrationFormService(
            IDoctorRegistrationFormRepository doctorRegistrationFormRepository,
            CloudinaryService cloudinaryService)
        {
            _doctorRegistrationFormRepository = doctorRegistrationFormRepository;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<bool> IsUserNameExistAsync(string userName) =>
            await _doctorRegistrationFormRepository.UserNameExistAsync(userName);

        public async Task<bool> IsEmailExistAsync(string email) =>
            await _doctorRegistrationFormRepository.EmailExistAsync(email);

        public async Task<bool> IsPhoneNumberExistAsync(string phoneNumber) =>
            await _doctorRegistrationFormRepository.PhoneNumberExistAsync(phoneNumber);

        public async Task<bool> IsIdentificationNumberExistAsync(string identificationNumber) =>
            await _doctorRegistrationFormRepository.IdentificationNumberExistAsync(identificationNumber);

        public async Task<bool> IsLicenseNumberExistAsync(string licenseNumber) =>
            await _doctorRegistrationFormRepository.LicenseNumberExistAsync(licenseNumber);

        public async Task RegisterDoctorAsync(DoctorRegisterRequest request)
        {
            var avatarUrl = await _cloudinaryService.UploadImageAsync(request.Avatar);
            var licenseImageUrl = await _cloudinaryService.UploadImageAsync(request.LicenseImage);
            var degreeFilesUrl = await _cloudinaryService.UploadArchiveAsync(request.DegreeFiles);

            var form = new DoctorRegistrationForm
            {
                AvatarUrl = avatarUrl,
                FullName = request.FullName,
                UserNameNormalized = request.UserName.ToUpper(),
                DateOfBirth = DateOnly.Parse(request.Dob),
                GenderCode = request.GenderCode,
                IdentificationNumber = request.IdentificationNumber,
                EmailNormalized = request.Email.ToUpper(),
                PhoneNumber = request.PhoneNumber,
                SpecializationId = Guid.Parse(request.SpecializationId),
                LicenseImageUrl = licenseImageUrl,
                LicenseNumber = request.LicenseNumber,
                DegreeFilesUrl = degreeFilesUrl,
                Bio = request.Bio,
                Education = request.Education,
                YearsOfExperience = (int)request.YearsOfExperience,
            };

            await _doctorRegistrationFormRepository.AddAsync(form);
        }

        public async Task<PagedList<DoctorRegistrationForm>> GetAllRegistrationFormsAsync(DoctorQuery query)
            => await _doctorRegistrationFormRepository.GetAllAsync(query);
    }
}
