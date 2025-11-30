import { apiClient } from '../lib/apiClient';
import { Prescription } from '../types/medicalRecord.types';

const API_ENDPOINT = '/Prescription';


const createPrescription = async (payload: Omit<Prescription, 'id'>): Promise<Prescription> => {
  const { medicalRecordId, ...restPayload } = payload;

  if (!medicalRecordId) {
    throw new Error("medicalRecordId is required to create a prescription.");
  }

  const response = await apiClient.post<Prescription>(`${API_ENDPOINT}/${medicalRecordId}`, restPayload);
  return response.data;
};

export const prescriptionService = {
  createPrescription,
};