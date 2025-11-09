import { apiClient } from "../lib/apiClient";
import { DoctorSalary } from "../types/doctor.types";

class DoctorSalaryService {
    async getSalaries(): Promise<DoctorSalary[]>{
        const response = await apiClient.get<DoctorSalary[]>('doctorSalary');
        return response.data;
    }
}

export default new DoctorSalaryService();