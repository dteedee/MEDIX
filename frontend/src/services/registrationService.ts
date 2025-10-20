// src/services/patientRegistrationApiService.ts
import { ApiResponse, BloodTypeDTO} from '../types/common.types';
import { PatientRegistration } from '../types/auth.types';
import { apiClient } from '../lib/apiClient';






const registrationService = {
  // Kiểm tra email đã tồn tại chưa
  checkEmailExists: async (email: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      console.log('Checking email exists:', email);
      const response = await apiClient.post('/register/checkEmailExist', email);
      
      // API trả về boolean trực tiếp
      const exists: boolean = response.data;
      console.log('Email exists result:', exists);
      
      return {
        success: true,
        data: { exists }
      };
      
    } catch (error) {
      console.error('Error checking email:', error);
      
      return {
        success: false,
        data: { exists: false },
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra email'] }
      };
    }
  },

  // Kiểm tra số CCCD/CMND đã tồn tại chưa
  checkIdNumberExists: async (idNumber: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      console.log('Checking ID number exists:', idNumber);
      const response = await apiClient.post('/register/checkVNEIDExist', idNumber);
      
      // API trả về boolean trực tiếp
      const exists: boolean = response.data;
      console.log('ID number exists result:', exists);
      
      return {
        success: true,
        data: { exists }
      };
      
    } catch (error) {
      console.error('Error checking ID number:', error);
      
      return {
        success: false,
        data: { exists: false },
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra số CCCD/CMND'] }
      };
    }
  },

  // Lấy danh sách nhóm máu
  getBloodTypes: async (): Promise<ApiResponse<BloodTypeDTO[]>> => {
    try {
      console.log('Fetching blood types...');
      const response = await apiClient.get<BloodTypeDTO[]>('/register/getBloodTypes');
      
      const data: BloodTypeDTO[] = response.data;
      console.log('Blood types fetched successfully:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('Error fetching blood types:', error);
      
      return {
        success: false,
        data: [],
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách nhóm máu'] }
      };
    }
  },

  // Đăng ký bệnh nhân
  registerPatient: async (registrationData: PatientRegistration): Promise<ApiResponse<any>> => {
    try {
      console.log('Registering patient with data:', registrationData);
      
      // Transform frontend data to match backend DTO structure
      const payload = {
        registerRequest: {
          email: registrationData.registerRequest.email,
          password: registrationData.registerRequest.password,
          passwordConfirmation: registrationData.registerRequest.passwordConfirmation,
          fullName: registrationData.registerRequest.fullName,
          phoneNumber: registrationData.registerRequest.phoneNumber,
          address: registrationData.registerRequest.address,
          dateOfBirth: registrationData.registerRequest.dateOfBirth,
          identificationNumber: registrationData.registerRequest.identificationNumber,
          genderCode: registrationData.registerRequest.genderCode
        },
        patientDTO: {
          bloodTypeCode: registrationData.patientDTO.bloodTypeCode,
          medicalHistory: registrationData.patientDTO.medicalHistory,
          allergies: registrationData.patientDTO.allergies,
          emergencyContactName: registrationData.patientDTO.emergencyContactName,
          emergencyContactPhone: registrationData.patientDTO.emergencyContactPhone,
          isActive: true
        }
      };

      console.log('Sending registration payload:', payload);

      const response = await apiClient.post('/register/registerPatient', payload);
      
      const result = response.data;
      console.log('Patient registration successful:', result);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      console.error('Error registering patient:', error);
      
      return {
        success: false,
        data: null,
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng ký tài khoản'] }
      };
    }
  }
};

export default registrationService;
export type { BloodTypeDTO };