import { apiClient } from '../lib/apiClient';
import { DoctorSchedule, CreateSchedulePayload } from '../types/schedule';

const API_ENDPOINT = '/DoctorSchedule';

/**
 * Lấy danh sách lịch làm việc của bác sĩ đã đăng nhập.
 * @returns {Promise<DoctorSchedule[]>} Danh sách lịch làm việc.
 */
const getMySchedules = async (): Promise<DoctorSchedule[]> => {
  const response = await apiClient.get<DoctorSchedule[]>(API_ENDPOINT);
  return response.data;
};

/**
 * Tạo một lịch làm việc mới cho bác sĩ đã đăng nhập.
 * @param {CreateSchedulePayload} payload - Dữ liệu của lịch làm việc mới.
 * @returns {Promise<DoctorSchedule>} Lịch làm việc vừa được tạo.
 */
const createSchedule = async (payload: CreateSchedulePayload): Promise<DoctorSchedule> => {
  const response = await apiClient.post<DoctorSchedule>(API_ENDPOINT, payload);
  return response.data;
};

export const scheduleService = {
  getMySchedules,
  createSchedule,
};
