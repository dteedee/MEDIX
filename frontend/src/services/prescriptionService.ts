import { apiClient } from '../lib/apiClient';
import { Prescription } from '../types/medicalRecord.types';

const API_ENDPOINT = '/Prescription';

/**
 * Tạo một đơn thuốc mới.
 * @param payload - Dữ liệu của đơn thuốc mới.
 * @returns {Promise<Prescription>} Đơn thuốc vừa được tạo.
 */
const createPrescription = async (payload: Omit<Prescription, 'id'>): Promise<Prescription> => {
  // Tách medicalRecordId ra khỏi payload để đưa vào URL
  const { medicalRecordId, ...restPayload } = payload;

  if (!medicalRecordId) {
    throw new Error("medicalRecordId is required to create a prescription.");
  }

  // Gửi request POST đến /api/Prescription/{medicalRecordId} với phần còn lại của payload
  const response = await apiClient.post<Prescription>(`${API_ENDPOINT}/${medicalRecordId}`, restPayload);
  return response.data;
};

export const prescriptionService = {
  createPrescription,
};