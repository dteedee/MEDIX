export interface SpecializationDistributionDto {
    id: string;
    name: string;
    doctorCount: number;
    percentage: number;
}

export interface MonthlyAppointmentTrendDto {
    month: number;
    appointmentCount: number;
    appointmentRevenue: number;
    walletRevenue: number;
    totalRevenue: number;
}

export interface AppointmentTrendsDto {
    year: number;
    doctorId: string | null;
    totalAppointments: number;
    totalRevenue: number;
    monthly: MonthlyAppointmentTrendDto[];
}

export interface MonthlyUserGrowthDto {
    month: number;
    newUsers: number;
    newDoctors: number;
}

export interface UserGrowthDto {
    year: number;
    totalNewUsers: number;
    totalNewDoctors: number;
    monthly: MonthlyUserGrowthDto[];
}

export interface StatDto {
    total: number;
    growth: number; // percentage, e.g. 12.5 or -86.2
}

export interface ManagerDashboardSummaryDto {
    users: StatDto;
    doctors: StatDto;
    appointments: StatDto;
    revenue: StatDto;
}

export interface TopRatedDoctorDto {
    doctorId: string;
    doctorName: string;
    specialization: string;
    degree?: string; // Học vị: "GS.", "PGS.", "TS.", "ThS.", etc.
    averageRating: number;
    reviewCount: number;
    imageUrl?: string;
    formattedRating: string;
    completedAppointments?: number; // Số ca đã thực hiện
    successfulAppointments?: number; // Số ca thành công
    totalAppointments?: number; // Tổng số lịch hẹn
    experienceYears?: number; // Số năm kinh nghiệm
    successRate?: number; // Tỷ lệ thành công (%)
}

