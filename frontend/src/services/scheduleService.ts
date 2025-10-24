import { apiClient } from '../lib/apiClient';
import { DoctorSchedule, CreateSchedulePayload, ScheduleOverride, CreateScheduleOverridePayload } from '../types/schedule';

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

  // Backend yêu cầu ID phải có trong cả URL và trong body của request.
  const updatePayload = {
    ...formattedTimePayload,
    id: scheduleId,
  };

  // API trả về một đối tượng duy nhất, không phải mảng.
  const response = await apiClient.put<DoctorSchedule>(`${API_ENDPOINT}/me/${scheduleId}`, updatePayload);
  return response.data;
};

/**
 * Xóa một lịch làm việc.
 * @param {string} scheduleId - ID của lịch làm việc cần xóa.
 * @returns {Promise<void>}
 */
const deleteSchedule = async (scheduleId: string): Promise<void> => {
  // Backend mong đợi một mảng các chuỗi ID trong body của request DELETE
  const payload = [scheduleId];
  await apiClient.delete(`${API_ENDPOINT}/me`, { data: payload });
};

/**
 * Lấy danh sách lịch làm việc linh hoạt (tăng ca/nghỉ) của bác sĩ đã đăng nhập.
 * @returns {Promise<ScheduleOverride[]>} Danh sách các lịch linh hoạt.
 */
const getMyScheduleOverrides = async (): Promise<ScheduleOverride[]> => {
  const response = await apiClient.get<ScheduleOverride[]>('/doctor-schedule-overrides/me');
  return response.data;
};

const OVERRIDE_API_ME = '/doctor-schedule-overrides/me'; // Dùng cho GET, PUT, DELETE
const OVERRIDE_API_MY = '/doctor-schedule-overrides/my'; // Dùng cho POST (tạo mới)

/**
 * Tạo một lịch làm việc linh hoạt mới.
 * @param {CreateScheduleOverridePayload} payload - Dữ liệu của lịch linh hoạt mới.
 * @returns {Promise<ScheduleOverride>} Lịch linh hoạt vừa được tạo.
 */
const createScheduleOverride = async (payload: CreateScheduleOverridePayload): Promise<ScheduleOverride> => {
  // Lỗi 400 cho thấy backend mong đợi một đối tượng DTO duy nhất, không phải một mảng.
  const response = await apiClient.post<ScheduleOverride>(OVERRIDE_API_MY, payload);
  return response.data;
};

/**
 * Cập nhật một lịch làm việc linh hoạt.
 * @param {string} overrideId - ID của lịch cần cập nhật.
 * @param {CreateScheduleOverridePayload} payload - Dữ liệu cập nhật.
 * @returns {Promise<ScheduleOverride>} Lịch linh hoạt đã được cập nhật.
 */
const updateScheduleOverride = async (overrideId: string, payload: CreateScheduleOverridePayload): Promise<ScheduleOverride> => {
  // Backend mong đợi một mảng các DTOs, và ID của override nằm trong từng DTO.
  const updateDto = {
    id: overrideId, // Thêm ID vào payload
    ...payload,
  };
  const response = await apiClient.put<ScheduleOverride[]>(OVERRIDE_API_ME, [updateDto]);
  return response.data[0]; // API trả về một mảng, lấy phần tử đầu tiên.
};

/**
 * Xóa một lịch làm việc linh hoạt.
 * @param {string} overrideId - ID của lịch cần xóa.
 * @returns {Promise<void>}
 */
const deleteScheduleOverride = async (overrideId: string): Promise<void> => {
  // Lỗi 404 trên endpoint '/me/{id}' cho thấy nó không tồn tại.
  // Thử endpoint gốc '/doctor-schedule-overrides/{id}', một mẫu RESTful phổ biến.
  // Backend sẽ tự kiểm tra quyền sở hữu của bác sĩ đối với override này.
  await apiClient.delete(`/doctor-schedule-overrides/${overrideId}`);
};

export const scheduleService = {
  getMySchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getMyScheduleOverrides,
  createScheduleOverride,
  updateScheduleOverride,
  deleteScheduleOverride,
};
