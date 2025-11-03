export interface DoctorSchedule {
  id: string;
  doctorId: string; // Changed from doctorName to match backend consistency
  dayOfWeek: number;         // 👈 thay vì scheduleDate
  startTime: string;         // "09:00:00"
  endTime: string;           // "17:00:00"
  isAvailable: boolean;
}

export interface CreateSchedulePayload {
  dayOfWeek: number;         // 👈 thay vì scheduleDate
  startTime: string;         // "HH:mm"
  endTime: string;           // "HH:mm"
  isAvailable: boolean;      // 👈 thêm trường này vì API có
}

export interface ScheduleOverride {
  id: string;
  doctorId: string;
  overrideDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  isAvailable: boolean; // true for extra shift, false for absence
  reason: string;
}

export interface DoctorScheduleOverrideDto {
  id: string;
  doctorId: string;
  overrideDate: string; // DateOnly from backend becomes string
  startTime: string; // TimeOnly from backend becomes string HH:mm:ss
  endTime: string; // TimeOnly from backend becomes string HH:mm:ss
  isAvailable: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleOverridePayload {
  overrideDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  reason: string;
}
