export interface Appointment {
  id: string;
  patientName: string;
  appointmentStartTime: string; // "YYYY-MM-DDTHH:mm:ss"
  appointmentEndTime: string;   // "YYYY-MM-DDTHH:mm:ss"
  patientId: string;            // 👈 Thêm patientId
  statusCode: string;           // e.g., "CONFIRMED", "COMPLETED"
  statusDisplayName?: string;
  doctorName: string;
  consultationFee: number;
  platformFee: number;
  totalAmount: number;
  paymentStatusCode: string;
  paymentMethodCode: string;
  medicalInfo?: string;
  createdAt: string;
  updatedAt: string;
}