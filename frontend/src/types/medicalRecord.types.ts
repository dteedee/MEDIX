export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  medicalRecordId?: string; // Thêm để liên kết khi tạo mới
}

export interface MedicalRecord {
  id: string;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  chiefComplaint: string;
  physicalExamination: string;
  diagnosis: string;
  assessmentNotes: string;
  treatmentPlan: string;
  followUpInstructions: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
  prescriptions: Prescription[];
}

export interface MedicalRecordDto{
  id: string;
  date: string;
  doctor: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  attatchments: string[];
}

export interface MedicalRecordQuery{
  skip: number;
  take: number;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface MedicalRecordDetail{
  id: string;
  date: string;
  doctor: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  prescription: string;
}