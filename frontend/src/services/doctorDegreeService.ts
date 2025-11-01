import { apiClient } from "../lib/apiClient";
import { DoctorDegree } from "../types/education.types";

class DoctorDegreeService {
    async getAll(): Promise<DoctorDegree[]> {
        const response = await apiClient.get<DoctorDegree[]>('/education/doctor-degrees');
        return response.data;
    }
}

export default new DoctorDegreeService();