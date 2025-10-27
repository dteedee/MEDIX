import { apiClient } from "../lib/apiClient";
import { DoctorProfileQuery, DoctorRegisterProfileDetails, DoctorRegisterProfileList } from "../types/doctor.types";

class DoctorProfileService {
    async getAll(query: DoctorProfileQuery): Promise<DoctorRegisterProfileList> {
        const token = apiClient.getToken();
        const response = await apiClient.get<DoctorRegisterProfileList>('/doctorProfile', {
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

    async getDetails(id: string): Promise<DoctorRegisterProfileDetails>{
        const response = await apiClient.get<DoctorRegisterProfileDetails>(`/doctorProfile/${id}`);
        return response.data;
    }

    async reviewProfile(payload: any, id: string) : Promise<void>{
        await apiClient.put<any>(`doctorProfile/review/${id}`, payload);
    }
}

export default new DoctorProfileService();