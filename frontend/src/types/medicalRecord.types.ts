export interface Prescription {
  id: string;
  medicationId?: string; 
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
  appointmentStartDate?: string; 
  appointmentEndDate?: string;   
  statusAppointment?: string;   
  chiefComplaint: string;
  physicalExamination: string;
  diagnosis: string;
  assessmentNotes: string;
  treatmentPlan: string;
  followUpInstructions: string;
  doctorNotes: string;
  prescriptions: Prescription[];
  medicalRecordNumber?: string;
  bloodTypeCode?: string;
  height?: number;
  weight?: number;
  medicalHistory?: string;
  allergies?: string;
  diseaseHistory?: string;
  genderCode?: string;
  dateOfBirth?: string;
  address?: string;
  identificationNumber?: string;
}

export interface MedicalRecordDto {
  id: string;
  date: string;
  doctor: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  prescription?: PrescriptionDto[];
  attatchments: AttatchmentDto[];
}

export interface MedicalRecordQuery {
  dateFrom: string | null;
  dateTo: string | null;
}

export interface PrescriptionDto {
  id: string;
  medicationName: string;
  instructions: string;
  frequency: string;
  duration: string;
}

export interface AttatchmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface MedicalRecordDetail {
  id: string;
  date: string;
  doctor: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  prescription: PrescriptionDto[];
  attatchments: AttatchmentDto[];
}

