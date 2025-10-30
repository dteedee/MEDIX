import { apiClient } from "../lib/apiClient";
import { BasicEMRInfo } from "../types/patient.types";

class PatientService {
    async getBasicEMRInfo(): Promise<BasicEMRInfo> {
        const response = await apiClient.get<BasicEMRInfo>(`/patient/basicEMRInfo`);
        return response.data;
    }
}

export default new PatientService();

