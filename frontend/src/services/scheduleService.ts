import { apiClient } from '../lib/apiClient';
import { DoctorSchedule, CreateSchedulePayload } from '../types/schedule';
import DoctorService from './doctorService'; // Import doctorService

const API_ENDPOINT = '/doctor-schedules';

/**
 * Lấy danh sách lịch làm việc của bác sĩ đã đăng nhập.
 * @returns {Promise<DoctorSchedule[]>} Danh sách lịch làm việc.
 */
const getMySchedules = async (): Promise<DoctorSchedule[]> => {
  // API endpoint đã thay đổi để lấy lịch của bác sĩ đang đăng nhập
  const response = await apiClient.get<DoctorSchedule[]>(`${API_ENDPOINT}/me`);
  return response.data;
};

/**
 * Tạo một lịch làm việc mới cho bác sĩ đã đăng nhập.
 * @param {CreateSchedulePayload} payload - Dữ liệu của lịch làm việc mới.
 * @returns {Promise<DoctorSchedule>} Lịch làm việc vừa được tạo.
 */
const createSchedule = async (payload: CreateSchedulePayload): Promise<DoctorSchedule | null> => {
  // Đảm bảo thời gian luôn có định dạng HH:mm:ss để tương thích với System.TimeOnly của .NET
  const formattedPayload = {
    ...payload,
    startTime: payload.startTime.length === 5 ? `${payload.startTime}:00` : payload.startTime,
    endTime: payload.endTime.length === 5 ? `${payload.endTime}:00` : payload.endTime,
  };
  // Backend mong đợi một mảng các lịch làm việc.
  // API trả về một mảng chứa lịch vừa tạo
  const response = await apiClient.post<DoctorSchedule[]>(`${API_ENDPOINT}/me`, [formattedPayload]);
  if (response.data && response.data.length > 0) {
    return response.data[0]; // Trả về lịch đầu tiên trong mảng
  }
  return null; // Hoặc throw lỗi nếu API không trả về gì
};

/**
 * Cập nhật một lịch làm việc đã có.
 * @param {string} scheduleId - ID của lịch làm việc cần cập nhật.
 * @param {CreateSchedulePayload} payload - Dữ liệu cập nhật.
 * @returns {Promise<DoctorSchedule>} Lịch làm việc đã được cập nhật.
 */
const updateSchedule = async (scheduleId: string, payload: CreateSchedulePayload): Promise<DoctorSchedule> => {
  // Đảm bảo thời gian luôn có định dạng HH:mm:ss
  const formattedTimePayload = {
    ...payload,
    startTime: payload.startTime.length === 5 ? `${payload.startTime}:00` : payload.startTime,
    endTime: payload.endTime.length === 5 ? `${payload.endTime}:00` : payload.endTime,
  };

  // Lấy DoctorId từ profile của bác sĩ đang đăng nhập
  const doctorProfile = await DoctorService.getDoctorProfileDetails();
  // Giả định rằng doctorProfile có trường `id` là DoctorId
  const doctorId = (doctorProfile as any).id; 

  // Gửi một mảng chứa đối tượng lịch làm việc cần cập nhật.
  // Điều này nhất quán với các phương thức API khác trên cùng endpoint.
  const updatePayload = [{ ...formattedTimePayload, id: scheduleId, doctorId: doctorId }];

  // API có thể trả về một mảng chứa đối tượng đã được cập nhật.
  const response = await apiClient.put<DoctorSchedule[]>(`${API_ENDPOINT}/me`, updatePayload);
  if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  throw new Error("Cập nhật lịch làm việc không thành công hoặc không có dữ liệu trả về.");
};

/**
 * Xóa một lịch làm việc.
 * @param {string} scheduleId - ID của lịch làm việc cần xóa.
 * @returns {Promise<void>}
 */
const deleteSchedule = async (scheduleId: string): Promise<void> => {
  // API xóa có thể yêu cầu ID trong body hoặc params, gửi trong body là một cách tiếp cận phổ biến cho endpoint /me
  // Gửi một mảng chứa đối tượng có ID để nhất quán với các phương thức khác
  await apiClient.delete(`${API_ENDPOINT}/me`, { data: [{ id: scheduleId }] });
};

export const scheduleService = {
  getMySchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
