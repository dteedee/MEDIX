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

