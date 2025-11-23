using Medix.API.Business.Helper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.Business.Interfaces.Community;
using Medix.API.DataAccess;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.UserManagement;
using Medix.API.Models.DTOs;
using Medix.API.Models.DTOs.Doctor;
using Medix.API.Models.Entities;
using Medix.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Medix.API.Business.Services.Classification
{
    public class DoctorService : IDoctorService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly IUserRepository _userRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly MedixContext _context;
        private readonly IDoctorScheduleRepository _doctorScheduleRepository;
        private readonly IDoctorScheduleOverrideRepository _doctorScheduleOverrideRepository;
        private readonly IEmailService _emailService;
        private readonly IAppointmentService _appointmentService;
        private readonly IServiceTierRepository _serviceTierRepo;
        private readonly IServiceTierRepository _serviceTierRepository;
        private readonly IAppointmentRepository _appointmentRepository;

        public DoctorService(IDoctorRepository doctorRepository, IUserRepository userRepository,
            MedixContext context, IReviewRepository reviewRepository, IServiceTierRepository serviceTierRepository, IServiceTierRepository serviceTierRepo, IDoctorScheduleRepository doctorScheduleRepository,
            IEmailService emailService, IDoctorScheduleOverrideRepository doctorScheduleOverrideRepository, IAppointmentService appointmentService, IAppointmentRepository appointmentRepository)
        {
            _doctorRepository = doctorRepository;
            _userRepository = userRepository;
            _context = context;
            _reviewRepository = reviewRepository;
            _serviceTierRepository = serviceTierRepository;
            _serviceTierRepo = serviceTierRepo;
            _doctorScheduleRepository = doctorScheduleRepository;
            _emailService = emailService;
            _doctorScheduleOverrideRepository = doctorScheduleOverrideRepository;
            _appointmentService = appointmentService;
            _appointmentRepository = appointmentRepository;
        }

        public async Task<List<Doctor>> GetHomePageDoctorsAsync()
        {
            return await _doctorRepository.GetHomePageDoctorsAsync();
        }
        public async Task<bool> UpdateDoctorEducationAndFeeAsync(Guid doctorId, string? education, decimal? consultationFee)
        {
            var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId);
            if (doctor == null)
                return false;

            var updated = false;

            if (education != null && education != doctor.Education)
            {
                doctor.Education = education;
                updated = true;
            }

            if (consultationFee.HasValue && consultationFee.Value != doctor.ConsultationFee)
            {
                if (consultationFee.Value < 0)
                    throw new ArgumentException("Consultation fee must be non-negative", nameof(consultationFee));

                doctor.ConsultationFee = consultationFee.Value;
                updated = true;
            }

            if (!updated)
                return true; // nothing to change

            doctor.UpdatedAt = DateTime.UtcNow;

            var result = await _doctorRepository.UpdateDoctorAsync(doctor);
            return result != null;
        }
        public async Task<bool> LicenseNumberExistsAsync(string licenseNumber) => await _doctorRepository.LicenseNumberExistsAsync(licenseNumber);

        //public async Task<DoctorProfileDto?> GetDoctorProfileByUserNameAsync(string userName)
        //{
        //    var doctor = await _doctorRepository.GetDoctorByUserNameAsync(userName);
        //    if (doctor == null) { return null; }
        //    var reviews = await _reviewRepository.GetReviewsByDoctorAsync(doctor.Id);
        //    int[] ratingByStar = new int[5];
        //    foreach (var review in reviews)
        //    {
        //        if (review.Rating >= 1 && review.Rating <= 5)
        //        {
        //            ratingByStar[review.Rating - 1]++;
        //        }
        //    }

        //    var profileDto = new DoctorProfileDto
        //    {
        //        FullName = doctor.User.FullName,
        //        AverageRating = reviews.Count > 0
        //            ? Math.Round((decimal)reviews.Average(r => r.Rating), 1)
        //            : 0,
        //        Specialization = doctor.Specialization.Name,
        //        Biography = doctor.Bio,
        //        AvatarUrl = doctor.User.AvatarUrl,
        //        NumberOfReviews = reviews.Count,
        //        RatingByStar = ratingByStar,
        //    };

        //    profileDto.Reviews = reviews.OrderByDescending(r => r.CreatedAt)
        //        .Select(r => new ReviewDto
        //        {
        //            Rating = r.Rating,
        //            Comment = r.Comment,
        //            Date = r.CreatedAt.ToString("dd/MM/yyyy"),
        //        })
        //        .Take(4)
        //        .ToList();

        //    return profileDto;
        //}

        public async Task<Doctor?> GetDoctorByUserIdAsync(Guid userId)
        {
            return await _doctorRepository.GetDoctorByUserIdAsync(userId);
        }

        public async Task<bool> UpdateDoctorProfileAsync(Doctor existingDoctor, DoctorProfileUpdateRequest req)
        {
            existingDoctor.User.UserName = req.UserName;
            existingDoctor.User.NormalizedUserName = req.UserName.ToUpper();
            existingDoctor.User.PhoneNumber = req.PhoneNumber;
            existingDoctor.User.Address = req.Address;

            var updatedDoctor = await _doctorRepository.UpdateDoctorAsync(existingDoctor);
            return updatedDoctor != null;
        }

        public async Task<IEnumerable<ServiceTierWithPaginatedDoctorsDto>> GetGroupedDoctorsAsync(
         DoctorQueryParameters queryParams)
        {
            var tiers = await _serviceTierRepo.GetActiveTiersAsync();
            var resultList = new List<ServiceTierWithPaginatedDoctorsDto>();

            foreach (var tier in tiers)
            {
                // 3. Truyền toàn bộ queryParams xuống Repository
                var (doctors, totalCount) = await _doctorRepository.GetPaginatedDoctorsByTierIdAsync(
                    tier.Id,
                    queryParams); // <-- THAY ĐỔI Ở ĐÂY

                // 4. Map sang DoctorBookinDto của bạn
                var doctorDtos = doctors.Where(x=>x.IsAcceptingAppointments==true).Select(doc => new DoctorBookinDto
                {
                    userId = doc.User.Id,
                    DoctorId = doc.Id,
                    DoctorName = doc.User.FullName,
                    specializationCode = doc.Specialization.Code,
                    specialization = doc.Specialization.Name,
                    educationcode = doc.Education,
                    Education = DoctorDegree.GetDescription(doc.Education), // Giả sử bạn có lớp này
                    Experience = doc.YearsOfExperience.ToString(),
                    price = doc.ConsultationFee,
                    bio = doc.Bio,
                    rating = doc.AverageRating,
                    AvatarUrl = doc.User.AvatarUrl,
                    IsAcceptingAppointments = doc.IsAcceptingAppointments

                }).ToList();

                // 5. Tạo DTO phân trang
                var paginatedDoctors = new PaginatedListDto<DoctorBookinDto>(
                    doctorDtos,
                    queryParams.PageNumber,
                    queryParams.PageSize,
                    totalCount);

                // 6. Thêm vào kết quả
                resultList.Add(new ServiceTierWithPaginatedDoctorsDto
                {
                    Id = tier.Id,
                    Name = tier.Name,
                    Description = tier.Description,
                    Doctors = paginatedDoctors
                });
            }
            return resultList;
        }

        public async Task<DoctorProfileDto?> GetDoctorProfileByDoctorIDAsync(string doctorID)
        {
            var doctor = await _doctorRepository.GetDoctorProfileByDoctorIDAsync(Guid.Parse(doctorID));
            if (doctor == null) { return null; }
            var reviews = await _reviewRepository.GetReviewsByDoctorAsync(doctor.Id);
            var schedule = await _doctorScheduleRepository.GetDoctorSchedulesByDoctorIdAsync(doctor.Id);

            var overrides = await _doctorScheduleOverrideRepository.GetByDoctorIdAsync(doctor.Id);
            var appoint = await _appointmentService.GetByDoctorAsync(Guid.Parse(doctorID));
            int[] ratingByStar = new int[5];
            foreach (var review in reviews)
            {
                if (review.Rating >= 1 && review.Rating <= 5)
                {
                    ratingByStar[review.Rating - 1]++;
                }
            }

            var profileDto = new DoctorProfileDto
            {
                doctorID = doctor.Id,
                consulationFee = doctor.ConsultationFee,
                FullName = doctor.User.FullName,
                AverageRating = reviews.Count > 0
                    ? Math.Round((decimal)reviews.Average(r => r.Rating), 1)
                    : 0,
                Specialization = doctor.Specialization.Name,

                Biography = doctor.Bio,
                Education = DoctorDegree.GetDescription(doctor.Education),
                AvatarUrl = doctor.User.AvatarUrl,
                NumberOfReviews = reviews.Count,
                RatingByStar = ratingByStar,

                Experiece = doctor.YearsOfExperience
            };

            profileDto.Reviews = reviews.OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewDto
                {
                    Rating = r.Rating,
                    Comment = r.Comment,
                    Date = r.CreatedAt.ToString("dd/MM/yyyy"),
                })
                .Take(4)
                .ToList();
            profileDto.Schedules = schedule
                .Select(s => new DoctorScheduleDto
                {
                    Id = s.Id,
                    DoctorId = s.DoctorId,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    IsAvailable = s.IsAvailable
                })
                .ToList();

            profileDto.ScheduleOverride = overrides.Select(o => new DoctorScheduleOverrideDto
            {
                Id = o.Id,
                DoctorId = o.DoctorId,
                OverrideDate = o.OverrideDate,
                StartTime = o.StartTime,
                EndTime = o.EndTime,
                IsAvailable = o.IsAvailable,
                Reason = o.Reason,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt,
                OverrideType = o.OverrideType

            }).ToList();

            profileDto.appointmentBookedDtos = appoint.Where(x => x.StatusCode == "OnProgressing" || x.StatusCode == "Completed" || x.StatusCode == "NoShow" || x.StatusCode == "Confirmed").Select(a => new AppointmentBookedDto
            {

                StartTime = a.AppointmentStartTime,
                EndTime = a.AppointmentEndTime,
            }).ToList();



            return profileDto;
        }

        //public async Task<PagedList<Doctor>> GetPendingDoctorsAsync(DoctorQuery query)
        //{
        //    return await _doctorRepository.GetPendingDoctorsAsync(query);
        //}

        //public async Task ReviewDoctorProfile(DoctorReviewRequest request, Guid doctorId)
        //{
        //    using var transaction = await _context.Database.BeginTransactionAsync();
        //    var doctor = await _doctorRepository.GetDoctorByIdAsync(doctorId) ?? throw new Exception("Doctor not found");
        //    try
        //    {
        //        if (request.IsApproved)
        //        {
        //            var newPassword = PasswordGenerator.Generate();
        //            var passwordHashed = BCrypt.Net.BCrypt.HashPassword(newPassword);

        //            doctor.User.PasswordHash = passwordHashed;
        //            doctor.Education = request.Education;
        //            doctor.User.Status = 1; // Active

        //            await _doctorRepository.UpdateDoctorAsync(doctor);
        //            var emailBody = GetAcceptEmailBody(newPassword, doctor.User.FullName);
        //            if (!await _emailService.SendEmailAsync(doctor.User.Email, "Phê duyệt hồ sơ bác sĩ", emailBody))
        //            {
        //                throw new Exception("Failed to send approval email");
        //            }
        //        }
        //        else
        //        {
        //            doctor.User.Status = 3; // Rejected
        //            await _doctorRepository.UpdateDoctorAsync(doctor);

        //            var emailBody = GetRejectEmailBody(request.RejectReason ?? "Không có lý do cụ thể", doctor.User.FullName);
        //            if (!await _emailService.SendEmailAsync(doctor.User.Email, "Từ chối hồ sơ bác sĩ", emailBody))
        //            {
        //                throw new Exception("Failed to send rejection email");
        //            }
        //        }
        //        await transaction.CommitAsync();
        //    }
        //    catch
        //    {
        //        await transaction.RollbackAsync();
        //        throw;
        //    }
        //}

        public async Task<PagedList<DoctorDto>> GetDoctorsAsync(DoctorQuery query)
        {
            var list = await _doctorRepository.GetDoctorsAsync(query);
            var doctors = list.Items.Select(doctor => new DoctorDto
            {
                Id = doctor.Id,
                AvatarUrl = doctor.User.AvatarUrl,
                FullName = doctor.User.FullName,
                Email = doctor.User.Email.ToLower(),
                PhoneNumber = doctor.User.PhoneNumber,
                Specialization = doctor.Specialization.Name,
                Education = doctor.Education == null ? null : DoctorDegree.GetDescription(doctor.Education),
                Rating = doctor.Appointments
                    .Where(a => a.Review != null)
                    .Select(a => a.Review.Rating)
                    .DefaultIfEmpty(0)
                    .Average(),
                ReviewCount = doctor.Appointments
                    .Count(a => a.Review != null),
                StatusCode = doctor.User.Status,
                CreatedAt = doctor.CreatedAt.ToString("dd/MM/yyyy"),
                YearsOfExperience = doctor.YearsOfExperience,
                ServiceTier = doctor.ServiceTier?.Name
            }).ToList();

            return new PagedList<DoctorDto>
            {
                Items = doctors,
                TotalPages = list.TotalPages
            };
        }

        public async Task<IEnumerable<EducationWithPaginatedDoctorsDto>> GetDoctorsByEducationAsync(DoctorQueryParameters queryParams)
        {
            var result = new List<EducationWithPaginatedDoctorsDto>();

            // Lấy tất cả các DoctorDegree
            var educationTypes = DoctorDegree.List();

            foreach (var educationType in educationTypes)
            {
                // Query doctors theo education code
                var doctorsQuery = _context.Doctors
                    .Include(d => d.User)
                    .Include(d => d.Specialization)
                    .Include(d => d.ServiceTier)
                    .Where(d => d.Education == educationType.Code && d.User.Status == 1);

                // Áp dụng filter theo SpecializationCode nếu có
                if (!string.IsNullOrWhiteSpace(queryParams.SpecializationCode))
                {
                    doctorsQuery = doctorsQuery.Where(d => d.Specialization.Id == Guid.Parse(queryParams.SpecializationCode));
                }

                // Áp dụng filter theo MinPrice nếu có
                if (queryParams.MinPrice.HasValue)
                {
                    doctorsQuery = doctorsQuery.Where(d => d.ConsultationFee >= queryParams.MinPrice.Value);
                }

                // Áp dụng filter theo MaxPrice nếu có
                if (queryParams.MaxPrice.HasValue)
                {
                    doctorsQuery = doctorsQuery.Where(d => d.ConsultationFee <= queryParams.MaxPrice.Value);
                }

                // Đếm tổng số doctors
                var totalCount = await doctorsQuery.CountAsync();

                // Áp dụng pagination
                var doctors = await doctorsQuery
                    .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                    .Take(queryParams.PageSize).Where(x=>x.IsAcceptingAppointments==true)
                    .Select(d => new DoctorBookinDto
                    {
                        userId = d.UserId,
                        DoctorId = d.Id,
                        DoctorName = d.User.FullName,
                        specializationCode = d.Specialization.Code,
                        specialization = d.Specialization.Name,
                        AvatarUrl = d.User.AvatarUrl,
                        educationcode = d.Education,
                        Education = DoctorDegree.GetDescription(d.Education),
                        Experience = d.YearsOfExperience.ToString(),
                        price = d.ConsultationFee,
                        bio = d.Bio,
                        rating = d.AverageRating,
                        TotalDone = _context.Appointments.Count(a => a.DoctorId == d.Id && a.StatusCode == "Completed" && a.PaymentStatusCode == "Paid"),
                        TotalAppointments = _context.Appointments.Count(a => a.DoctorId == d.Id),

                        TotalReviews = _context.Reviews.Count(r => r.Appointment.DoctorId == d.Id)
                    })
                    .ToListAsync();

                // Tạo PaginatedListDto
                var paginatedDoctors = new PaginatedListDto<DoctorBookinDto>(
                    doctors,
                    queryParams.PageNumber,
                    queryParams.PageSize,
                    totalCount
                );

                // Thêm vào kết quả
                result.Add(new EducationWithPaginatedDoctorsDto
                {
                    EducationCode = educationType.Code,
                    Education = educationType.Description,
                    Description = educationType.Description,
                    Doctors = paginatedDoctors
                });
            }

            return result;
        }

        public async Task<List<Doctor>> GetAllAsync()
            => await _doctorRepository.GetAllAsync();

        public async Task<Doctor?> GetDoctorByIdAsync(Guid id) => await _doctorRepository.GetDoctorByIdAsync(id);

        public async Task CheckAndBanDoctors()
        {
            var doctors = await _doctorRepository.GetAllAsync();
            // Only operate on verified doctors
            var verifiedDoctors = doctors.Where(d => d.IsVerified).ToList();

            int salaryDeductionCount = 0;
            int bannedCount = 0;
            int permanentBannedCount = 0;

            foreach (var doctor in verifiedDoctors)
            {
                // use one transaction per doctor so a failure for one doesn't affect others
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    bool updated = false;
                    var misses = doctor.TotalCaseMissPerWeek.GetValueOrDefault(0);

                
                    if (misses == 3)
                    {
                        doctor.NextWeekMiss = 1;
                        updated = true;
                    }

                  
                    if (misses == 2 && !doctor.isSalaryDeduction.GetValueOrDefault(false))
                    {
                        doctor.isSalaryDeduction = true;
                        salaryDeductionCount++;
                        updated = true;
                    }

                    if (misses >= 3)
                    {
                        var nextMonday = GetNextMonday(DateTime.UtcNow);
                   
                        var nextSundayEnd = nextMonday.AddDays(6).Date.AddHours(23).AddMinutes(59).AddSeconds(59);

                        doctor.StartDateBanned = nextMonday;
                        doctor.TotalBanned = (doctor.TotalBanned ?? 0) + 1;
                        bannedCount++;
                        updated = true;

                       
                        if (doctor.TotalBanned >= 2)
                        {
                            doctor.EndDateBanned = DateTime.UtcNow.AddYears(100);
                            doctor.IsAcceptingAppointments = false;
                            permanentBannedCount++;
                        }
                        else
                        {
                            doctor.EndDateBanned = nextSundayEnd;
                            doctor.IsAcceptingAppointments = false;
                        }
                    }

                    if (updated)
                    {
                        doctor.UpdatedAt = DateTime.UtcNow;
                    }

               
                    doctor.TotalCaseMissPerWeek = 0;

                 
                    await _doctorRepository.UpdateDoctorAsync(doctor);
               
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                }
                catch
                {
                
                    await transaction.RollbackAsync();
                   
                }
            }

        }

        private DateTime GetNextMonday(DateTime now)
        {
            var daysUntilNextMonday = ((int)DayOfWeek.Monday - (int)now.DayOfWeek + 7) % 7;

            if (daysUntilNextMonday == 0)
            {
                daysUntilNextMonday = 7;
            }

            var nextMonday = now.Date.AddDays(daysUntilNextMonday);
            return nextMonday;
        }

        public async Task CheckAndUnbanDoctors()
        {
            var doctors = await _doctorRepository.GetAllAsync();
            var now = DateTime.UtcNow;

            // Doctors whose ban has ended (exclude "never banned" and permanent bans)
            var doctorsToUnban = doctors
                .Where(d => d.EndDateBanned.HasValue
                            && d.EndDateBanned.Value < now
                            && d.EndDateBanned.Value > DateTime.MinValue
                            && d.EndDateBanned.Value < DateTime.UtcNow.AddYears(50))
                .ToList();

            if (!doctorsToUnban.Any())
                return;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var doctor in doctorsToUnban)
                {
                    var oldEndDate = doctor.EndDateBanned;

                    if (doctor.NextWeekMiss.GetValueOrDefault() > 0)
                    {
                        doctor.TotalCaseMissPerWeek = 1; 
                    }

                    doctor.NextWeekMiss = 0;
                    doctor.StartDateBanned = DateTime.MinValue;
                    doctor.EndDateBanned = DateTime.MinValue;
                    doctor.IsAcceptingAppointments = true;
                    doctor.UpdatedAt = DateTime.UtcNow;

                 
                    await _doctorRepository.UpdateDoctorAsync(doctor);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // Updated: evaluate ALL doctors in DB (if count <= 0 return all; otherwise return top 'count')
        public async Task<List<TopDoctorPerformanceDto>> GetTopDoctorsByPerformanceAsync( double ratingWeight = 0.7, double successWeight = 0.3)
        {
            // Normalize weights
            var weightSum = ratingWeight + successWeight;
            if (weightSum <= 0)
            {
                ratingWeight = 0.7;
                successWeight = 0.3;
                weightSum = 1.0;
            }
            ratingWeight /= weightSum;
            successWeight /= weightSum;

            // Load all doctors (important: include doctors with no reviews/appointments)
            var doctors = await _doctorRepository.GetAllAsync();

            // Load reviews and appointments
            var reviews = await _reviewRepository.GetAllAsync();
            var appointments = (await _appointmentRepository.GetAllAsync()).ToList();

            // Group reviews by doctor id
            var reviewsByDoctor = reviews
                .Where(r => r.Appointment?.DoctorId != null)
                .GroupBy(r => r.Appointment.DoctorId)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        AvgRating = g.Any() ? g.Average(r => r.Rating) : 0.0,
                        ReviewCount = g.Count()
                    });

            // Group appointments by doctor id and count successes
            var successfulStatuses = Constants.SuccessfulAppointmentStatusCode;
            var apptsByDoctor = appointments
                .Where(a => a.DoctorId != Guid.Empty)
                .GroupBy(a => a.DoctorId)
                .ToDictionary(
                    g => g.Key,
                    g => new
                    {
                        Total = g.Count(),
                        Successful = g.Count(a => successfulStatuses.Contains(a.StatusCode))
                    });

            var results = new List<TopDoctorPerformanceDto>(doctors.Count);

            foreach (var doc in doctors)
            {
                var did = doc.Id;
                var avgRating = reviewsByDoctor.ContainsKey(did) ? reviewsByDoctor[did].AvgRating : 0.0;
                var reviewCount = reviewsByDoctor.ContainsKey(did) ? reviewsByDoctor[did].ReviewCount : 0;
                var totalCases = apptsByDoctor.ContainsKey(did) ? apptsByDoctor[did].Total : 0;
                var successfulCases = apptsByDoctor.ContainsKey(did) ? apptsByDoctor[did].Successful : 0;
                var successRate = totalCases > 0 ? (double)successfulCases / totalCases : 0.0;

                // Normalize rating into 0..1 (rating / 5)
                var normRating = Math.Max(0.0, Math.Min(5.0, avgRating)) / 5.0;

                // Composite score (0..1)
                var composite = (ratingWeight * normRating) + (successWeight * successRate);

                results.Add(new TopDoctorPerformanceDto
                {
                    DoctorId = did,
                    DoctorName = doc.User?.FullName ?? string.Empty,
                    Specialization = doc.Specialization?.Name ?? string.Empty,
                    AverageRating = Math.Round(avgRating, 2),
                    ReviewCount = reviewCount,
                    SuccessfulCases = successfulCases,
                    TotalCases = totalCases,
                    SuccessRate = Math.Round(successRate, 4),
                    CompositeScore = Math.Round(composite, 4),
                    ImageUrl = doc.User?.AvatarUrl,
                    ConsultationFee = doc.ConsultationFee

                });
            }

            // Order by composite score desc then by review count desc
            var ordered = results
                .OrderByDescending(r => r.CompositeScore)
                .ThenByDescending(r => r.ReviewCount);

        
           

            return ordered.ToList();
        }


        //public static string GetAcceptEmailBody(string newPassword, string fullName)
        //{
        //    return $@"
        //        <p>Bác sĩ {fullName} thân mến,</p>
        //        <p>Hồ sơ bác sĩ của bạn đã được phê duyệt thành công. Chúng tôi rất vui mừng được chào đón bạn đến với nền tảng Medix.</p>

        //        <p>Vui lòng sử dụng mật khẩu dưới đây để đăng nhập vào hệ thống:</p>

        //        <div style=""margin: 1em 0; padding: 1em; border-radius: 8px; background-color: #f0f4f8; border: 1px solid #d0d7de; box-shadow: 0 2px 6px rgba(0,0,0,0.05); font-family: 'Segoe UI', sans-serif;"">
        //          <label style=""display: block; font-weight: 600; font-size: 1.1em; color: #333; margin-bottom: 0.5em;"">
        //            🔐 Mật khẩu đăng nhập:
        //          </label>
        //          <div style=""display: inline-block; padding: 0.75em 1.5em; font-size: 1.4em; font-weight: bold; color: #2c3e50; background-color: #ffffff; border: 2px solid #4da6ff; border-radius: 6px; letter-spacing: 2px;"">
        //            {newPassword}
        //          </div>
        //        </div>

        //        <p>Vui lòng đổi mật khẩu sau khi đăng nhập để đảm bảo bảo mật thông tin cá nhân.</p>
        //        <p>Trân trọng,<br/>Đội ngũ Medix</p>
        //    ";
        //}

        //private static string GetRejectEmailBody(string reason, string fullName)
        //{
        //    return $@"
        //        <p>Bác sĩ {fullName} thân mến,</p>
        //        <p>Chúng tôi rất tiếc phải thông báo rằng hồ sơ bác sĩ của bạn chưa được phê duyệt. Sau khi xem xét kỹ lưỡng, chúng tôi nhận thấy hồ sơ của bạn hiện chưa đáp ứng đầy đủ các tiêu chuẩn cần thiết.</p>

        //        <p><strong>Lý do từ quản lý:</strong> {reason}</p>

        //        <p>Nếu bạn có bất kỳ thắc mắc nào hoặc không hài lòng với quyết định này, xin vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi. Trong trường hợp bạn muốn thử lại, vui lòng tiến hành đăng ký lại để cập nhật thông tin và hoàn thiện hồ sơ.</p>

        //        <p>Chân thành cảm ơn sự thông cảm của bạn.</p>
        //        <p>Trân trọng,<br/>Đội ngũ Medix</p>
        //    ";
        //}
    }
}
