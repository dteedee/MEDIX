export interface DoctorSchedule {
  id: string;
  doctorName: string;
  dayOfWeek: number;         // 👈 thay vì scheduleDate
  startTime: string;         // "09:00:00"
  endTime: string;           // "17:00:00"
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchedulePayload {
  dayOfWeek: number;         // 👈 thay vì scheduleDate
  startTime: string;         // "HH:mm"
  endTime: string;           // "HH:mm"
  isAvailable: boolean;      // 👈 thêm trường này vì API có
}
