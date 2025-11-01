import { apiClient } from '../lib/apiClient';
import { MedicalRecord, MedicalRecordDetail, MedicalRecordDto, MedicalRecordQuery } from '../types/medicalRecord.types';

const API_ENDPOINT = '/MedicalRecord';

/**
 * Lấy hồ sơ bệnh án dựa trên ID cuộc hẹn.
 * @param appointmentId - ID của cuộc hẹn.
 * @returns {Promise<MedicalRecord>} Hồ sơ bệnh án.
 */
const getMedicalRecordByAppointmentId = async (appointmentId: string): Promise<MedicalRecord> => {
  const response = await apiClient.get<MedicalRecord>(`${API_ENDPOINT}/by-appointment/${appointmentId}`);
  return response.data;
};

/**
 * Cập nhật hồ sơ bệnh án.
 * @param recordId - ID của hồ sơ bệnh án.
 * @param payload - Dữ liệu cập nhật.
 * @returns {Promise<MedicalRecord>} Hồ sơ bệnh án đã được cập nhật.
 */
const updateMedicalRecord = async (recordId: string, payload: MedicalRecord): Promise<MedicalRecord> => {
  // API cập nhật không cần ID trong URL, nó lấy ID từ payload.
  // Đảm bảo payload chứa 'id' của medical record.
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