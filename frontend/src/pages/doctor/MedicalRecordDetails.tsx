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

  // Map statusCode sang tiếng Việt
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
    let processedValue = value;

    if (name === 'diagnosis' && value) {
      const diagnoses = value.split(',').map(d => d.trim()).filter(d => d !== '');
      const uniqueDiagnosesMap = new Map<string, string>(); // Map lowercased diagnosis to its first-seen original case

      for (const diagnosis of diagnoses) {
        const lowerCaseDiagnosis = diagnosis.toLowerCase();
        if (!uniqueDiagnosesMap.has(lowerCaseDiagnosis)) {
          uniqueDiagnosesMap.set(lowerCaseDiagnosis, diagnosis);
        }
      }
      processedValue = Array.from(uniqueDiagnosesMap.values()).join(', ');
      handleUpdateField(name, processedValue); // Update the field with the cleaned value
    }

    // Validate the potentially processedValue (if diagnosis) or original value
    const error = validateField(name, processedValue);
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

  const handleUpdateMedicineFields = (id: string, updates: Partial<Prescription>) => {
    handleUpdateField(
      'prescriptions',
      medicalRecord?.prescriptions.map((med) => (med.id === id ? { ...med, ...updates } : med))
    );
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

    // Lưu tạm thời (không cập nhật tiền sử bệnh, khám lâm sàng)
    setIsSubmitting(true);
    try {          
      const payload = {
        ...medicalRecord,
        updatePatientMedicalHistory: false, // Chỉ lưu tạm thôi
        updatePatientAllergies: false,
        newAllergy: newAllergy.trim(),
        updatePatientDiseaseHistory: false, // Chỉ lưu tạm thôi
      };
      await medicalRecordService.updateMedicalRecord(medicalRecord.id, payload);

      Swal.fire({
        title: 'Thành công!',
        text: 'Hồ sơ bệnh án đã được cập nhật.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        // Không navigate, giữ lại ở trang để người dùng có thể tiếp tục chỉnh sửa
      });
    } catch (err) {
      console.error("Failed to update medical record:", err);
      Swal.fire('Thất bại!', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para cancelar a consulta (status: MissedByPatient)
  const handleCancelAppointment = async () => {
    if (!medicalRecord) return;

    // Validar se pode cancelar (apenas até startTime + 30 minutos)
    if (!canCancelAppointment) {
      if (medicalRecord.appointmentStartDate) {
        const now = new Date();
        const startDate = new Date(medicalRecord.appointmentStartDate);
        const startDatePlus30Min = new Date(startDate.getTime() + 30 * 60 * 1000);
        
        if (now > startDatePlus30Min) {
          const minutesPassed = Math.ceil((now.getTime() - startDatePlus30Min.getTime()) / 60000);
          Swal.fire({
            title: 'Không thể hủy',
            html: `Đã quá thời gian cho phép hủy lịch khám.<br/>Chỉ có thể hủy trong vòng <b>30 phút</b> sau khi bắt đầu ca khám.<br/>Đã qua <b>${minutesPassed} phút</b>.`,
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
          // Chama a API UpdateStatus com status "MissedByPatient"
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
          console.error("Failed to cancel appointment:", err);
          Swal.fire('Thất bại!', err.response?.data?.message || 'Không thể hủy lịch khám. Vui lòng thử lại.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  // Função para completar a consulta (status: Completed)
  const handleCompleteAppointment = async () => {
    if (!medicalRecord) return;

    // Validar campos obrigatórios E janela de tempo
    if (!canComplete) {
      // Verificar campos obrigatórios
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

      // Verificar janela de tempo (endTime - 5min até endTime + 10min)
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
          // 1. Gửi yêu cầu cập nhật hồ sơ lần cuối với cọc updatePatientMedicalHistory = true
          // để backend cộng dồn chẩn đoán vào tiền sử bệnh của bệnh nhân.
          const finalPayload = {
            ...medicalRecord,
            updatePatientMedicalHistory: true, // Lưu chẩn đoán vào DB
            updatePatientAllergies: newAllergy.trim() !== '', // Cập nhật dị ứng nếu có
            newAllergy: newAllergy.trim(),
            updatePatientDiseaseHistory: true, // Luôn set true, backend sẽ check dữ liệu
          };
          await medicalRecordService.updateMedicalRecord(medicalRecord.id, finalPayload);

          // 2. Sau khi lưu thành công, cập nhật trạng thái cuộc hẹn thành "Completed"
          await appointmentService.updateStatus(medicalRecord.appointmentId, 'Completed');
          
          Swal.fire({
            title: 'Thành công!',
            text: 'Lịch khám đã được hoàn thành.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            setNewAllergy(''); // Reset dị ứng vừa nhập
            // Reset medicalRecord để input xóa sạch
            setMedicalRecord(prev => prev ? {
              ...prev,
              diagnosis: '',
              physicalExamination: '',
            } : null);
            navigate(-1);
          });
        } catch (err: any) {
          console.error("Failed to complete appointment:", err);
          Swal.fire('Thất bại!', err.response?.data?.message || 'Không thể hoàn thành lịch khám. Vui lòng thử lại.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  // Xác định xem hồ sơ có được phép chỉnh sửa hay không
  // LOGIC: Chỉ dựa vào status của appointment
  const isEditable = useMemo(() => {
    if (isBanned || !medicalRecord) return false;

    // Không cho phép chỉnh sửa nếu status là các trạng thái đã kết thúc
    const blockedStatuses = ['MissedByPatient', 'MissedByDoctor', 'Completed', 'CancelledByPatient', 'CancelledByDoctor'];
    if (medicalRecord.statusAppointment && blockedStatuses.includes(medicalRecord.statusAppointment)) {
      return false;
    }

    // Cho phép chỉnh sửa nếu status là OnProgressing
    return medicalRecord.statusAppointment === 'OnProgressing';
  }, [medicalRecord, isBanned]);

  // Verificar se os botões "Hủy lịch khám" e "Hoàn thành" devem ser exibidos
  const showActionButtons = useMemo(() => {
    if (!medicalRecord) return false;

    // Botões aparecem APENAS se o status é "OnProgressing"
    return medicalRecord.statusAppointment === "OnProgressing";
  }, [medicalRecord]);

  // Verificar se o botão "Hủy" pode ser habilitado
  // Pode clicar apenas até startTime + 30 minutos
  const canCancelAppointment = useMemo(() => {
    if (!medicalRecord || !medicalRecord.appointmentStartDate) return false;

    const now = new Date();
    const startDate = new Date(medicalRecord.appointmentStartDate);
    const startDatePlus30Min = new Date(startDate.getTime() + 30 * 60 * 1000);

    console.log('=== VALIDAÇÃO BOTÃO HỦY ===');
    console.log('Giờ hiện tại:', now.toISOString());
    console.log('Start time:', startDate.toISOString());
    console.log('Start time + 30min:', startDatePlus30Min.toISOString());
    console.log('Pode cancelar?', now <= startDatePlus30Min);

    // Pode cancelar apenas até startTime + 30 minutos
    return now <= startDatePlus30Min;
  }, [medicalRecord]);

  // Verificar se o botão "Hoàn thành" pode ser habilitado
  // Pode clicar entre endTime - 5 minutos e endTime + 10 minutos
  const canComplete = useMemo(() => {
    if (!medicalRecord || !medicalRecord.appointmentEndDate) return false;

    const now = new Date();
    const endDate = new Date(medicalRecord.appointmentEndDate);
    const endDateMinus5Min = new Date(endDate.getTime() - 5 * 60 * 1000);
    const endDatePlus10Min = new Date(endDate.getTime() + 10 * 60 * 1000);

    // Verificar se os campos obrigatórios da seção IV estão preenchidos
    const requiredFields: (keyof MedicalRecord)[] = [
      'diagnosis',          // Chẩn đoán chính
      'treatmentPlan',      // Kế hoạch điều trị
    ];

    const allFieldsFilled = requiredFields.every(field => {
      const value = medicalRecord[field];
      return value && (typeof value === 'string' && value.trim() !== '');
    });

    console.log('=== VALIDAÇÃO BOTÃO HOÀN THÀNH ===');
    console.log('Giờ hiện tại:', now.toISOString());
    console.log('End time - 5min:', endDateMinus5Min.toISOString());
    console.log('End time:', endDate.toISOString());
    console.log('End time + 10min:', endDatePlus10Min.toISOString());
    console.log('Campos preenchidos?', allFieldsFilled);
    console.log('Trong khung giờ?', now >= endDateMinus5Min && now <= endDatePlus10Min);
    console.log('Pode completar?', allFieldsFilled && now >= endDateMinus5Min && now <= endDatePlus10Min);

    // Botão habilitado se:
    // 1. Todos os campos obrigatórios estão preenchidos
    // 2. Está entre endTime - 5min e endTime + 10min
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
              disabled={!isEditable} // Vô hiệu hóa nếu không được phép chỉnh sửa
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
                <>
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={handleCancelAppointment}
                    disabled={isSubmitting || !canCancelAppointment}
                    title={!canCancelAppointment ? 'Chỉ có thể hủy trong vòng 30 phút sau khi bắt đầu ca khám' : ''}
                  >
                    Hủy lịch khám
                  </button>
                  <button 
                    type="button" 
                    className="btn-complete" 
                    onClick={handleCompleteAppointment}
                    disabled={isSubmitting || !canComplete}
                    title={!canComplete ? 'Có thể hoàn thành từ 5 phút trước đến 10 phút sau khi kết thúc ca khám' : ''}
                  >
                    Hoàn thành
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
     
    </form>
  );
};

export default MedicalRecordDetails;