import { apiClient } from "../lib/apiClient";
import { SpecializationDistributionDto, AppointmentTrendsDto, UserGrowthDto, ManagerDashboardSummaryDto, TopRatedDoctorDto } from "../types/dashboard.types";

class DashboardService {
    async getPopularSpecializations(): Promise<SpecializationDistributionDto[]> {
        try {
            const response = await apiClient.get<SpecializationDistributionDto[]>('/dashboard/specializations/popular');
            return response.data || [];
        } catch (error: any) {
            throw error;
        }
    }

    async getAppointmentTrends(doctorId?: string, year?: number): Promise<AppointmentTrendsDto> {
        try {
            const params = new URLSearchParams();
            if (doctorId) params.append('doctorId', doctorId);
            if (year) params.append('year', year.toString());
            
            const response = await apiClient.get<AppointmentTrendsDto>(
                `/dashboard/appointments/trends${params.toString() ? '?' + params.toString() : ''}`
            );
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async getUserGrowth(year?: number): Promise<UserGrowthDto> {
        try {
            const params = new URLSearchParams();
            if (year) params.append('year', year.toString());
            
            const response = await apiClient.get<UserGrowthDto>(
                `/dashboard/user-growth${params.toString() ? '?' + params.toString() : ''}`
            );
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async getSummary(): Promise<ManagerDashboardSummaryDto> {
        try {
            const response = await apiClient.get<ManagerDashboardSummaryDto>('/dashboard/summary');
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async getTopRatedDoctors(count: number = 3): Promise<TopRatedDoctorDto[]> {
        try {
            const response = await apiClient.get<TopRatedDoctorDto[]>(`/dashboard/top-doctors?count=${count}`);
            return response.data || [];
        } catch (error: any) {
            throw error;
        }
    }
}

export default new DashboardService();

