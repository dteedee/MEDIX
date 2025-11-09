import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/walletService';
import { WalletDto } from '../../types/wallet.types';
import { appointmentService } from '../../services/appointmentService';
import { medicalRecordService } from '../../services/medicalRecordService';
import doctorService from '../../services/doctorService';
import { Appointment } from '../../types/appointment.types';
import { MedicalRecordDto } from '../../types/medicalRecord.types';
import { DoctorProfileDto } from '../../types/doctor.types';
import styles from '../../styles/patient/PatientDashboard.module.css';
import modalStyles from '../../styles/patient/PatientAppointments.module.css';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordDto[]>([]);
  const [doctorProfiles, setDoctorProfiles] = useState<Map<string, DoctorProfileDto>>(new Map());
  const [loadingDoctors, setLoadingDoctors] = useState<Set<string>>(new Set());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [walletData, appointmentsData, medicalRecordsData] = await Promise.all([
          walletService.getWalletByUserId().catch(() => null),
          appointmentService.getPatientAppointments().catch(() => []),
          medicalRecordService.getMedicalRecordsOfPatient({
            dateFrom: null,
            dateTo: null
          }).catch(() => [])
        ]);
        
        setWallet(walletData);
        setAppointments(appointmentsData);
        setMedicalRecords(medicalRecordsData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatBalance = (balance: number, currency: string): string => {
    const formatted = new Intl.NumberFormat('vi-VN').format(balance);
    return `${formatted} ${currency}`;
  };

  const now = new Date();
  
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentStartTime);
    const isUpcoming = apt.statusCode === 'Confirmed' || apt.statusCode === 'OnProgressing';
    return aptDate >= now && isUpcoming;
  }).sort((a, b) => 
    new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime()
  );

  const todayAppointments = upcomingAppointments.filter(apt => {
    const aptDate = new Date(apt.appointmentStartTime);
    return aptDate.toDateString() === now.toDateString();
  });

  const completedAppointments = appointments.filter(apt => apt.statusCode === 'Completed');
  
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentStartTime);
    return aptDate >= thisMonthStart;
  });

  const aiResults = appointments.filter(apt => apt.aiSymptomAnalysisId);
  
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentStartTime);
    return aptDate >= lastMonthStart && aptDate <= lastMonthEnd;
  });

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString: string): string => {
    return `${formatTime(dateString)} - ${formatDate(dateString)}`;
  };

  const getTimeUntil = (dateString: string): string => {
    const date = new Date(dateString);
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} ngày nữa`;
    if (hours > 0) return `${hours} giờ nữa`;
    return 'Sắp diễn ra';
  };

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const startFormatted = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    if (endTime) {
      const end = new Date(endTime);
      const endFormatted = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${startFormatted} - ${endFormatted}`;
    }
    
    return startFormatted;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getAppointmentStatus = (apt: Appointment): 'upcoming' | 'completed' | 'cancelled' => {
    if (apt.statusCode === 'Completed') {
      return 'completed';
    } else if (
      apt.statusCode === 'CancelledByPatient' || 
      apt.statusCode === 'CancelledByDoctor' || 
      apt.statusCode === 'NoShow'
    ) {
      return 'cancelled';
    }
    return 'upcoming';
  };

  const getStatusConfig = (status: 'upcoming' | 'completed' | 'cancelled', appointmentStartTime?: string, appointmentEndTime?: string) => {
    const currentTime = new Date();
    
    // Check if appointment is currently in progress
    const isInProgress = appointmentStartTime && appointmentEndTime && 
      currentTime >= new Date(appointmentStartTime) && 
      currentTime <= new Date(appointmentEndTime);
    
    const configs = {
      upcoming: { 
        label: isInProgress ? 'Đang diễn ra' : 'Sắp diễn ra', 
        icon: 'bi-clock-history',
        color: '#f59e0b'
      },
      completed: { 
        label: 'Hoàn thành', 
        icon: 'bi-check-circle-fill',
        color: '#10b981'
      },
      cancelled: { 
        label: 'Đã hủy', 
        icon: 'bi-x-circle-fill',
        color: '#ef4444'
      }
    };
    return configs[status];
  };

  const getPaymentStatusLabel = (statusCode?: string): string => {
    if (!statusCode) return 'Chưa thanh toán';
    
    const statusMap: { [key: string]: string } = {
      'Paid': 'Đã thanh toán',
      'Unpaid': 'Chưa thanh toán',
      'Pending': 'Đang chờ thanh toán',
      'Failed': 'Thanh toán thất bại',
      'Refunded': 'Đã hoàn tiền',
      'Cancelled': 'Đã hủy'
    };
    
    return statusMap[statusCode] || statusCode;
  };

  const getPaymentStatusIcon = (statusCode?: string): string => {
    if (!statusCode) return 'bi-x-circle';
    
    const iconMap: { [key: string]: string } = {
      'Paid': 'bi-check-circle-fill',
      'Unpaid': 'bi-x-circle',
      'Pending': 'bi-clock-history',
      'Failed': 'bi-exclamation-triangle-fill',
      'Refunded': 'bi-arrow-counterclockwise',
      'Cancelled': 'bi-x-circle-fill'
    };
    
    return iconMap[statusCode] || 'bi-info-circle';
  };

  const formatDetailDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Load doctor profiles for upcoming appointments
  useEffect(() => {
    const loadDoctorProfiles = async () => {
      const uniqueDoctorIds = Array.from(
        new Set(upcomingAppointments.filter(apt => apt.doctorID).map(apt => apt.doctorID!))
      );

      for (const doctorID of uniqueDoctorIds) {
        if (doctorProfiles.has(doctorID) || loadingDoctors.has(doctorID)) {
          continue;
        }

        try {
          setLoadingDoctors(prev => new Set(prev).add(doctorID));
          const profile = await doctorService.getDoctorProfile(doctorID);
          setDoctorProfiles(prev => {
            const newMap = new Map(prev);
            newMap.set(doctorID, profile);
            return newMap;
          });
        } catch (err) {
          console.error(`Error loading doctor profile for ${doctorID}:`, err);
        } finally {
          setLoadingDoctors(prev => {
            const newSet = new Set(prev);
            newSet.delete(doctorID);
            return newSet;
          });
        }
      }
    };

    if (upcomingAppointments.length > 0) {
      loadDoctorProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingAppointments]);

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeContent}>
          <div className={styles.greetingSection}>
            <span className={styles.greetingIcon}>
              {now.getHours() < 12 ? '🌅' : now.getHours() < 18 ? '☀️' : '🌙'}
            </span>
            <div>
              <h1 className={styles.greeting}>{getGreeting()}</h1>
              <p className={styles.userName}>{user?.fullName || 'Bệnh nhân'}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.walletCard} onClick={() => navigate('/app/patient/finance')}>
              <div className={styles.walletIcon}>
                <i className="bi bi-wallet2"></i>
              </div>
              <div className={styles.walletInfo}>
                <span className={styles.walletLabel}>Số dư ví</span>
                {loading ? (
                  <span className={styles.walletAmount}>...</span>
                ) : wallet ? (
                  <span className={styles.walletAmount}>
                    {formatBalance(wallet.balance, wallet.currency)}
                  </span>
                ) : (
                  <span className={styles.walletAmount}>0 ₫</span>
                )}
              </div>
              <button className={styles.addMoneyBtn} onClick={(e) => {
                e.stopPropagation();
                navigate('/app/patient/finance');
              }}>
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
            <div className={styles.dateCard}>
              <i className="bi bi-calendar-event"></i>
              <div>
                <span className={styles.dateLabel}>Hôm nay</span>
                <span className={styles.dateValue}>
                  {now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.statCard} onClick={() => navigate('/app/patient/appointments')}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <i className="bi bi-calendar-check"></i>
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Lịch hẹn sắp tới</span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{upcomingAppointments.length}</span>
              {todayAppointments.length > 0 && (
                <span className={styles.statBadge}>
                  <i className="bi bi-clock"></i>
                  {todayAppointments.length} hôm nay
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => navigate('/app/patient/emr-timeline')}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <i className="bi bi-file-medical"></i>
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Hồ sơ bệnh án</span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{medicalRecords.length}</span>
              <span className={styles.statSubtext}>hồ sơ</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => navigate('/app/patient/appointments')}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <i className="bi bi-check-circle"></i>
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Đã hoàn thành</span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{completedAppointments.length}</span>
              <span className={styles.statSubtext}>lịch khám</span>
            </div>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => navigate('/app/patient/ai-checkup')}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIconBg} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <i className="bi bi-robot"></i>
            </div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Phân tích AI</span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>{aiResults.length}</span>
              <span className={styles.statSubtext}>kết quả</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Upcoming Appointments */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-calendar-heart"></i>
                <h2>Lịch hẹn sắp tới</h2>
              </div>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/app/patient/appointments')}
              >
                Xem tất cả
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang tải...</p>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className={styles.appointmentsList}>
                {upcomingAppointments.slice(0, 3).map((apt, index) => {
                  const doctorProfile = apt.doctorID ? doctorProfiles.get(apt.doctorID) : null;
                  const avatarUrl = doctorProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName)}&background=667eea&color=fff`;
                  const education = doctorProfile?.education || '';
                  const specialization = doctorProfile?.specialization || '';
                  const specialtyText = education && specialization 
                    ? `${education} - ${specialization}`
                    : education || specialization || 'Bác sĩ chuyên khoa';

                  return (
                    <div 
                      key={apt.id} 
                      className={styles.appointmentItem}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setShowDetailModal(true);
                      }}
                    >
                      <div className={styles.appointmentLeft}>
                        <div className={styles.doctorAvatarLarge}>
                          <img 
                            src={avatarUrl}
                            alt={apt.doctorName}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName)}&background=667eea&color=fff`;
                            }}
                          />
                          <div className={styles.onlineBadge}></div>
                        </div>
                        <div className={styles.appointmentDetails}>
                          <h4>{apt.doctorName}</h4>
                          <p className={styles.specialty}>{specialtyText}</p>
                          <div className={styles.appointmentMeta}>
                            <span className={styles.metaItem}>
                              <i className="bi bi-clock"></i>
                              {formatTime(apt.appointmentStartTime)}
                            </span>
                            <span className={styles.metaItem}>
                              <i className="bi bi-calendar3"></i>
                              {formatDate(apt.appointmentStartTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.appointmentRight}>
                        <div className={styles.timeUntil}>
                          <i className="bi bi-hourglass-split"></i>
                          {getTimeUntil(apt.appointmentStartTime)}
                        </div>
                        <button 
                          className={styles.viewDetailsBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(apt);
                            setShowDetailModal(true);
                          }}
                        >
                          <i className="bi bi-arrow-right-circle"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-calendar-x"></i>
                </div>
                <h3>Chưa có lịch hẹn</h3>
                <p>Đặt lịch khám với bác sĩ ngay hôm nay</p>
                <button 
                  className={styles.primaryBtn}
                  onClick={() => navigate('/doctors')}
                >
                  <i className="bi bi-plus-circle"></i>
                  Đặt lịch khám
                </button>
              </div>
            )}
          </div>

          {/* Health Summary */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-activity"></i>
                <h2>Tổng quan sức khỏe</h2>
              </div>
            </div>
            
            <div className={styles.healthMetrics}>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>Lịch khám tháng này</span>
                  <span className={styles.metricValue}>{thisMonthAppointments.length}</span>
                  {(() => {
                    const trend = calculateTrend(thisMonthAppointments.length, lastMonthAppointments.length);
                    return trend !== 0 ? (
                      <span className={`${styles.metricTrend} ${trend > 0 ? styles.trendUp : styles.trendDown}`}>
                        <i className={`bi bi-arrow-${trend > 0 ? 'up' : 'down'}`}></i>
                        {Math.abs(trend)}% so với tháng trước
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <i className="bi bi-heart-pulse"></i>
                </div>
                <div className={styles.metricInfo}>
                  <span className={styles.metricLabel}>Lần khám gần nhất</span>
                  <span className={styles.metricValue}>
                    {completedAppointments.length > 0 
                      ? formatDate(completedAppointments[completedAppointments.length - 1].appointmentStartTime)
                      : 'Chưa có'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Quick Actions */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-lightning-charge"></i>
                <h2>Thao tác nhanh</h2>
              </div>
            </div>
            
            <div className={styles.quickActions}>
              <button 
                className={styles.actionCard}
                onClick={() => navigate('/doctors')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <i className="bi bi-calendar-plus"></i>
                </div>
                <span>Đặt lịch khám</span>
              </button>

              <button 
                className={styles.actionCard}
                onClick={() => navigate('/app/patient/ai-checkup')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <i className="bi bi-robot"></i>
                </div>
                <span>Kiểm tra AI</span>
              </button>

              <button 
                className={styles.actionCard}
                onClick={() => navigate('/app/patient/emr-timeline')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <i className="bi bi-file-medical"></i>
                </div>
                <span>Hồ sơ bệnh án</span>
              </button>

              <button 
                className={styles.actionCard}
                onClick={() => navigate('/app/patient/finance')}
              >
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <i className="bi bi-wallet2"></i>
                </div>
                <span>Nạp tiền</span>
              </button>
            </div>
          </div>

          {/* Recent Medical Records */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <i className="bi bi-clock-history"></i>
                <h2>Lịch sử khám gần đây</h2>
              </div>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/app/patient/emr-timeline')}
              >
                Xem tất cả
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            {medicalRecords.length > 0 ? (
              <div className={styles.recordsList}>
                {medicalRecords.slice(0, 4).map((record, index) => (
                  <div 
                    key={record.id} 
                    className={styles.recordItem}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate('/app/patient/emr-timeline')}
                  >
                    <div className={styles.recordIcon}>
                      <i className="bi bi-file-text"></i>
                    </div>
                    <div className={styles.recordInfo}>
                      <h5>{record.diagnosis || record.chiefComplaint || 'Khám tổng quát'}</h5>
                      <p>{record.doctor}</p>
                      <span className={styles.recordDate}>
                        <i className="bi bi-calendar3"></i>
                        {formatDate(record.date)}
                      </span>
                    </div>
                    <i className="bi bi-chevron-right"></i>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="bi bi-file-medical"></i>
                </div>
                <p>Chưa có hồ sơ bệnh án</p>
              </div>
            )}
          </div>

          {/* AI Analysis Results */}
          {aiResults.length > 0 && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <i className="bi bi-stars"></i>
                  <h2>Phân tích AI</h2>
                </div>
              </div>
              
              <div className={styles.aiResultCard}>
                <div className={styles.aiHeader}>
                  <div className={styles.aiLogo}>
                    <i className="bi bi-robot"></i>
                  </div>
                  <div className={styles.aiInfo}>
                    <h4>Kết quả phân tích mới nhất</h4>
                    <p>{aiResults.length} kết quả có sẵn</p>
                  </div>
                </div>
                <button 
                  className={styles.secondaryBtn}
                  onClick={() => navigate('/app/patient/ai-checkup')}
                >
                  <i className="bi bi-eye"></i>
                  Xem chi tiết
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (() => {
        const doctorProfile = selectedAppointment.doctorID ? doctorProfiles.get(selectedAppointment.doctorID) : null;
        const avatarUrl = doctorProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.doctorName)}&background=667eea&color=fff`;
        const education = doctorProfile?.education || '';
        const specialization = doctorProfile?.specialization || '';
        const appointmentStatus = getAppointmentStatus(selectedAppointment);
        const statusConfig = getStatusConfig(
          appointmentStatus,
          selectedAppointment.appointmentStartTime,
          selectedAppointment.appointmentEndTime
        );

        return (
          <div className={modalStyles.modalOverlay} onClick={() => setShowDetailModal(false)}>
            <div className={modalStyles.detailModal} onClick={(e) => e.stopPropagation()}>
              <button className={modalStyles.closeModalBtn} onClick={() => setShowDetailModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>

              <div className={modalStyles.modalHeader}>
                <div className={modalStyles.modalDoctorInfo}>
                  <div className={modalStyles.modalAvatarWrapper}>
                    <img 
                      src={avatarUrl} 
                      alt={selectedAppointment.doctorName}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.doctorName)}&background=667eea&color=fff`;
                      }}
                    />
                    <div className={modalStyles.modalAvatarBadge}>
                      <i className="bi bi-patch-check-fill"></i>
                    </div>
                  </div>
                  <div className={modalStyles.modalDoctorDetails}>
                    <h2 className={modalStyles.modalDoctorName}>{selectedAppointment.doctorName}</h2>
                    <div className={modalStyles.modalDoctorMeta}>
                      {education && (
                        <span className={modalStyles.modalDoctorTitle}>
                          <i className="bi bi-mortarboard-fill"></i>
                          {education}
                        </span>
                      )}
                      {specialization && (
                        <span className={modalStyles.modalSpecialty}>
                          <i className="bi bi-heart-pulse-fill"></i>
                          {specialization}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={modalStyles.modalStatus} style={{ background: statusConfig.color }}>
                  <i className={statusConfig.icon}></i>
                  {statusConfig.label}
                </div>
              </div>

              <div className={modalStyles.modalBody}>
                <div className={modalStyles.detailSection}>
                  <h4 className={modalStyles.sectionTitle}>
                    <i className="bi bi-calendar-event"></i>
                    Thông tin lịch hẹn
                  </h4>
                  <div className={modalStyles.detailGrid}>
                    <div className={modalStyles.detailCard}>
                      <div className={modalStyles.detailCardLabel}>NGÀY KHÁM</div>
                      <div className={modalStyles.detailCardValue}>{formatDetailDate(selectedAppointment.appointmentStartTime)}</div>
                    </div>
                    <div className={modalStyles.detailCard}>
                      <div className={modalStyles.detailCardLabel}>GIỜ KHÁM</div>
                      <div className={modalStyles.detailCardValue}>
                        {selectedAppointment.appointmentStartTime && selectedAppointment.appointmentEndTime
                          ? formatTimeRange(selectedAppointment.appointmentStartTime, selectedAppointment.appointmentEndTime)
                          : formatTime(selectedAppointment.appointmentStartTime)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={modalStyles.detailSection}>
                  <h4 className={modalStyles.sectionTitle}>
                    <i className="bi bi-credit-card"></i>
                    Thông tin thanh toán
                  </h4>
                  <div className={modalStyles.paymentDetails}>
                    <div className={modalStyles.paymentRow}>
                      <span className={modalStyles.paymentLabel}>Phí khám bệnh</span>
                      <span className={modalStyles.paymentAmount}>{formatCurrency(selectedAppointment.consultationFee)}</span>
                    </div>
                    {selectedAppointment.platformFee > 0 && (
                      <>
                        <div className={modalStyles.paymentRow}>
                          <span className={modalStyles.paymentLabel}>Phí nền tảng</span>
                          <span className={modalStyles.paymentAmount}>{formatCurrency(selectedAppointment.platformFee)}</span>
                        </div>
                        <div className={modalStyles.paymentDivider}></div>
                        <div className={modalStyles.paymentRow}>
                          <span className={modalStyles.totalLabel}>Tổng cộng</span>
                          <span className={modalStyles.totalValue}>{formatCurrency(selectedAppointment.totalAmount)}</span>
                        </div>
                      </>
                    )}
                    {selectedAppointment.paymentStatusCode && (
                      <div className={`${modalStyles.paymentStatus} ${modalStyles[`paymentStatus${selectedAppointment.paymentStatusCode}`] || ''}`}>
                        <i className={`bi ${getPaymentStatusIcon(selectedAppointment.paymentStatusCode)}`}></i>
                        <span>Trạng thái: {getPaymentStatusLabel(selectedAppointment.paymentStatusCode)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={modalStyles.modalFooter}>
                {(selectedAppointment.statusCode === 'Confirmed' || selectedAppointment.statusCode === 'OnProgressing') && (
                  <button 
                    className={modalStyles.modalCancelBtn}
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate('/app/patient/appointments');
                    }}
                  >
                    <i className="bi bi-x-circle"></i>
                    Hủy lịch hẹn
                  </button>
                )}
                {selectedAppointment.statusCode === 'Completed' && (
                  <button 
                    className={modalStyles.modalEmrBtn}
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate('/app/patient/emr-timeline');
                    }}
                  >
                    <i className="bi bi-file-text"></i>
                    Xem hồ sơ bệnh án
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};