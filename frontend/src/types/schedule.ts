export interface DoctorSchedule {
  id: string;
  doctorId: string;
  scheduleDate: string; // "2024-10-28T00:00:00"
  startTime: string; // "08:00:00"
  endTime: string; // "17:00:00"
  consultationFee: number;
  isAvailable: boolean;
}

export interface CreateSchedulePayload {
  scheduleDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime:string; // "HH:mm"
  consultationFee: number;
}
