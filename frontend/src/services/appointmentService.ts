import { apiClient } from '../lib/apiClient';
import { Appointment, CreateAppointmentDto } from '../types/appointment.types';

const API_ENDPOINT = '/Appointment';

/**
 * Lấy danh sách các cuộc hẹn của bác sĩ đã đăng nhập cho một ngày cụ thể.
 * @param dateString - Chuỗi ngày ở định dạng YYYY-MM-DD.
 * @returns {Promise<Appointment[]>} Danh sách các cuộc hẹn trong ngày.
 */
const getMyDayAppointments = async (dateString: string): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>(`${API_ENDPOINT}/my-day-appointments?date=${dateString}`);
  return response.data;
};

/**
 * Lấy danh sách các cuộc hẹn của bác sĩ đã đăng nhập trong một khoảng ngày.
 * @param startDate - Chuỗi ngày bắt đầu ở định dạng YYYY-MM-DD.
 * @param endDate - Chuỗi ngày kết thúc ở định dạng YYYY-MM-DD.
 * @returns {Promise<Appointment[]>} Danh sách các cuộc hẹn trong khoảng ngày.
 */
const getMyAppointmentsByDateRange = async (startDate: string, endDate: string): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>(
    `${API_ENDPOINT}/my-appointments-by-range?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};

/**
 * Tạo appointment mới (booking).
 * @param dto - Thông tin appointment cần tạo.
 * @returns {Promise<Appointment>} Appointment đã được tạo.
 */
const createAppointment = async (dto: CreateAppointmentDto): Promise<Appointment> => {
  const response = await apiClient.post<Appointment>(`${API_ENDPOINT}/appointment-Booking`, dto);
  return response.data;
};

export const appointmentService = {
  getMyDayAppointments,
  getMyAppointmentsByDateRange,
  createAppointment,
};