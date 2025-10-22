import { apiClient } from "../lib/apiClient";
import { DoctorProfileDetails, DoctorProfileDto, DoctorRegisterMetadata, ServiceTierWithPaginatedDoctorsDto, PaginationParams } from "../types/doctor.types";

class DoctorService {
    async getMetadata(): Promise<DoctorRegisterMetadata> {
        try {
            const response = await apiClient.get<DoctorRegisterMetadata>('/doctor/register-metadata');
            return response.data;
        }
        catch (error: any) {
            console.error('Get doctor register metadata error: ', error);
            throw this.handleApiError(error);
        }
    }

    async registerDoctor(payload: FormData): Promise<void> {
        console.log('Payload:', payload);
        await apiClient.postMultipart<any>('/doctor/register', payload);
    }

    async getDoctorProfile(userName: string | undefined): Promise<DoctorProfileDto> {
        try {
            const response = await apiClient.get<DoctorProfileDto>('doctor/profile/' + userName);
            return response.data;
        } catch (error: any) {
            console.error('Get doctor profile data error: ', error);
            throw this.handleApiError(error);
        }
    }

    async getDoctorProfileDetails(): Promise<DoctorProfileDetails> {
        try {
            const response = await apiClient.get<DoctorProfileDetails>('doctor/profile/details');
            return response.data;
        }
        catch (error: any) {
            console.error('Get doctor profile details error:', error);
            throw this.handleApiError(error);
        }
    }

    async updateDoctorProfile(payload: FormData): Promise<void> {
        await apiClient.put<any>('doctor/profile/update', payload);
    }

    async updateAvatar(payload: FormData): Promise<any> {
        const response = await apiClient.putMultipart<any>('doctor/profile/update-avatar', payload);
        return response.data;
    }

    async updatePassword(payload: FormData): Promise<any>{
        await apiClient.put('doctor/profile/update-password', payload);
    }

    async getDoctorsGroupedByTier(paginationParams: PaginationParams): Promise<ServiceTierWithPaginatedDoctorsDto[]> {
        try {
            const response = await apiClient.get<ServiceTierWithPaginatedDoctorsDto[]>('/booking/by-tier', {
                params: paginationParams
            });
            return response.data;
        } catch (error: any) {
            console.error('Get doctors grouped by tier error: ', error);
            throw this.handleApiError(error);
        }
    }

    private handleApiError(error: any): Error {
        if (error.response?.data) {
            const apiError = error.response.data;

            // Handle validation errors from backend
            if (apiError.errors) {
                const errorMessages = Object.entries(apiError.errors)
                    .flat()
                    .filter(msg => typeof msg === 'string')
                    .join(', ');
                return new Error(errorMessages || apiError.message || 'Validation error');
            }

            return new Error(apiError.message || 'API error occurred');
        }

        return new Error(error.message || 'Network error occurred');
    }
}

export default new DoctorService();