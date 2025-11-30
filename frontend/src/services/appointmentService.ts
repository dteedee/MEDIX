import { apiClient } from '../lib/apiClient';
import { Appointment, CreateAppointmentDto } from '../types/appointment.types';

const API_ENDPOINT = '/Appointment';


const getMyDayAppointments = async (dateString: string): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>(`${API_ENDPOINT}/my-day-appointments?date=${dateString}`);
  return response.data;
};


const getMyAppointmentsByDateRange = async (startDate: string, endDate: string): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>(
    `${API_ENDPOINT}/my-appointments-by-range?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};


const createAppointment = async (dto: CreateAppointmentDto): Promise<Appointment> => {
  const response = await apiClient.post<Appointment>(`${API_ENDPOINT}/appointment-Booking`, dto);
  return response.data;
};


const getPatientAppointments = async (): Promise<Appointment[]> => {
  const response = await apiClient.get<Appointment[]>(`${API_ENDPOINT}/patient-appointments`);
  return response.data;
};


const cancelPatientAppointment = async (appointmentId: string, cancellationReason?: string): Promise<any> => {
  const response = await apiClient.patch(`${API_ENDPOINT}/cancel-patient-appointments`, {
    appointmentId,
    cancellationReason
  });
  return response.data;
};


const completeAppointment = async (appointmentId: string): Promise<Appointment> => {
  const response = await apiClient.put<Appointment>(`${API_ENDPOINT}/Complete/${appointmentId}/Completed`);
  return response.data;
};


const updateStatus = async (appointmentId: string, status: string): Promise<any> => {
  const response = await apiClient.put(`${API_ENDPOINT}/UpdateStatus/${appointmentId}/${status}`);
  return response.data;
};

export const appointmentService = {
  getMyDayAppointments,
  getMyAppointmentsByDateRange,
  createAppointment,
  getPatientAppointments,
  cancelPatientAppointment,
  completeAppointment,
  updateStatus,
};