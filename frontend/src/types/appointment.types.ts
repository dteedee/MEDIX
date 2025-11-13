export interface CreateAppointmentDto {
  patientId?: string;
  doctorId?: string;
  aiSymptomAnalysisId?: string;
  appointmentStartTime?: string; // ISO DateTime
  appointmentEndTime?: string; // ISO DateTime
  durationMinutes?: number;
  consultationFee?: number;
  platformFee?: number;
  discountAmount?: number;
  totalAmount?: number;
  statusCode?: string;
  paymentStatusCode?: string;
  paymentMethodCode?: string;
  medicalInfo?: string;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentStartTime: string; // "YYYY-MM-DDTHH:mm:ss"
  appointmentEndTime: string;   // "YYYY-MM-DDTHH:mm:ss"
  durationMinutes: number;
  patientID?: string;
  doctorID?: string;
  statusCode: string;           // e.g., "CONFIRMED", "COMPLETED"
  statusDisplayName?: string;
  consultationFee: number;
  platformFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatusCode: string;
  paymentStatusName?: string;
  paymentMethodCode?: string;
  paymentMethodName?: string;
  transactionId?: string;
  refundAmount?: number;
  refundStatus?: string;
  refundProcessedAt?: string;
  medicalInfo?: string;
  aiSymptomAnalysisId?: string;
  createdAt: string;
  updatedAt: string;
}