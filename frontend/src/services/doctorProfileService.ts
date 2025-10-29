import { apiClient } from "../lib/apiClient";
import { DoctorQuery, DoctorRegisterFormDetails, DoctorRegisterFormList } from "../types/doctor.types";

class DoctorProfileService {
    async getAll(query: DoctorQuery): Promise<DoctorRegisterFormList> {
        const token = apiClient.getToken();
        const response = await apiClient.get<DoctorRegisterFormList>('/doctorRegistrationForm', {
            params: {
                page: query.page,
                searchTerm: query.searchTerm,
                pageSize: query.pageSize,
            },
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
            },
        });
        return response.data;
    }

    async getDetails(id: string): Promise<DoctorRegisterFormDetails> {
        const response = await apiClient.get<DoctorRegisterFormDetails>(`/doctorProfile/${id}`);
        return response.data;
    }

    async reviewProfile(payload: any, id: string): Promise<void> {
        await apiClient.put<any>(`doctorProfile/review/${id}`, payload);
    }
}

export default new DoctorProfileService();