export interface DoctorServiceTier {
  serviceTierId: string;
  name: string;
  description: string;
  consultationFeeMultiplier: number;
  priorityBoost: number;
  maxDailyAppointments: number;
  features: string; // JSON string
  monthlyPrice: number;
  isActive: boolean;

  // Các trường phụ trợ để tương thích với các component hiện có
  id: string;
  featuresList: string[];
}

export interface DoctorServiceTierUpdateRequest {
  description: string;
  monthlyPrice: number;
}