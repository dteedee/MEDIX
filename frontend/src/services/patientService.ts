import { apiClient } from "../lib/apiClient";
import { BasicEMRInfo, PatientHealthReminderDto } from "../types/patient.types";

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
}

export default new PatientService();

