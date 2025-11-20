﻿using AutoMapper;
using Medix.API.Business.Interfaces.Classification;
using Medix.API.DataAccess.Interfaces.Classification;
using Medix.API.Models.DTOs.ReviewDTO;
using Medix.API.Models.Entities;

namespace Medix.API.Business.Services.Classification
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepo;
        private readonly IAppointmentRepository _appointmentRepo;
        private readonly IMapper _mapper;

        public ReviewService(
            IReviewRepository reviewRepo,
            IAppointmentRepository appointmentRepo,
            IMapper mapper)
        {
            _reviewRepo = reviewRepo;
            _appointmentRepo = appointmentRepo;
            _mapper = mapper;
        }

        public async Task<ReviewDoctorDto?> GetByAppointmentIdAsync(Guid appointmentId)
        {
            var review = await _reviewRepo.GetByAppointmentIdAsync(appointmentId);
            if (review == null)
                return null;

            var dto = _mapper.Map<ReviewDoctorDto>(review);
            dto.DoctorId = review.Appointment.DoctorId;
            dto.DoctorName = review.Appointment.Doctor.User.FullName;
            dto.PatientName = review.Appointment.Patient.User.FullName;
            dto.AppointmentStartTime = review.Appointment.AppointmentStartTime;
            dto.AppointmentEndTime = review.Appointment.AppointmentEndTime;
            return dto;
        }

        public async Task<ReviewDoctorDto> CreateAsync(CreateReviewDto dto)
        {
            var appointment = await _appointmentRepo.GetByIdAsync(dto.AppointmentId);
            if (appointment == null)
                throw new Exception("Không tìm thấy cuộc hẹn.");

            var existing = await _reviewRepo.GetByAppointmentIdAsync(dto.AppointmentId);
            if (existing != null)
                throw new Exception("Đánh giá cho cuộc hẹn này đã tồn tại.");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                AppointmentId = dto.AppointmentId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                Status = "PUBLISHED",
                AdminResponse = "Thanks for your feedback!",
                CreatedAt = DateTime.UtcNow
            };

            await _reviewRepo.AddAsync(review);
            await _reviewRepo.SaveChangesAsync();

            var result = _mapper.Map<ReviewDoctorDto>(review);
            result.DoctorId = appointment.DoctorId;
            result.DoctorName = appointment.Doctor.User.FullName;
            result.PatientName = appointment.Patient.User.FullName;
            result.AppointmentStartTime = appointment.AppointmentStartTime;
            result.AppointmentEndTime = appointment.AppointmentEndTime;
            return result;
        }

        public async Task<ReviewDoctorDto> UpdateAsync(UpdateReviewDto dto)
        {
            var review = await _reviewRepo.GetByAppointmentIdAsync(dto.AppointmentId);
            if (review == null)
                throw new Exception("Không tìm thấy đánh giá để cập nhật.");

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;
            review.CreatedAt = DateTime.UtcNow;

            await _reviewRepo.UpdateAsync(review);
            await _reviewRepo.SaveChangesAsync();

            var result = _mapper.Map<ReviewDoctorDto>(review);
            result.DoctorId = review.Appointment.DoctorId;
            result.DoctorName = review.Appointment.Doctor.User.FullName;
            result.PatientName = review.Appointment.Patient.User.FullName;
            result.AppointmentStartTime = review.Appointment.AppointmentStartTime;
            result.AppointmentEndTime = review.Appointment.AppointmentEndTime;
            return result;
        }

        public async Task DeleteAsync(Guid appointmentId)
        {
            var review = await _reviewRepo.GetByAppointmentIdAsync(appointmentId);
            if (review == null)
                throw new Exception("Không tìm thấy đánh giá để xóa.");

            await _reviewRepo.DeleteAsync(review);
            await _reviewRepo.SaveChangesAsync();
        }

        public async Task<List<ReviewDoctorDto>> GetByDoctorIdAsync(Guid doctorId)
        {
            var reviews = await _reviewRepo.GetReviewsByDoctorAsync(doctorId);
            var result = _mapper.Map<List<ReviewDoctorDto>>(reviews);

            foreach (var r in result)
            {
                var entity = reviews.First(x => x.Id == r.Id);
                r.DoctorId = entity.Appointment.DoctorId;
                r.DoctorName = entity.Appointment.Doctor.User.FullName;
                r.PatientName = entity.Appointment.Patient.User.FullName;
                r.AppointmentStartTime = entity.Appointment.AppointmentStartTime;
                r.AppointmentEndTime = entity.Appointment.AppointmentEndTime;
            }

            return result;
        }
        public async Task<List<ReviewDoctorDto>> GetByDoctorUserIdAsync(Guid userId)
        {
            var reviews = await _reviewRepo.GetReviewsByDoctorUserIdAsync(userId);
            if (reviews == null || !reviews.Any())
                return new List<ReviewDoctorDto>();

            var result = _mapper.Map<List<ReviewDoctorDto>>(reviews);

            foreach (var r in result)
            {
                var entity = reviews.First(x => x.Id == r.Id);
                r.DoctorId = entity.Appointment.DoctorId;
                r.DoctorName = entity.Appointment.Doctor.User.FullName;
                r.PatientName = entity.Appointment.Patient.User.FullName;
                r.AppointmentStartTime = entity.Appointment.AppointmentStartTime;
                r.AppointmentEndTime = entity.Appointment.AppointmentEndTime;
            }

            return result;
        }

        public async Task<List<ReviewDoctorDto>> GetAllAsync()
        {
            var reviews = await _reviewRepo.GetAllAsync();
            if (reviews == null || !reviews.Any())
                return new List<ReviewDoctorDto>();

            var result = _mapper.Map<List<ReviewDoctorDto>>(reviews);

            foreach (var r in result)
            {
                var entity = reviews.First(x => x.Id == r.Id);
                r.DoctorId = entity.Appointment.DoctorId;
                r.DoctorName = entity.Appointment.Doctor.User.FullName;
                r.PatientName = entity.Appointment.Patient.User.FullName;
                r.AppointmentStartTime = entity.Appointment.AppointmentStartTime;
                r.AppointmentEndTime = entity.Appointment.AppointmentEndTime;
            }

            return result;
        }

    }
}
