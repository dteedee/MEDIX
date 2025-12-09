"use client"

import React, { useEffect, useState, FormEvent, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { prescriptionService } from '../../services/prescriptionService';
import { appointmentService } from '../../services/appointmentService';
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
  const { user, isBanned } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newAllergy, setNewAllergy] = useState('');

  const statusDisplayNameMap: Record<string, string> = {
    'BeforeAppoiment': 'Trước giờ khám',
    'CancelledByDoctor': 'Bác sĩ hủy',
    'CancelledByPatient': 'Bệnh nhân hủy',
    'Completed': 'Hoàn thành',
    'Confirmed': 'Đã xác nhận',
    'MissedByDoctor': 'Bác sĩ vắng mặt',
    'MissedByPatient': 'Bệnh nhân vắng mặt',
    'NoShow': 'Không đến',
    'OnProgressing': 'Đang khám',
    'PendingConfirmation': 'Chờ xác nhận',
  };

  const showBannedPopup = () => {
    if (user) {
      const startDate = (user as any)?.startDateBanned ? new Date((user as any).startDateBanned).toLocaleDateString('vi-VN') : '';
      const endDate = (user as any)?.endDateBanned ? new Date((user as any).endDateBanned).toLocaleDateString('vi-VN') : '';
      
      Swal.fire({
        title: 'Tài khoản bị tạm khóa',
        html: `Chức năng chỉnh sửa hồ sơ bệnh án của bạn đã bị tạm khóa từ <b>${startDate}</b> đến <b>${endDate}</b>.<br/>Mọi thắc mắc vui lòng liên hệ quản trị viên.`,
        icon: 'warning',
        confirmButtonText: 'Đã hiểu'
      });
    }
  };

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
    let processedValue = value;

    if (name === 'diagnosis' && value) {
      const diagnoses = value.split(',').map(d => d.trim()).filter(d => d !== '');
      const uniqueDiagnosesMap = new Map<string, string>(); 

      for (const diagnosis of diagnoses) {
        const lowerCaseDiagnosis = diagnosis.toLowerCase();
        if (!uniqueDiagnosesMap.has(lowerCaseDiagnosis)) {
          uniqueDiagnosesMap.set(lowerCaseDiagnosis, diagnosis);
        }
      }
      processedValue = Array.from(uniqueDiagnosesMap.values()).join(', ');
      handleUpdateField(name, processedValue); 
    }

    const error = validateField(name, processedValue);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleAddMedicine = () => {
    const newMedicine: Prescription = {
      id: `new-${Date.now()}`, 
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      medicalRecordId: medicalRecord?.id, 
    };
    handleUpdateField('prescriptions', [...(medicalRecord?.prescriptions || []), newMedicine]);
  };

  const handleDeleteMedicine = (id: string) => {
    handleUpdateField('prescriptions', medicalRecord?.prescriptions.filter((med) => med.id !== id));
  };

  const handleUpdateMedicine = (id: string, field: keyof Prescription, value: any) => {
    handleUpdateField('prescriptions', medicalRecord?.prescriptions.map((med) => (med.id === id ? { ...med, [field]: value } : med)));
  };

  const handleUpdateMedicineFields = (id: string, updates: Partial<Prescription>) => {
    handleUpdateField(
      'prescriptions',
      medicalRecord?.prescriptions.map((med) => (med.id === id ? { ...med, ...updates } : med))
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!medicalRecord) return;

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
      missingFields.forEach(field => setFieldErrors(prev => ({ ...prev, [field]: `${fieldDisplayNames[field]} không được để trống.` })));
      const missingFieldNames = missingFields.map(field => fieldDisplayNames[field] || field).join(', ');
      Swal.fire('Thiếu thông tin', `Vui lòng điền đầy đủ các trường bắt buộc: ${missingFieldNames}.`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {          
      const payload = {
        ...medicalRecord,
        updatePatientMedicalHistory: false, 
        updatePatientAllergies: false,
        newAllergy: newAllergy.trim(),
        updatePatientDiseaseHistory: false, 
      };
      await medicalRecordService.updateMedicalRecord(medicalRecord.id, payload);

      Swal.fire({
        title: 'Thành công!',
        text: 'Hồ sơ bệnh án đã được cập nhật.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
      });
    } catch (err) {
      Swal.fire('Thất bại!', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!medicalRecord) return;

    if (!canCancelAppointment) {
      if (medicalRecord.appointmentStartDate && medicalRecord.appointmentEndDate) {
        const now = new Date();
        const startDate = new Date(medicalRecord.appointmentStartDate);
        const endDate = new Date(medicalRecord.appointmentEndDate);
        
        if (now < startDate) {
          Swal.fire({
            title: 'Chưa thể hủy',
            html: `Chỉ có thể hủy lịch khám trong thời gian ca khám.<br/>Ca khám bắt đầu lúc <b>${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</b>.`,
            icon: 'info',
            confirmButtonText: 'Đã hiểu'
          });
          return;
        }
        
        if (now > endDate) {
          Swal.fire({
            title: 'Không thể hủy',
            html: `Đã quá thời gian cho phép hủy lịch khám.<br/>Ca khám đã kết thúc lúc <b>${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</b>.`,
            icon: 'warning',
            confirmButtonText: 'Đã hiểu'
          });
          return;
        }
      }
    }

    Swal.fire({
      title: 'Hủy lịch khám',
      text: 'Bạn có chắc chắn muốn hủy lịch khám này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xác nhận hủy',
      cancelButtonText: 'Đóng'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);
        try {
          await appointmentService.updateStatus(medicalRecord.appointmentId, 'MissedByPatient');
          
          Swal.fire({
            title: 'Thành công!',
            text: 'Lịch khám đã được hủy.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            navigate(-1);
          });
        } catch (err: any) {
          Swal.fire('Thất bại!', err.response?.data?.message || 'Không thể hủy lịch khám. Vui lòng thử lại.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleCompleteAppointment = async () => {
    if (!medicalRecord) return;

    if (!canComplete) {
      const missingFields: string[] = [];
      if (!medicalRecord.diagnosis || medicalRecord.diagnosis.trim() === '') {
        missingFields.push('Chẩn đoán chính');
      }
      if (!medicalRecord.treatmentPlan || medicalRecord.treatmentPlan.trim() === '') {
        missingFields.push('Kế hoạch điều trị');
      }

      if (missingFields.length > 0) {
        Swal.fire({
          title: 'Không thể hoàn thành',
          html: `Vui lòng điền đầy đủ các trường sau:<br/><b>${missingFields.join(', ')}</b>`,
          icon: 'warning',
          confirmButtonText: 'Đã hiểu'
        });
        return;
      }

      if (medicalRecord.appointmentEndDate) {
        const now = new Date();
        const endDate = new Date(medicalRecord.appointmentEndDate);
        const endDateMinus5Min = new Date(endDate.getTime() - 5 * 60 * 1000);
        const endDatePlus10Min = new Date(endDate.getTime() + 10 * 60 * 1000);

        if (now < endDateMinus5Min) {
          const timeLeft = Math.ceil((endDateMinus5Min.getTime() - now.getTime()) / 60000);
          Swal.fire({
            title: 'Chưa thể hoàn thành',
            html: `Chỉ có thể hoàn thành từ <b>5 phút trước</b> khi kết thúc ca khám.<br/>Vui lòng đợi thêm <b>${timeLeft} phút</b>.`,
            icon: 'info',
            confirmButtonText: 'Đã hiểu'
          });
          return;
        }

        if (now > endDatePlus10Min) {
          const minutesPassed = Math.ceil((now.getTime() - endDatePlus10Min.getTime()) / 60000);
          Swal.fire({
            title: 'Đã quá thời gian',
            html: `Đã quá thời gian cho phép hoàn thành ca khám.<br/>Chỉ có thể hoàn thành trong vòng <b>10 phút</b> sau khi kết thúc ca khám.<br/>Đã qua <b>${minutesPassed} phút</b>.`,
            icon: 'warning',
            confirmButtonText: 'Đã hiểu'
          });
          return;
        }
      }
    }

    Swal.fire({
      title: 'Hoàn thành lịch khám',
      text: 'Bạn có chắc chắn muốn đánh dấu lịch khám này là hoàn thành?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy bỏ'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);
        try {          
          const finalPayload = {
            ...medicalRecord,
            updatePatientMedicalHistory: true, 
            updatePatientAllergies: newAllergy.trim() !== '', 
            newAllergy: newAllergy.trim(),
            updatePatientDiseaseHistory: true, 
          };
          await medicalRecordService.updateMedicalRecord(medicalRecord.id, finalPayload);

          await appointmentService.updateStatus(medicalRecord.appointmentId, 'Completed');
          
          Swal.fire({
            title: 'Thành công!',
            text: 'Lịch khám đã được hoàn thành.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            setNewAllergy(''); 
            setMedicalRecord(prev => prev ? {
              ...prev,
              diagnosis: '',
              physicalExamination: '',
            } : null);
            navigate(-1);
          });
        } catch (err: any) {
          Swal.fire('Thất bại!', err.response?.data?.message || 'Không thể hoàn thành lịch khám. Vui lòng thử lại.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const isEditable = useMemo(() => {
    if (isBanned || !medicalRecord) return false;

    const blockedStatuses = ['MissedByPatient', 'MissedByDoctor', 'Completed', 'CancelledByPatient', 'CancelledByDoctor'];
    if (medicalRecord.statusAppointment && blockedStatuses.includes(medicalRecord.statusAppointment)) {
      return false;
    }

    return medicalRecord.statusAppointment === 'OnProgressing';
  }, [medicalRecord, isBanned]);

  const showActionButtons = useMemo(() => {
    if (!medicalRecord) return false;

    return medicalRecord.statusAppointment === "OnProgressing";
  }, [medicalRecord]);

  const showCancelButton = useMemo(() => {
    if (!medicalRecord) return false;

    const blockedStatuses = ['MissedByPatient', 'MissedByDoctor', 'Completed', 'CancelledByPatient', 'CancelledByDoctor', 'OnProgressing'];
    if (medicalRecord.statusAppointment && blockedStatuses.includes(medicalRecord.statusAppointment)) {
      return false;
    }

    return true;
  }, [medicalRecord]);

  const canCancelAppointment = useMemo(() => {
    if (!medicalRecord || !medicalRecord.appointmentStartDate || !medicalRecord.appointmentEndDate) return false;

    const now = new Date();
    const startDate = new Date(medicalRecord.appointmentStartDate);
    const endDate = new Date(medicalRecord.appointmentEndDate);

    return now >= startDate && now <= endDate;
  }, [medicalRecord]);

  const canComplete = useMemo(() => {
    if (!medicalRecord || !medicalRecord.appointmentEndDate) return false;

    const now = new Date();
    const endDate = new Date(medicalRecord.appointmentEndDate);
    const endDateMinus5Min = new Date(endDate.getTime() - 5 * 60 * 1000);
    const endDatePlus10Min = new Date(endDate.getTime() + 10 * 60 * 1000);

    const requiredFields: (keyof MedicalRecord)[] = [
      'diagnosis',          
      'treatmentPlan',      
    ];

    const allFieldsFilled = requiredFields.every(field => {
      const value = medicalRecord[field];
      return value && (typeof value === 'string' && value.trim() !== '');
    });

    
    return allFieldsFilled && now >= endDateMinus5Min && now <= endDatePlus10Min;
  }, [medicalRecord]);


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
        {!isEditable && medicalRecord.statusAppointment && ['MissedByPatient', 'MissedByDoctor', 'Completed', 'CancelledByPatient', 'CancelledByDoctor'].includes(medicalRecord.statusAppointment) && (
          <div style={{ 
            marginTop: '15px', 
            padding: '12px 20px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffc107', 
            borderRadius: '8px',
            color: '#856404',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '8px' }}></i>
            Hồ sơ bệnh án này không thể chỉnh sửa vì ca khám đã kết thúc với trạng thái: <strong>{statusDisplayNameMap[medicalRecord.statusAppointment] || medicalRecord.statusAppointment}</strong>
          </div>
        )}
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
            <label className="form-label">*Lý do khám</label>
            <textarea
              name="chiefComplaint"
              className={`form-textarea ${fieldErrors.chiefComplaint ? 'input-error' : ''}`}
              value={medicalRecord.chiefComplaint || ''}
              onClick={() => {
                if (isBanned) showBannedPopup();
              }}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              disabled
              rows={3} ></textarea>
            {fieldErrors.chiefComplaint && <p className="error-message">{fieldErrors.chiefComplaint}</p>}
          </div>
          <div className="form-column full-width">
            <label className="form-label">*Quá trình bệnh lý và diễn biến (Khám lâm sàng)</label>
            <textarea
              name="physicalExamination"
              className={`form-textarea ${fieldErrors.physicalExamination ? 'input-error' : ''}`}
              value={medicalRecord.physicalExamination || ''}
              onClick={() => {
                if (isBanned) showBannedPopup();
              }}
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
          <div className="form-column full-width">
            <label className="form-label">Bệnh sử</label>
            <div className="info-value-box" style={{ whiteSpace: 'pre-line', minHeight: '100px', maxHeight: '300px', overflowY: 'auto' }}>
              {medicalRecord.diseaseHistory || 'Không có'}
            </div>
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
            </div>
          )}
        </div>
      </section>

      <section className="form-section">
        <h3 className="section-title">IV. CHẨN ĐOÁN VÀ ĐIỀU TRỊ</h3>
        <div className="section-grid">
          <div className="form-column">
            <label className="form-label">*Chẩn đoán chính</label>
            <textarea
              name="diagnosis"
              className={`form-textarea ${fieldErrors.diagnosis ? 'input-error' : ''}`}
              value={medicalRecord.diagnosis || ''}
              onClick={() => {
                if (isBanned) showBannedPopup();
              }}
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
              value={medicalRecord.assessmentNotes || ''}
              onClick={() => {
                if (isBanned) showBannedPopup();
              }}
              disabled={!isEditable}
              onChange={handleFieldChange}
              rows={3} />
          </div>
          <div className="form-column full-width">
            <label className="form-label">*Kế hoạch điều trị</label>
            <textarea
              name="treatmentPlan"
              className={`form-textarea ${fieldErrors.treatmentPlan ? 'input-error' : ''}`}
              value={medicalRecord.treatmentPlan || ''}
              onClick={() => {
                if (isBanned) showBannedPopup();
              }}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              rows={4}
              disabled={!isEditable} />
            {fieldErrors.treatmentPlan && <p className="error-message">{fieldErrors.treatmentPlan}</p>}
          </div>
          <div className="form-column">
            <label className="form-label">Ghi chú của bác sĩ</label>
            <textarea
              name="doctorNotes"
              className="form-textarea"
              value={medicalRecord.doctorNotes || ''}
              onClick={() => {
                if (isBanned) showBannedPopup();
              }}
              disabled={!isEditable}
              onChange={handleFieldChange}
              rows={4} />
          </div>
          <div className="form-column">
            <label className="form-label">Hướng dẫn tái khám</label>
            <textarea
              name="followUpInstructions"
              className="form-textarea"
              value={medicalRecord.followUpInstructions || ''}
              onClick={() => {
                if (isBanned) showBannedPopup();
              }}
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
        <MedicineTable
          medicines={medicalRecord.prescriptions}
          onDelete={handleDeleteMedicine}
          onUpdate={handleUpdateMedicine}
          onSelectMedication={handleUpdateMedicineFields}
          isEditable={isEditable}
        />
      </section>

      <div className="form-footer">
        <div className="doctor-signature">
          <p>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
          <p><strong>Bác sĩ điều trị</strong></p>
          <p>(Ký và ghi rõ họ tên)</p>
          <br />
          <p>{user?.fullName}</p>
        </div>
        <div className="button-group">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Quay lại
          </button>
          {isEditable && (
            <>
              <button type="submit" className="btn-submit" disabled={isSubmitting} >
                {isSubmitting ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </button>
              {showActionButtons && (
                <button 
                  type="button" 
                  className="btn-complete" 
                  onClick={handleCompleteAppointment}
                  disabled={isSubmitting || !canComplete}
                  title={!canComplete ? 'Có thể hoàn thành từ 5 phút trước đến 10 phút sau khi kết thúc ca khám' : ''}
                >
                  Hoàn thành
                </button>
              )}
            </>
          )}
          {showCancelButton && (
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleCancelAppointment}
              disabled={isSubmitting || !canCancelAppointment}
              title={!canCancelAppointment ? 'Chỉ có thể hủy trong thời gian ca khám (từ giờ bắt đầu đến giờ kết thúc)' : ''}
            >
              Hủy lịch khám
            </button>
          )}
        </div>
      </div>
     
    </form>
  );
};

export default MedicalRecordDetails;