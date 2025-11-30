import { apiClient } from "../lib/apiClient";


interface DashboardSummary {
  todayAppointments: number;
  todayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  averageRating: number;
}

interface RegularSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface ScheduleOverride {
  overrideDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  overrideType: boolean;
  reason: string;
}

interface DashboardSchedule {
  regular: RegularSchedule[];
  overrides: ScheduleOverride[];
}

interface DashboardSubscription {
  name: string;
  features: string;
  monthlyFee: number;
}

interface DashboardSalary {
  periodStartDate: string;
  periodEndDate: string;
  netSalary: number;
  status: string;
}

interface DashboardWallet {
  balance: number;
}

interface DashboardReviewItem {
  rating: number;
  comment: string;
  patientName: string;
  createdAt: string;
}

interface DashboardReview {
  averageRating: number;
  recent: DashboardReviewItem[];
}

interface DoctorDashboardData {
  summary: DashboardSummary;
  schedule: DashboardSchedule;
  subscription: DashboardSubscription | null;
  wallet: DashboardWallet | null;
  salary: DashboardSalary | null;
  reviews: DashboardReview;
  campaigns: any[]; 
}

class DoctorDashboardService {

  async getDashboard(): Promise<DoctorDashboardData> {
    try {
      const response = await apiClient.get<DoctorDashboardData>('/Dashboard/doctor');
      return response.data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  private handleApiError(error: any): Error {
    if (error.response?.data) {
      const apiError = error.response.data;

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
