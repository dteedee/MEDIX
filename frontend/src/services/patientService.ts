import { apiClient } from "../lib/apiClient";
import { BasicEMRInfo, PatientHealthReminderDto } from "../types/patient.types";

export interface CompletePatientProfileRequest {
    fullName: string;
    phoneNumber: string;
    address?: string;
    dateOfBirth: string; // format: yyyy-MM-dd
    identificationNumber: string;
    genderCode: string;
    bloodTypeCode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    allergies?: string;
    medicalHistory?: string;
}

export interface UpdateUserDto {
    username?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    dob?: string; // format: yyyy-MM-dd (DateOnly on backend)
    identificationNumber?: string;
    genderCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    allergies?: string;
    medicalHistory?: string;
    bloodTypeCode?: string;
}

class PatientService {
    async getBasicEMRInfo(): Promise<BasicEMRInfo> {
        const response = await apiClient.get<BasicEMRInfo>(`/patient/basicEMRInfo`);
        return response.data;
    }

    async getReminders(code: string): Promise<PatientHealthReminderDto[]> {
        const response = await apiClient.get<PatientHealthReminderDto[]>(`/PatientHealthReminder/getReminder`, {
            params: { code }
        });
        return response.data;
    }

    async completeProfile(data: CompletePatientProfileRequest, userEmail: string): Promise<any> {
        // Chuyển đổi từ CompletePatientProfileRequest sang UpdateUserDto
        const updateDto: UpdateUserDto = {
            fullName: data.fullName,
            email: userEmail, // Gửi email hiện tại để tránh lỗi validation
            phoneNumber: data.phoneNumber,
            address: data.address,
            dob: data.dateOfBirth, // yyyy-MM-dd format
            identificationNumber: data.identificationNumber,
            genderCode: data.genderCode,
            bloodTypeCode: data.bloodTypeCode,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            allergies: data.allergies,
            medicalHistory: data.medicalHistory,
        };

        const response = await apiClient.put('/user/updateUserInfor', updateDto);
        return response.data;
    }

    async updateUserInfo(data: UpdateUserDto): Promise<any> {
        const response = await apiClient.put('/user/updateUserInfor', data);
        return response.data;
    }
}

export default new PatientService();

