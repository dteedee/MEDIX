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
                  {doctorProfile?.imageURL && (
                    <img
                      src={doctorProfile.imageURL}
                      alt={appointment.doctorName}
                      className={styles.doctorAvatar}
                    />
                  )}
                  <div className={styles.doctorInfoDetails}>
                    <h4>{appointment.doctorName}</h4>
                    {doctorProfile?.title && (
                      <p className={styles.doctorTitle}>{doctorProfile.title}</p>
                    )}
                    {doctorProfile?.specializationName && (
                      <p className={styles.doctorSpecialty}>
                        <i className="bi bi-briefcase"></i>
                        {doctorProfile.specializationName}
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

              {/* Chief Complaint */}
              {medicalRecord.chiefComplaint && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <i className="bi bi-chat-left-text"></i>
                    <h3>Lý do khám</h3>
                  </div>
                  <div className={styles.modalSectionContent}>
                    <p>{medicalRecord.chiefComplaint}</p>
                  </div>
                </div>
              )}

              {/* Physical Examination */}
              {medicalRecord.physicalExamination && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <i className="bi bi-heart-pulse"></i>
                    <h3>Khám lâm sàng</h3>
                  </div>
                  <div className={styles.modalSectionContent}>
                    <p>{medicalRecord.physicalExamination}</p>
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              {medicalRecord.diagnosis && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <i className="bi bi-clipboard-check"></i>
                    <h3>Chẩn đoán</h3>
                  </div>
                  <div className={styles.modalSectionContent}>
                    <div className={styles.diagnosisBox}>
                      <p>{medicalRecord.diagnosis}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Plan */}
              {medicalRecord.treatmentPlan && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <i className="bi bi-file-medical"></i>
                    <h3>Kế hoạch điều trị</h3>
                  </div>
                  <div className={styles.modalSectionContent}>
                    <p>{medicalRecord.treatmentPlan}</p>
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {medicalRecord.prescriptions && medicalRecord.prescriptions.length > 0 && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <i className="bi bi-capsule"></i>
                    <h3>Đơn thuốc</h3>
                  </div>
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
                </div>
              )}

              {/* Follow-up Instructions */}
              {medicalRecord.followUpInstructions && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <i className="bi bi-arrow-repeat"></i>
                    <h3>Hướng dẫn tái khám</h3>
                  </div>
                  <div className={styles.modalSectionContent}>
                    <p>{medicalRecord.followUpInstructions}</p>
                  </div>
                </div>
              )}

              {/* Doctor Notes */}
              {medicalRecord.doctorNotes && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <i className="bi bi-sticky"></i>
                    <h3>Ghi chú của bác sĩ</h3>
                  </div>
                  <div className={styles.modalSectionContent}>
                    <p>{medicalRecord.doctorNotes}</p>
                  </div>
                </div>
              )}
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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Load results
  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all patient appointments
        const appointments = await appointmentService.getPatientAppointments();

        // Filter appointments: today and completed
        const today = getTodayDate();
        const todayAppointments = appointments.filter((apt) => {
          const appointmentDate = new Date(apt.appointmentStartTime);
          const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
          return (
            appointmentDateStr === today &&
            (apt.statusCode === 'COMPLETED' || apt.statusCode === 'Completed')
          );
        });

        // Create result items
        const resultItems: ResultItem[] = todayAppointments.map((apt) => ({
          appointment: apt,
          medicalRecord: null,
          doctorProfile: null,
          loading: true,
        }));

        setResults(resultItems);

        // Load medical records and doctor profiles for each appointment
        for (let i = 0; i < resultItems.length; i++) {
          const item = resultItems[i];
          try {
            // Load medical record
            let medicalRecord: MedicalRecord | null = null;
            try {
              medicalRecord = await medicalRecordService.getMedicalRecordByAppointmentId(item.appointment.id);
            } catch (err: any) {
              // Medical record might not exist yet
              if (err.response?.status !== 404) {
                console.error('Error loading medical record:', err);
              }
            }

            // Load doctor profile
            let doctorProfile: DoctorProfileDto | null = null;
            if (item.appointment.doctorID) {
              try {
                doctorProfile = await doctorService.getDoctorProfile(item.appointment.doctorID);
              } catch (err) {
                console.error('Error loading doctor profile:', err);
              }
            }

            // Update the specific result item
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
            console.error('Error loading result details:', err);
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
        console.error('Error loading results:', err);
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

  // Filter results that have medical records
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
                      {result.doctorProfile?.imageURL ? (
                        <img
                          src={result.doctorProfile.imageURL}
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
                        {result.doctorProfile?.title && (
                          <p className={styles.doctorTitle}>{result.doctorProfile.title}</p>
                        )}
                        {result.doctorProfile?.specializationName && (
                          <p className={styles.doctorSpecialty}>
                            <i className="bi bi-briefcase"></i>
                            {result.doctorProfile.specializationName}
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
