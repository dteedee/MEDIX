import { apiClient } from "../lib/apiClient";

interface DoctorDashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  totalPatients: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
}

interface UpcomingAppointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  appointmentTime: string;
  appointmentDate: string;
  serviceType: string;
  status: string;
}

interface RecentPatient {
  id: string;
  name: string;
  avatar?: string;
  lastVisit: string;
  diagnosis: string;
  rating: number;
}

class DoctorDashboardService {
  async getDashboardStats(): Promise<DoctorDashboardStats> {
    try {
      const response = await apiClient.get<DoctorDashboardStats>('/doctor/dashboard/stats');
      return response.data;
    } catch (error: any) {
      console.error('Get doctor dashboard stats error: ', error);
      throw this.handleApiError(error);
    }
  }

  async getUpcomingAppointments(): Promise<UpcomingAppointment[]> {
    try {
      const response = await apiClient.get<UpcomingAppointment[]>('/doctor/dashboard/upcoming-appointments');
      return response.data;
    } catch (error: any) {
      console.error('Get upcoming appointments error: ', error);
      throw this.handleApiError(error);
    }
  }

  async getRecentPatients(): Promise<RecentPatient[]> {
    try {
      const response = await apiClient.get<RecentPatient[]>('/doctor/dashboard/recent-patients');
      return response.data;
    } catch (error: any) {
      console.error('Get recent patients error: ', error);
      throw this.handleApiError(error);
    }
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/doctor/appointments', {
        params: {
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get appointments by date range error: ', error);
      throw this.handleApiError(error);
    }
  }

  async getPatientList(page: number = 1, pageSize: number = 10): Promise<any> {
    try {
      const response = await apiClient.get<any>('/doctor/patients', {
        params: {
          page,
          pageSize
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get patient list error: ', error);
      throw this.handleApiError(error);
    }
  }

  async getEarningsReport(period: 'week' | 'month' | 'year'): Promise<any> {
    try {
      const response = await apiClient.get<any>('/doctor/earnings', {
        params: {
          period
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get earnings report error: ', error);
      throw this.handleApiError(error);
    }
  }

  async getFeedbackList(page: number = 1, pageSize: number = 10): Promise<any> {
    try {
      const response = await apiClient.get<any>('/doctor/feedback', {
        params: {
          page,
          pageSize
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get feedback list error: ', error);
      throw this.handleApiError(error);
    }
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

export default new DoctorDashboardService();
