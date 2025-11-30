import { apiClient } from '../lib/apiClient';
import { DoctorSchedule, CreateSchedulePayload, ScheduleOverride, CreateScheduleOverridePayload, DoctorScheduleOverrideDto } from '../types/schedule';

const API_ENDPOINT = '/doctor-schedules';


const getMySchedules = async (): Promise<DoctorSchedule[]> => {
  const response = await apiClient.get<DoctorSchedule[]>(`${API_ENDPOINT}/me`);
  return response.data;
};


const createSchedule = async (payload: CreateSchedulePayload): Promise<DoctorSchedule | null> => {
  const formattedPayload = {
    ...payload,
    startTime: payload.startTime.length === 5 ? `${payload.startTime}:00` : payload.startTime,
    endTime: payload.endTime.length === 5 ? `${payload.endTime}:00` : payload.endTime,
  };
  const response = await apiClient.post<DoctorSchedule[]>(`${API_ENDPOINT}/me`, [formattedPayload]);
  if (response.data && response.data.length > 0) {
    return response.data[0]; 
  }
  return null; 
};


const updateSchedule = async (scheduleId: string, payload: CreateSchedulePayload): Promise<DoctorSchedule> => {
  const formattedTimePayload = {
    ...payload,
    startTime: payload.startTime.length === 5 ? `${payload.startTime}:00` : payload.startTime,
    endTime: payload.endTime.length === 5 ? `${payload.endTime}:00` : payload.endTime,
  };

  const updatePayload = {
    ...formattedTimePayload,
    id: scheduleId,
  };

  const response = await apiClient.put<DoctorSchedule>(`${API_ENDPOINT}/me/${scheduleId}`, updatePayload);
  return response.data;
};


const deleteSchedule = async (scheduleId: string): Promise<void> => {
  const payload = [scheduleId];
  await apiClient.delete(`${API_ENDPOINT}/me`, { data: payload });
};


const getMyScheduleOverrides = async (): Promise<ScheduleOverride[]> => {
  const response = await apiClient.get<ScheduleOverride[]>('/doctor-schedule-overrides/me');
  return response.data;
};

const OVERRIDE_API_ME = '/doctor-schedule-overrides/me';
const OVERRIDE_API_MY = '/doctor-schedule-overrides/my'; 


const createScheduleOverride = async (payload: CreateScheduleOverridePayload): Promise<ScheduleOverride> => {
  const response = await apiClient.post<ScheduleOverride>(OVERRIDE_API_MY, payload);
  return response.data;
};


const updateScheduleOverride = async (overrideId: string, payload: CreateScheduleOverridePayload): Promise<ScheduleOverride> => {
  const updateDto = {
    id: overrideId, 
    ...payload,
  };
  const response = await apiClient.put<ScheduleOverride[]>(OVERRIDE_API_ME, [updateDto]);
  return response.data[0]; 
};


const deleteScheduleOverride = async (overrideId: string): Promise<void> => {
  await apiClient.delete(`/doctor-schedule-overrides/${overrideId}`);
};


const getScheduleOverridesByDoctor = async (doctorId: string): Promise<DoctorScheduleOverrideDto[]> => {
  const response = await apiClient.get<DoctorScheduleOverrideDto[]>(`/doctor-schedule-overrides/doctor/${doctorId}`);
  return response.data;
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
  getScheduleOverridesByDoctor,
};
