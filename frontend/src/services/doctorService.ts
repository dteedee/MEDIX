import { apiClient } from "../lib/apiClient";
import { DoctorProfileDetails, DoctorProfileDto, DoctorRegisterMetadata, ServiceTierWithPaginatedDoctorsDto, PaginationParams, DoctorTypeDegreeDto, DoctorQueryParameters } from "../types/doctor.types";

class DoctorService {
    async getMetadata(): Promise<DoctorRegisterMetadata> {
        const response = await apiClient.get<DoctorRegisterMetadata>('/doctor/register-metadata');
        return response.data;
    }

    async registerDoctor(payload: FormData): Promise<void> {
        console.log('Payload:', payload);
        await apiClient.postMultipart<any>('/doctor/register', payload);
    }

    async getDoctorProfile(doctorID: string | undefined): Promise<DoctorProfileDto> {
        try {
            const response = await apiClient.get<DoctorProfileDto>('/doctor/profile/' + doctorID);
            return response.data;
        } catch (error: any) {
            console.error('Get doctor profile data error: ', error);
            throw this.handleApiError(error);
        }
    }

    async getDoctorProfileDetails(): Promise<DoctorProfileDetails> {
        // apiClient automatically adds Authorization header
        const response = await apiClient.get<DoctorProfileDetails>('doctor/profile/details');
        return response.data;
    }

    async updateDoctorProfile(payload: FormData): Promise<void> {
        await apiClient.put<any>('doctor/profile/update', payload);
    }

    async updateAvatar(payload: FormData): Promise<any> {
        const response = await apiClient.putMultipart<any>('doctor/profile/update-avatar', payload);
        return response.data;
    }

    async updatePassword(payload: FormData): Promise<any> {
        await apiClient.put('doctor/profile/update-password', payload);
    }

    async getDoctorsGroupedByTier(queryParams: DoctorQueryParameters): Promise<ServiceTierWithPaginatedDoctorsDto[]> {
        try {
            const response = await apiClient.get<ServiceTierWithPaginatedDoctorsDto[]>('/booking/by-tier', {
                params: queryParams
            });
            return response.data;
        } catch (error: any) {
            console.error('Get doctors grouped by tier error: ', error);
            throw this.handleApiError(error);
        }
    }

    async getEducationTypes(): Promise<DoctorTypeDegreeDto[]> {
        try {
            const response = await apiClient.get<DoctorTypeDegreeDto[]>('/doctor/education-type');
            return response.data;
        } catch (error: any) {
            console.error('Get education types error: ', error);
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