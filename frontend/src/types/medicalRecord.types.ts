export interface Prescription {
  id: string;
  medicationId?: string; // ID của thuốc từ database
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  medicalRecordId?: string;

  genericName?: string | null;
  dosageForms?: string | null;
  commonUses?: string | null;
  sideEffects?: string | null;
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientName: string;
  appointmentDate: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  chiefComplaint: string;
  physicalExamination: string;
  diagnosis: string;
  assessmentNotes: string;
  treatmentPlan: string;
  followUpInstructions: string;
  doctorNotes: string;
  prescriptions: Prescription[];
  // Thêm các trường bị thiếu
  medicalRecordNumber?: string;
  bloodTypeCode?: string;
  height?: number;
  weight?: number;
  medicalHistory?: string;
  allergies?: string;
  // Thêm các trường từ User
  genderCode?: string;
  dateOfBirth?: string;
  address?: string;
  identificationNumber?: string;
  
}