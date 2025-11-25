import { apiClient } from '../lib/apiClient';

// --- New Interfaces for the updated API response ---

/**
 * Thống kê về các lịch hẹn.
 */
export interface AppointmentStats {
  totalAppointments: number;
  confirmed: number;
  onProgressing: number;
  cancelledByPatient: number;
  cancelledByDoctor: number;
  missedByDoctor: number;
  missedByPatient: number;
  BeforeAppoiment: number;

  noShow: number;
  completed: number;
  todayAppointmentsCount: number;
}

/**
 * Ca làm việc của bác sĩ.
 */
export interface WorkShift {
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  isAvailable: boolean;
  overrideReason: string | null;
  overrideType: boolean | null;
}

/**
 * Lịch làm việc trong ngày của một bác sĩ.
 */
export interface DoctorSchedule {
  doctorId: string;
  doctorName: string;
  specializationName: string;
  workShifts: WorkShift[];
}

/**
 * Thông tin chi tiết về một lịch hẹn trong ngày.
 */
export interface TodayAppointment {
  appointmentId: string;
  status: string; // e.g., "Confirmed", "OnProgressing"
  startTime: string; // ISO 8601 date string
  endTime: string; // ISO 8601 date string
  doctorId: string;
  doctorName: string;
  specialization: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
}

/**
 * Thông tin về một đánh giá.
 */
export interface Review {
  rating: number;
  comment: string | null;
  adminResponse: string | null;
  status: 'Public' | 'Private';
}


/**
 * Thông tin chi tiết về một lịch hẹn (dùng cho danh sách tất cả lịch hẹn).
 * Giả sử có cấu trúc tương tự TodayAppointment nhưng có thể có thêm trường.
 */
export interface Appointment {
  appointmentId: string;
  status: string;
  startTime: string;
  endTime: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  review: Review | null;
}

/**
 * Cấu trúc dữ liệu chính cho trang dashboard của quản lý.
 */
export interface ManagerDashboardData {
  doctorsTodaySchedules: DoctorSchedule[];
  appointmentStats: AppointmentStats;
  todayAppointments: TodayAppointment[];
  allAppointments: Appointment[];
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
