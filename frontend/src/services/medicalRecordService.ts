import { apiClient } from '../lib/apiClient';
import { MedicalRecord, MedicalRecordDetail, MedicalRecordDto, MedicalRecordQuery } from '../types/medicalRecord.types';

const API_ENDPOINT = '/MedicalRecord';


const getMedicalRecordByAppointmentId = async (appointmentId: string): Promise<MedicalRecord> => {
  const response = await apiClient.get<MedicalRecord>(`${API_ENDPOINT}/by-appointment/${appointmentId}`);
  return response.data;
};


const updateMedicalRecord = async (recordId: string, payload: MedicalRecord): Promise<MedicalRecord> => {
  const response = await apiClient.put<MedicalRecord>(API_ENDPOINT, payload);
  return response.data;
};

const getMedicalRecordsOfPatient = async (query: MedicalRecordQuery): Promise<MedicalRecordDto[]> => {
  const response = await apiClient.get<MedicalRecordDto[]>(`${API_ENDPOINT}/patient`, {
    params: {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    }
  });
  return response.data;
}

const getMedicalRecordDetails = async (id: string): Promise<MedicalRecordDetail> => {
  const response = await apiClient.get<MedicalRecordDetail>(`${API_ENDPOINT}/${id}`);
  return response.data;
};

export const medicalRecordService = {
  getMedicalRecordByAppointmentId,
  updateMedicalRecord,
  getMedicalRecordsOfPatient,
  getMedicalRecordDetails,
};