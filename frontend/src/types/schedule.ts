export interface DoctorSchedule {
  id: string;
  doctorId: string; 
  dayOfWeek: number;         
  startTime: string;        
  endTime: string;         
  isAvailable: boolean;
}

export interface CreateSchedulePayload {
  dayOfWeek: number;         
  startTime: string;        
  endTime: string;           
  isAvailable: boolean;      
}

export interface ScheduleOverride {
  id: string;
  doctorId: string;
  overrideDate: string; 
  startTime: string; 
  endTime: string; 
  isAvailable: boolean; 
  reason: string;
  overrideType: boolean;
}

export interface DoctorScheduleOverrideDto {
  id: string;
  doctorId: string;
  overrideDate: string; 
  startTime: string; 
  endTime: string; 
  isAvailable: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleOverridePayload {
  overrideDate: string; 
  startTime: string; 
  endTime: string; 
  isAvailable: boolean;
  reason: string;
  overrideType: boolean;
}
