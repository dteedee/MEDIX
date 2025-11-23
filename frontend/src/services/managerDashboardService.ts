import { apiClient } from '../lib/apiClient';

export interface ManagerDashboardSummary {
  activeDoctors: number;
  todayAppointments: number;
  todayConfirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalReviews: number;
}

export interface ManagerDashboardDoctor {
  doctorId: string;
  doctorName: string;
  specialtyName: string;
  status: string; // "Online", "Busy", "Offline"
  statusDisplayName: string; // "Đang hoạt động", "Bận", "Nghỉ"
  isAcceptingAppointments: boolean;
}

export interface ManagerDashboardRecentActivity {
  activityType: string;
  title: string;
  description: string;
  createdAt: string;
  userName?: string;
}

export interface ManagerDashboardRecentFeedback {
  reviewId: string;
  rating: number;
  comment?: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  specialtyName: string;
  createdAt: string;
}

export interface ManagerDashboardData {
  summary: ManagerDashboardSummary;
  recentDoctors: ManagerDashboardDoctor[];
  recentActivities: ManagerDashboardRecentActivity[];
  recentFeedbacks: ManagerDashboardRecentFeedback[];
}

const getDashboardData = async (): Promise<ManagerDashboardData> => {
  try {
    const response = await apiClient.get<ManagerDashboardData>('/Dashboard/manager');
    return response.data;
  } catch (error) {
    console.error('Error fetching manager dashboard data:', error);
    throw error;
  }
};

export const managerDashboardService = {
  getDashboardData,
};

