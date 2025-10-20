// src/services/patientRegistrationApiService.ts
import { ApiResponse, BloodTypeDTO} from '../types/common.types';

// Get API base URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5123';


// Helper function để build full URL
const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};






const registrationService = {
  // Kiểm tra email đã tồn tại chưa
  checkEmailExists: async (email: string): Promise<ApiResponse<{ exists: boolean }>> => {
    try {
      console.log('Checking email exists:', email);
      const response = await fetch(buildApiUrl('/api/register/checkEmailExist'), {
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
        data: { exists: false },
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra email'] }
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
        data: { exists: false },
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi kiểm tra số CCCD/CMND'] }
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
        data: [],
        errors: { general: [error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh sách nhóm máu'] }
      };
    }
  }
};

export default registrationService;
export type { BloodTypeDTO };