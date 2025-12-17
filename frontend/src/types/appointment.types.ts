export interface CreateAppointmentDto {
  patientId?: string;
  doctorId?: string;
  aiSymptomAnalysisId?: string;
  appointmentStartTime?: string; 
  appointmentEndTime?: string; 
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
  userPromotionID?: string; 
  promotionCode?: string; 
}

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail?: string;
  doctorName: string;
  appointmentStartTime: string; 
  appointmentEndTime: string;   
  durationMinutes: number;
  patientID?: string;
  doctorID?: string;
  statusCode: string;           
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
  patientReview?: string;
  patientRating?: string;
  chiefComplaint?: string;
  createdAt: string;
  updatedAt: string;
}