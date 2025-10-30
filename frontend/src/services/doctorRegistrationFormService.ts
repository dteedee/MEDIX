import { apiClient } from "../lib/apiClient";
import { DoctorQuery, DoctorRegisterFormDetails, DoctorRegisterFormList, DoctorRegisterMetadata } from "../types/doctor.types";

class DoctorRegistrationFormService {
    async getMetadata(): Promise<DoctorRegisterMetadata> {
        const response = await apiClient.get<DoctorRegisterMetadata>('/doctorRegistrationForm/register-metadata');
        return response.data;
    }

    async registerDoctor(payload: FormData): Promise<void> {
        console.log('Payload:', payload);
        await apiClient.postMultipart<any>('/doctorRegistrationForm/register', payload);
    }

    async getAll(query: DoctorQuery): Promise<DoctorRegisterFormList> {
        const response = await apiClient.get<DoctorRegisterFormList>('/doctorRegistrationForm', {
            params: {
                page: query.page,
                searchTerm: query.searchTerm,
                pageSize: query.pageSize,
            },
        });
        return response.data;
    }

    async getDetails(id: string): Promise<DoctorRegisterFormDetails> {
        const response = await apiClient.get<DoctorRegisterFormDetails>(`/doctorRegistrationForm/${id}`);
        return response.data;
    }

    async reviewProfile(payload: any, id: string): Promise<void> {
        await apiClient.post<any>(`doctorRegistrationForm/review/${id}`, payload);
    }
}

export default new DoctorRegistrationFormService();