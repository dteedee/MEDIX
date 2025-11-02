export interface DoctorReview {
  id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  rating: number;
  comment: string | null;
  adminResponse: string | null;
  status: string;
  createdAt: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
}