import { ApiResponse, BloodTypeDTO} from '../types/common.types';
import { PatientRegistration } from '../types/auth.types';
import { apiClient } from '../lib/apiClient';






const registrationService = {
  checkEmailExists: async (email: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      const response = await apiClient.post('/register/checkEmailExist', email);
      
      const exists: boolean = response.data;
      
      return {
        success: true,
        data: { exists }
      };
      
    } catch (error) {
      
      return {
        success: false,
        data: { exists: false },
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra email'] }
      };
    }
  },

  checkIdNumberExists: async (idNumber: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      const response = await apiClient.post('/register/checkVNEIDExist', idNumber);
      
      const exists: boolean = response.data;
      
      return {
        success: true,
        data: { exists }
      };
      
    } catch (error) {
      
      return {
        success: false,
        data: { exists: false },
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra số CCCD/CMND'] }
      };
    }
  },

  getBloodTypes: async (): Promise<ApiResponse<BloodTypeDTO[]>> => {
    try {
      const response = await apiClient.get<BloodTypeDTO[]>('/register/getBloodTypes');
      
      const data: BloodTypeDTO[] = response.data;
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      
      return {
        success: false,
        data: [],
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách nhóm máu'] }
      };
    }
  },

  registerPatient: async (registrationData: PatientRegistration): Promise<ApiResponse<any>> => {
    try {
      
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


      const response = await apiClient.post('/register/registerPatient', payload);
      
      const result = response.data;
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      
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