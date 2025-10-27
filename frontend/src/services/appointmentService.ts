import { apiClient } from '../lib/apiClient';
import { Appointment } from '../types/appointment.types';

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

export const appointmentService = {
  getMyDayAppointments,
};