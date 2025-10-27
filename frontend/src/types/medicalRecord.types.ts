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