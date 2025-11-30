export interface DoctorServiceTier {
  serviceTierId: string;
  name: string;
  description: string;
  consultationFeeMultiplier: number;
  priorityBoost: number;
  maxDailyAppointments: number;
  features: string; 
  monthlyPrice: number;
  isActive: boolean;

  id: string;
  featuresList: string[];
}

export interface DoctorServiceTierUpdateRequest {
  description: string;
  monthlyPrice: number;
}