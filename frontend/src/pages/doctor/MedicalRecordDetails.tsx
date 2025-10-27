"use client"

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { prescriptionService } from '../../services/prescriptionService';
import { MedicalRecord, Prescription } from '../../types/medicalRecord.types';
import { PageLoader } from '../../components/ui';
import Swal from 'sweetalert2';
import MedicineTable from './MedicineTable';
import "../../styles/PatientVisitForm.css";

const MedicalRecordDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMedicalRecord = async () => {
      if (!appointmentId) {
        setError("Không tìm thấy ID cuộc hẹn.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await medicalRecordService.getMedicalRecordByAppointmentId(appointmentId);
        setMedicalRecord(data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching medical record:", err);
        if (err.response && err.response.status === 404) {
          setError("Không tìm thấy hồ sơ bệnh án cho cuộc hẹn này.");
        } else {
          setError("Không thể tải hồ sơ bệnh án. Vui lòng thử lại.");
        }
        setMedicalRecord(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicalRecord();
  }, [appointmentId]);

  const handleUpdateField = (field: keyof MedicalRecord, value: any) => {
    setMedicalRecord(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddMedicine = () => {
    const newMedicine: Prescription = {
      id: `new-${Date.now()}`, // ID tạm thời cho client
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      medicalRecordId: medicalRecord?.id, // Liên kết với hồ sơ bệnh án hiện tại
    };
    handleUpdateField('prescriptions', [...(medicalRecord?.prescriptions || []), newMedicine]);
  };

  const handleDeleteMedicine = (id: string) => {
    handleUpdateField('prescriptions', medicalRecord?.prescriptions.filter((med) => med.id !== id));
  };

  const handleUpdateMedicine = (id: string, field: keyof Prescription, value: any) => {
    handleUpdateField('prescriptions', medicalRecord?.prescriptions.map((med) => (med.id === id ? { ...med, [field]: value } : med)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!medicalRecord) return;

    setIsSubmitting(true);
    try {
      // Tách đơn thuốc mới (có id tạm) và đơn thuốc cũ
      const newPrescriptions = medicalRecord.prescriptions.filter(p => p.id.startsWith('new-'));
      const existingPrescriptions = medicalRecord.prescriptions.filter(p => !p.id.startsWith('new-'));

      // Bước 1: Tạo các đơn thuốc mới
      const createdPrescriptionPromises = newPrescriptions.map(p => {
        const { id, ...payload } = p; // Loại bỏ id tạm thời
        return prescriptionService.createPrescription({
          ...payload,
          medicalRecordId: medicalRecord.id // Đảm bảo medicalRecordId được gửi đi
        });
      });
      const createdPrescriptions = await Promise.all(createdPrescriptionPromises);

      // Bước 2: Cập nhật lại hồ sơ bệnh án với danh sách đơn thuốc đầy đủ (cũ + mới đã có id thật)
      const updatedRecordPayload: MedicalRecord = {
        ...medicalRecord,
        prescriptions: [...existingPrescriptions, ...createdPrescriptions],
      };

      await medicalRecordService.updateMedicalRecord(medicalRecord.id, updatedRecordPayload);

      Swal.fire({
        title: 'Thành công!',
        text: 'Hồ sơ bệnh án đã được cập nhật.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate(-1); // Quay lại trang trước
      });
    } catch (err) {
      console.error("Failed to update medical record:", err);
      Swal.fire('Thất bại!', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h1>
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!medicalRecord) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy hồ sơ bệnh án</h1>
        <p className="text-gray-700">Hồ sơ bệnh án cho cuộc hẹn này không tồn tại.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="patient-visit-form container mx-auto my-6">
      {/* Header */}
      <div className="form-header">
        <h2>Cập nhật hồ sơ bệnh án cho {medicalRecord.patientName} - {new Date(medicalRecord.appointmentDate).toLocaleDateString('vi-VN')}</h2>
      </div>

      {/* Examination Information Section */}
      <section className="form-section">
        <h3 className="section-title">Thông tin khám</h3>
        <div className="section-content two-columns">
          <div className="form-column">
            <label className="form-label">Lý do khám</label>
            <textarea
              className="form-textarea"
              value={medicalRecord.chiefComplaint}
              onChange={(e) => handleUpdateField('chiefComplaint', e.target.value)}
              rows={4}
            />
          </div>
          <div className="form-column">
            <label className="form-label">Khám thực thể</label>
            <textarea
              className="form-textarea"
              value={medicalRecord.physicalExamination}
              onChange={(e) => handleUpdateField('physicalExamination', e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* Diagnosis Section */}
      <section className="form-section">
        <h3 className="section-title">Chẩn đoán</h3>
        <div className="section-content two-columns">
          <div className="form-column">
            <label className="form-label">Chẩn đoán chính</label>
            <textarea className="form-textarea" value={medicalRecord.diagnosis} onChange={(e) => handleUpdateField('diagnosis', e.target.value)} rows={3} />
          </div>
          <div className="form-column">
            <label className="form-label">Ghi chú đánh giá</label>
            <textarea className="form-textarea" value={medicalRecord.assessmentNotes} onChange={(e) => handleUpdateField('assessmentNotes', e.target.value)} rows={3} />
          </div>
        </div>
        <div className="form-column full-width mt-4">
          <label className="form-label">Ghi chú của bác sĩ</label>
          <textarea className="form-textarea" value={medicalRecord.doctorNotes} onChange={(e) => handleUpdateField('doctorNotes', e.target.value)} rows={2} />
        </div>
      </section>

      {/* Treatment Plan Section */}
      <section className="form-section">
        <h3 className="section-title">Kế hoạch điều trị</h3>
        <div className="section-content two-columns">
          <div className="form-column">
            <label className="form-label">Hướng dẫn điều trị</label>
            <textarea className="form-textarea" value={medicalRecord.treatmentPlan} onChange={(e) => handleUpdateField('treatmentPlan', e.target.value)} rows={3} />
          </div>
          <div className="form-column">
            <label className="form-label">Hướng dẫn tái khám</label>
            <textarea className="form-textarea" value={medicalRecord.followUpInstructions} onChange={(e) => handleUpdateField('followUpInstructions', e.target.value)} rows={3} />
          </div>
        </div>
      </section>

      {/* Medicine Prescription Section */}
      <section className="form-section">
        <div className="prescription-header">
          <h3 className="section-title">Kê đơn thuốc</h3>
          <button className="btn-add-medicine" onClick={handleAddMedicine}>
            Thêm thuốc
          </button>
        </div>
        <MedicineTable medicines={medicalRecord.prescriptions} onDelete={handleDeleteMedicine} onUpdate={handleUpdateMedicine} />
      </section>

      {/* Submit Button */}
      <div className="form-footer">
        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Hoàn tất & Lưu hồ sơ'}
        </button>
      </div>
    </form>
  );
};

export default MedicalRecordDetails;