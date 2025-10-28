import { apiClient } from "../lib/apiClient";
import { DoctorRegisterMetadata } from "../types/doctor.types";

class DoctorRegistrationFormService {
    async getMetadata(): Promise<DoctorRegisterMetadata> {
        const response = await apiClient.get<DoctorRegisterMetadata>('/doctorRegistrationForm/register-metadata');
        return response.data;
    }

    async registerDoctor(payload: FormData): Promise<void> {
        console.log('Payload:', payload);
        await apiClient.postMultipart<any>('/doctorRegistrationForm/register', payload);
    }
}

export default new DoctorRegistrationFormService();