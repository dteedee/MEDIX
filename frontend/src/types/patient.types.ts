export interface BasicEMRInfo{
  id: string;
  avatarUrl: string;
  fullName: string;
  identificationNumber: string;
  address: string;
  email: string;
  phoneNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  dob: string;
  genderCode: string;
  bloodTypeCode: string;
  allergies: string;
  emrNumber?: string;
}
export interface PatientHealthReminderDto {
  id?: string;
  patientId?: string;
  reminderTypeCode?: string;
  title?: string;
  description?: string;
  scheduledDate?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  isCompleted?: boolean;
  completedAt?: string;
  relatedAppointmentId?: string;
  createdAt?: string;
}
