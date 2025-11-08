"use client"

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { prescriptionService } from '../../services/prescriptionService';
import { MedicalRecord, Prescription } from '../../types/medicalRecord.types';
import { PageLoader } from '../../components/ui';
import Swal from 'sweetalert2';
import MedicineTable from './MedicineTable';
import { useAuth } from '../../contexts/AuthContext';
import "../../styles/doctor/PatientVisitForm.css";

const MedicalRecordDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isEditable, setIsEditable] = useState(false); // Trạng thái chỉnh sửa
  const [updatePatientHistory, setUpdatePatientHistory] = useState(true);
  const [newAllergy, setNewAllergy] = useState('');
  const [updatePatientAllergies, setUpdatePatientAllergies] = useState(false);

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

        // Xác định xem hồ sơ có được phép chỉnh sửa hay không
        const appointmentDate = new Date(data.appointmentDate);
        const today = new Date();
        const isToday =
          appointmentDate.getFullYear() === today.getFullYear() &&
          appointmentDate.getMonth() === today.getMonth() &&
          appointmentDate.getDate() === today.getDate();

        setIsEditable(isToday);
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

  const fieldDisplayNames: { [key in keyof MedicalRecord]?: string } = {
    chiefComplaint: 'Lý do khám',
    physicalExamination: 'Khám lâm sàng',
    diagnosis: 'Chẩn đoán chính',
    treatmentPlan: 'Kế hoạch điều trị',
  };

  const validateField = (fieldName: keyof MedicalRecord, value: any): string => {
    const requiredFields: (keyof MedicalRecord)[] = [
      'chiefComplaint',
      'physicalExamination',
      'diagnosis',
      'treatmentPlan',
    ];

    if (requiredFields.includes(fieldName)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldDisplayNames[fieldName] || fieldName} không được để trống.`;
      }
    }
    return '';
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: keyof MedicalRecord, value: string };
    handleUpdateField(name, value);
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFieldBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: keyof MedicalRecord, value: string };
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
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

    // --- VALIDATION ---
    const requiredFields: (keyof MedicalRecord)[] = [
      'chiefComplaint',
      'physicalExamination',
      'diagnosis',
      'treatmentPlan',
    ];

    const missingFields = requiredFields.filter(field => {
      const value = medicalRecord[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      // Cập nhật trạng thái lỗi để hiển thị trên UI
      missingFields.forEach(field => setFieldErrors(prev => ({ ...prev, [field]: `${fieldDisplayNames[field]} không được để trống.` })));
      const missingFieldNames = missingFields.map(field => fieldDisplayNames[field] || field).join(', ');
      Swal.fire('Thiếu thông tin', `Vui lòng điền đầy đủ các trường bắt buộc: ${missingFieldNames}.`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      
      const payload = {
        ...medicalRecord,
        updatePatientMedicalHistory: updatePatientHistory,
        // Chỉ gửi dị ứng mới nếu người dùng đã chọn cập nhật
        newAllergy: updatePatientAllergies ? newAllergy : "",
        updatePatientAllergies: updatePatientAllergies,
      };

      await medicalRecordService.updateMedicalRecord(medicalRecord.id, payload);

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
      <div className="form-header">
        <h1>HỒ SƠ BỆNH ÁN</h1>
        <div className="header-info">
          <span>Bệnh nhân: <strong>{medicalRecord.patientName}</strong></span>
          <span>Ngày khám: <strong>{new Date(medicalRecord.appointmentDate).toLocaleDateString('vi-VN')}</strong></span>
        </div>
      </div>

      <section className="form-section">
        <h3 className="section-title">I. THÔNG TIN HÀNH CHÍNH</h3>
        <div className="info-grid">
          <div className="info-item"><strong>Mã hồ sơ bệnh án:</strong> {medicalRecord.medicalRecordNumber}</div>
          <div className="info-item"><strong>Giới tính:</strong> {medicalRecord.genderCode === 'MALE' ? 'Nam' : medicalRecord.genderCode === 'FEMALE' ? 'Nữ' : 'Khác'}</div>
          <div className="info-item"><strong>Ngày sinh:</strong> {medicalRecord.dateOfBirth ? new Date(medicalRecord.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}</div>
          <div className="info-item"><strong>CCCD:</strong> {medicalRecord.identificationNumber || 'N/A'}</div>
          <div className="info-item full-span"><strong>Địa chỉ:</strong> {medicalRecord.address || 'N/A'}</div>
          <div className="info-item"><strong>Nhóm máu:</strong> {medicalRecord.bloodTypeCode || 'N/A'}</div>
          <div className="info-item"><strong>Chiều cao:</strong> {medicalRecord.height ? `${medicalRecord.height} cm` : 'N/A'}</div>
          <div className="info-item"><strong>Cân nặng:</strong> {medicalRecord.weight ? `${medicalRecord.weight} kg` : 'N/A'}</div>
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-title">II. LÝ DO VÀO VIỆN VÀ BỆNH SỬ</h3>
        <div className="section-grid">
          <div className="form-column">
            <label className="form-label">Lý do khám</label>
            <textarea
              name="chiefComplaint"
              className={`form-textarea ${fieldErrors.chiefComplaint ? 'input-error' : ''}`}
              value={medicalRecord.chiefComplaint}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              disabled={!isEditable} // Vô hiệu hóa nếu không được phép chỉnh sửa
              rows={3} ></textarea>
            {fieldErrors.chiefComplaint && <p className="error-message">{fieldErrors.chiefComplaint}</p>}
          </div>
          <div className="form-column full-width">
            <label className="form-label">Quá trình bệnh lý và diễn biến (Khám lâm sàng)</label>
            <textarea
              name="physicalExamination"
              className={`form-textarea ${fieldErrors.physicalExamination ? 'input-error' : ''}`}
              value={medicalRecord.physicalExamination}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              rows={5}
              disabled={!isEditable} />
            {fieldErrors.physicalExamination && <p className="error-message">{fieldErrors.physicalExamination}</p>}
          </div>
        </div>
      </section>
      
      <section className="form-section">
        <h3 className="section-title">III. TIỀN SỬ BỆNH VÀ DỊ ỨNG</h3>
        <div className="section-grid">
          <div className="form-column">
            <label className="form-label">Tiền sử bệnh</label>
            <p className="info-value-box">{medicalRecord.medicalHistory || 'Không có'}</p>
          </div>
          <div className="form-column">
            <label className="form-label">Dị ứng</label>
            <p className="info-value-box">{medicalRecord.allergies || 'Không có'}</p>
          </div>
          {isEditable && (
            <div className="form-column full-width">
              <label htmlFor="newAllergy" className="form-label">Thêm dị ứng mới</label>
              <input
                type="text"
                id="newAllergy"
                name="newAllergy"
                className="form-input"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Nhập dị ứng mới nếu có (VD: Dị ứng phấn hoa)"
              />
              <div className="form-checkbox-group mt-2">
                <input
                  type="checkbox"
                  id="updatePatientAllergies"
                  name="updatePatientAllergies"
                  checked={updatePatientAllergies}
                  onChange={(e) => setUpdatePatientAllergies(e.target.checked)}
                />
                <label htmlFor="updatePatientAllergies">Cập nhật dị ứng mới này vào hồ sơ bệnh nhân</label>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-title">IV. CHẨN ĐOÁN VÀ ĐIỀU TRỊ</h3>
        <div className="section-grid">
          <div className="form-column">
            <label className="form-label">Chẩn đoán chính</label>
            <textarea
              name="diagnosis"
              className={`form-textarea ${fieldErrors.diagnosis ? 'input-error' : ''}`}
              value={medicalRecord.diagnosis}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              rows={3}
              disabled={!isEditable} />
            {fieldErrors.diagnosis && <p className="error-message">{fieldErrors.diagnosis}</p>}
          </div>
          <div className="form-column">
            <label className="form-label">Ghi chú đánh giá</label>
            <textarea
              name="assessmentNotes"
              className="form-textarea"
              value={medicalRecord.assessmentNotes}
              disabled={!isEditable}
              onChange={handleFieldChange}
              rows={3} />
          </div>
          <div className="form-column full-width">
            <label className="form-label">Kế hoạch điều trị</label>
            <textarea
              name="treatmentPlan"
              className={`form-textarea ${fieldErrors.treatmentPlan ? 'input-error' : ''}`}
              value={medicalRecord.treatmentPlan}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              rows={4}
              disabled={!isEditable} />
            {fieldErrors.treatmentPlan && <p className="error-message">{fieldErrors.treatmentPlan}</p>}
          </div>
          <div className="form-column full-width">
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="updatePatientHistory"
                name="updatePatientHistory"
                checked={updatePatientHistory}
                onChange={(e) => setUpdatePatientHistory(e.target.checked)}
                disabled={!isEditable}
              />
              <label htmlFor="updatePatientHistory">Cập nhật chẩn đoán vào tiền sử bệnh của bệnh nhân</label>
            </div>
          </div>
          <div className="form-column">
            <label className="form-label">Ghi chú của bác sĩ</label>
            <textarea
              name="doctorNotes"
              className="form-textarea"
              value={medicalRecord.doctorNotes}
              disabled={!isEditable}
              onChange={handleFieldChange}
              rows={4} />
          </div>
          <div className="form-column">
            <label className="form-label">Hướng dẫn tái khám</label>
            <textarea
              name="followUpInstructions"
              className="form-textarea"
              value={medicalRecord.followUpInstructions}
              onChange={handleFieldChange}
              rows={4}
              disabled={!isEditable} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="prescription-header">
          <h3 className="section-title">V. ĐƠN THUỐC</h3>
          {isEditable && (
            <button type="button" className="btn-add-medicine" onClick={handleAddMedicine}>
            Thêm thuốc
          </button>
          )}
        </div>
        <MedicineTable medicines={medicalRecord.prescriptions} onDelete={isEditable ? handleDeleteMedicine : () => {}} onUpdate={isEditable ? handleUpdateMedicine : () => {}} />
      </section>

      <div className="form-footer">
        <div className="doctor-signature">
          <p>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
          <p><strong>Bác sĩ điều trị</strong></p>
          <p>(Ký và ghi rõ họ tên)</p>
          <br />
          <p>{user?.fullName}</p>
        </div>
        {isEditable ? (
          <button type="submit" className="btn-submit" disabled={isSubmitting} >
            {isSubmitting ? 'Đang lưu...' : 'Hoàn tất & Lưu hồ sơ'}
          </button>
        ) : (
          <button type="button" className="btn-submit" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        )}
      </div>
    </form>
  );
};

export default MedicalRecordDetails;