// src/services/patientRegistrationApiService.ts
import { ApiResponse, BloodTypeDTO, FormData, PatientDTO, RegisterDTO, RegistrationPayload, AuthResponseDto } from '../types/registrationTypes';

// Get API base URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:58213' ;


// Helper function để build full URL
const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Convert FormData thành RegisterDTO và PatientDTO để gửi lên server
const convertFormDataToRegisterDTO = (formData: FormData): RegisterDTO => {
  // Convert gender string to code
  let genderCode: string | undefined;
  if (formData.gender === 'male') genderCode = 'Male';
  else if (formData.gender === 'female') genderCode = 'Female';
  else if (formData.gender === 'other') genderCode = 'Other';

  return {
    Email: formData.email,
    Password: formData.password,
    FullName: formData.fullname,
    PhoneNumber: formData.phoneNumber || undefined,
    DateOfBirth: formData.dateOfBirth || undefined,
    IdentificationNumber: formData.identificationNumber || undefined,
    GenderCode: genderCode
  };
};

const convertFormDataToPatientDTO = (formData: FormData): PatientDTO => {
  return {
    BloodTypeCode: formData.bloodType || undefined,
    MedicalHistory: formData.chronicDiseases || undefined,
    Allergies: formData.allergies || undefined,
    EmergencyContactName: formData.emergencyContactName || undefined,
    EmergencyContactPhone: formData.emergencyPhoneNumber || undefined,
    InsuranceProvider: undefined, // Không có trong form hiện tại
    InsurancePolicyNumber: undefined, // Không có trong form hiện tại
    IsActive: true // Mặc định active khi đăng ký mới
  };
};

// Service để đăng ký bệnh nhân
export const patientRegistrationApiService = {
  // Đăng ký bệnh nhân mới - gửi cả RegisterDTO và PatientDTO
  registerPatient: async (formData: FormData): Promise<ApiResponse<AuthResponseDto>> => {
    try {
      const registerDTO = convertFormDataToRegisterDTO(formData);
      const patientDTO = convertFormDataToPatientDTO(formData);
      
      // Payload gửi lên server theo đúng format backend
      const payload: RegistrationPayload = {
        RegisterDTo: registerDTO,  // Đúng property name như backend
        PatientDTO: patientDTO     // Đúng property name như backend
      };
      
      console.log('Sending registration payload:', payload);
      console.log('API URL:', buildApiUrl('/api/register/registerPatient'));

      const response = await fetch(buildApiUrl('/api/register/registerPatient'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

  const data: AuthResponseDto = await response.json();
      
      return {
        success: true,
        message: 'Đăng ký thành công!',
        data
      };
      
    } catch (error) {
      console.error('Error registering patient:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đăng ký'
      };
    }
  },

  // Kiểm tra email đã tồn tại chưa
  checkEmailExists: async (email: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      console.log('Checking email exists:', email);
      const response = await fetch(buildApiUrl('/register/checkEmailExist'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // API trả về boolean trực tiếp
      const exists: boolean = await response.json();
      console.log('Email exists result:', exists);
      
      return {
        success: true,
        data: { exists }
      };
      
    } catch (error) {
      console.error('Error checking email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra email'
      };
    }
  },

  // Kiểm tra số CCCD/CMND đã tồn tại chưa
  checkIdNumberExists: async (idNumber: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      console.log('Checking ID number exists:', idNumber);
      const response = await fetch(buildApiUrl('/api/register/checkVNEIDExist'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(idNumber)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // API trả về boolean trực tiếp
      const exists: boolean = await response.json();
      console.log('ID number exists result:', exists);
      
      return {
        success: true,
        data: { exists }
      };
      
    } catch (error) {
      console.error('Error checking ID number:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra số CCCD/CMND'
      };
    }
  },

  // Lấy danh sách nhóm máu
  getBloodTypes: async (): Promise<ApiResponse<BloodTypeDTO[]>> => {
    try {
      console.log('Fetching blood types from:', buildApiUrl('/api/register/getBloodTypes'));
      const response = await fetch(buildApiUrl('/api/register/getBloodTypes'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data: BloodTypeDTO[] = await response.json();
      console.log('Blood types fetched successfully:', data);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('Error fetching blood types:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách nhóm máu'
      };
    }
  }
};

export type { BloodTypeDTO };