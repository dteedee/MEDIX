import { apiClient } from "../lib/apiClient";
import { DoctorRegisterMetadata } from "../types/doctor.types";

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