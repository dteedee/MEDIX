import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../styles/patient/PatientResults.module.css';
import { appointmentService } from '../../services/appointmentService';
import { medicalRecordService } from '../../services/medicalRecordService';
import { Appointment } from '../../types/appointment.types';
import { MedicalRecord } from '../../types/medicalRecord.types';
import doctorService from '../../services/doctorService';
import { DoctorProfileDto } from '../../types/doctor.types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ResultItem {
  appointment: Appointment;
  medicalRecord: MedicalRecord | null;
  doctorProfile: DoctorProfileDto | null;
  loading: boolean;
}

interface ResultDetailModalProps {
  result: ResultItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ResultDetailModal: React.FC<ResultDetailModalProps> = ({ result, isOpen, onClose }) => {
  if (!isOpen || !result) return null;

  const { medicalRecord, appointment, doctorProfile } = result;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <i className="bi bi-clipboard-data"></i>
            Chi tiết kết quả khám
          </h2>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          {medicalRecord ? (
            <>
              {/* Doctor Info */}
              <div className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <i className="bi bi-person-badge"></i>
                  <h3>Thông tin bác sĩ</h3>
                </div>
                <div className={styles.doctorInfoCard}>
                  {doctorProfile?.avatarUrl && (
                    <img
                      src={doctorProfile.avatarUrl}
                      alt={appointment.doctorName}
                      className={styles.doctorAvatar}
                    />
                  )}
                  <div className={styles.doctorInfoDetails}>
                    <h4>{appointment.doctorName}</h4>
                    {doctorProfile?.education && (
                      <p className={styles.doctorTitle}>{doctorProfile.education}</p>
                    )}
                    {doctorProfile?.specialization && (
                      <p className={styles.doctorSpecialty}>
                        <i className="bi bi-briefcase"></i>
                        {doctorProfile.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <div className={styles.modalSection}>
                <div className={styles.modalSectionHeader}>
                  <i className="bi bi-calendar-event"></i>
                  <h3>Thông tin cuộc hẹn</h3>
                </div>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      <i className="bi bi-calendar3"></i>
                      Ngày khám:
                    </span>
                    <span className={styles.infoValue}>{formatDate(appointment.appointmentStartTime)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      <i className="bi bi-clock"></i>
                      Giờ khám:
                    </span>
                    <span className={styles.infoValue}>
                      {formatTime(appointment.appointmentStartTime)} - {formatTime(appointment.appointmentEndTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* I. LÝ DO VÀO VIỆN VÀ BỆNH SỬ */}
              <div className={styles.modalSectionGroup}>
                <h4 className={styles.sectionGroupTitle}>
                  <i className="bi bi-file-text"></i>
                  I. LÝ DO VÀO VIỆN VÀ BỆNH SỬ
                </h4>
                <div className={styles.sectionGroupContent}>
                  <div className={styles.modalSection}>
                    <div className={styles.modalSectionHeader}>
                      <i className="bi bi-chat-left-text"></i>
                      <h3>Lý do khám</h3>
                    </div>
                    <div className={styles.modalSectionContent}>
                      <p>{medicalRecord.chiefComplaint || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={styles.modalSection}>
                    <div className={styles.modalSectionHeader}>
                      <i className="bi bi-activity"></i>
                      <h3>Quá trình bệnh lý và diễn biến (Khám lâm sàng)</h3>
                    </div>
                    <div className={styles.modalSectionContent}>
                      <p>{medicalRecord.physicalExamination || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* II. CHẨN ĐOÁN VÀ ĐIỀU TRỊ */}
              <div className={styles.modalSectionGroup}>
                <h4 className={styles.sectionGroupTitle}>
                  <i className="bi bi-clipboard2-pulse"></i>
                  II. CHẨN ĐOÁN VÀ ĐIỀU TRỊ
                </h4>
                <div className={styles.sectionGroupContent}>
                  <div className={styles.sectionRow}>
                    <div className={styles.modalSection}>
                      <div className={styles.modalSectionHeader}>
                        <i className="bi bi-clipboard-check"></i>
                        <h3>Chẩn đoán chính</h3>
                      </div>
                      <div className={styles.modalSectionContent}>
                        <div className={styles.diagnosisBox}>
                          <p>{medicalRecord.diagnosis || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className={styles.modalSection}>
                      <div className={styles.modalSectionHeader}>
                        <i className="bi bi-journal-text"></i>
                        <h3>Ghi chú đánh giá</h3>
                      </div>
                      <div className={styles.modalSectionContent}>
                        <p>{medicalRecord.assessmentNotes || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.modalSection}>
                    <div className={styles.modalSectionHeader}>
                      <i className="bi bi-file-medical"></i>
                      <h3>Kế hoạch điều trị</h3>
                    </div>
                    <div className={styles.modalSectionContent}>
                      <p>{medicalRecord.treatmentPlan || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={styles.sectionRow}>
                    <div className={styles.modalSection}>
                      <div className={styles.modalSectionHeader}>
                        <i className="bi bi-pencil-square"></i>
                        <h3>Ghi chú của bác sĩ</h3>
                      </div>
                      <div className={styles.modalSectionContent}>
                        <p>{medicalRecord.doctorNotes || 'N/A'}</p>
                      </div>
                    </div>
                    <div className={styles.modalSection}>
                      <div className={styles.modalSectionHeader}>
                        <i className="bi bi-calendar-check"></i>
                        <h3>Hướng dẫn tái khám</h3>
                      </div>
                      <div className={styles.modalSectionContent}>
                        <p>{medicalRecord.followUpInstructions || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* III. ĐƠN THUỐC */}
              <div className={styles.modalSectionGroup}>
                <h4 className={styles.sectionGroupTitle}>
                  <i className="bi bi-capsule"></i>
                  III. ĐƠN THUỐC
                </h4>
                <div className={styles.sectionGroupContent}>
                  {medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0 ? (
                    <div className={styles.prescriptionsList}>
                      {medicalRecord.prescriptions.map((prescription, index) => (
                        <div key={prescription.id || index} className={styles.prescriptionItem}>
                          <div className={styles.prescriptionHeader}>
                            <h4>{prescription.medicationName}</h4>
                            {prescription.genericName && (
                              <span className={styles.genericName}>({prescription.genericName})</span>
                            )}
                          </div>
                          <div className={styles.prescriptionDetails}>
                            <div className={styles.prescriptionDetailItem}>
                              <i className="bi bi-droplet"></i>
                              <span><strong>Liều lượng:</strong> {prescription.dosage}</span>
                            </div>
                            <div className={styles.prescriptionDetailItem}>
                              <i className="bi bi-arrow-repeat"></i>
                              <span><strong>Tần suất:</strong> {prescription.frequency}</span>
                            </div>
                            <div className={styles.prescriptionDetailItem}>
                              <i className="bi bi-calendar-range"></i>
                              <span><strong>Thời gian:</strong> {prescription.duration}</span>
                            </div>
                            {prescription.instructions && (
                              <div className={styles.prescriptionInstructions}>
                                <i className="bi bi-info-circle"></i>
                                <span>{prescription.instructions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.modalSectionContent}>
                      <p>N/A</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.modalEmptyState}>
              <i className="bi bi-file-x"></i>
              <p>Chưa có kết quả khám chi tiết</p>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalCloseButton} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export const PatientResults: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const appointments = await appointmentService.getPatientAppointments();

        const today = getTodayDate();
        const todayAppointments = appointments.filter((apt) => {
          const appointmentDate = new Date(apt.appointmentStartTime);
          const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
          return (
            appointmentDateStr === today &&
            (apt.statusCode === 'COMPLETED' || apt.statusCode === 'Completed')
          );
        });

        const resultItems: ResultItem[] = todayAppointments.map((apt) => ({
          appointment: apt,
          medicalRecord: null,
          doctorProfile: null,
          loading: true,
        }));

        setResults(resultItems);

        for (let i = 0; i < resultItems.length; i++) {
          const item = resultItems[i];
          try {
            let medicalRecord: MedicalRecord | null = null;
            try {
              medicalRecord = await medicalRecordService.getMedicalRecordByAppointmentId(item.appointment.id);
            } catch (err: any) {
              if (err.response?.status !== 404) {

              }
            }

            let doctorProfile: DoctorProfileDto | null = null;
            if (item.appointment.doctorID) {
              try {
                doctorProfile = await doctorService.getDoctorProfile(item.appointment.doctorID);
              } catch (err) {
              }
            }

            setResults((prev) => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                medicalRecord,
                doctorProfile,
                loading: false,
              };
              return updated;
            });
          } catch (err) {
            setResults((prev) => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                loading: false,
              };
              return updated;
            });
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải kết quả khám');
        showToast('Không thể tải kết quả khám', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [showToast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetail = (result: ResultItem) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const resultsWithRecords = useMemo(() => {
    return results.filter((result) => result.medicalRecord !== null && !result.loading);
  }, [results]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>
            <i className="bi bi-clipboard-data"></i>
            Xem kết quả
          </h1>
          <p>Kết quả khám bệnh trong ngày hôm nay</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải kết quả khám...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={styles.errorState}>
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      )}

      {/* Results List */}
      {!loading && !error && (
        <>
          {resultsWithRecords.length > 0 ? (
            <div className={styles.resultsGrid}>
              {resultsWithRecords.map((result) => (
                <div
                  key={result.appointment.id}
                  className={styles.resultCard}
                  onClick={() => handleViewDetail(result)}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardIcon}>
                      <i className="bi bi-clipboard-check"></i>
                    </div>
                    <div className={styles.cardHeaderInfo}>
                      <h3>Kết quả khám</h3>
                      <span className={styles.cardDate}>
                        {formatDate(result.appointment.appointmentStartTime)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    {/* Doctor Info */}
                    <div className={styles.doctorSection}>
                      {result.doctorProfile?.avatarUrl ? (
                        <img
                          src={result.doctorProfile.avatarUrl}
                          alt={result.appointment.doctorName}
                          className={styles.doctorAvatar}
                        />
                      ) : (
                        <div className={styles.doctorAvatarPlaceholder}>
                          <i className="bi bi-person-circle"></i>
                        </div>
                      )}
                      <div className={styles.doctorInfo}>
                        <h4>{result.appointment.doctorName}</h4>
                        {result.doctorProfile?.education && (
                          <p className={styles.doctorTitle}>{result.doctorProfile.education}</p>
                        )}
                        {result.doctorProfile?.specialization && (
                          <p className={styles.doctorSpecialty}>
                            <i className="bi bi-briefcase"></i>
                            {result.doctorProfile.specialization}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Appointment Time */}
                    <div className={styles.appointmentTime}>
                      <i className="bi bi-clock"></i>
                      <span>
                        {formatTime(result.appointment.appointmentStartTime)} -{' '}
                        {formatTime(result.appointment.appointmentEndTime)}
                      </span>
                    </div>

                    {/* Diagnosis Preview */}
                    {result.medicalRecord?.diagnosis && (
                      <div className={styles.diagnosisPreview}>
                        <div className={styles.diagnosisLabel}>
                          <i className="bi bi-clipboard-check"></i>
                          Chẩn đoán:
                        </div>
                        <p className={styles.diagnosisText}>{result.medicalRecord.diagnosis}</p>
                      </div>
                    )}

                    {/* Prescriptions Count */}
                    {result.medicalRecord?.prescriptions && result.medicalRecord.prescriptions.length > 0 && (
                      <div className={styles.prescriptionsBadge}>
                        <i className="bi bi-capsule"></i>
                        <span>{result.medicalRecord.prescriptions.length} đơn thuốc</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <button className={styles.viewDetailBtn}>
                      Xem chi tiết
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <i className="bi bi-clipboard-x"></i>
              </div>
              <h3>Chưa có kết quả khám</h3>
              <p>
                {results.length > 0
                  ? 'Bác sĩ chưa trả kết quả khám cho các cuộc hẹn hôm nay. Vui lòng quay lại sau.'
                  : 'Bạn chưa có cuộc hẹn nào đã hoàn thành trong ngày hôm nay.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <ResultDetailModal
        result={selectedResult}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};
