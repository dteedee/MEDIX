import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { walletService } from '../../services/walletService';
import { WalletDto } from '../../types/wallet.types';
import { appointmentService } from '../../services/appointmentService';
import { medicalRecordService } from '../../services/medicalRecordService';
import { Appointment } from '../../types/appointment.types';
import { MedicalRecordDto } from '../../types/medicalRecord.types';
import styles from '../../styles/patient/PatientDashboard.module.css';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordDto[]>([]);

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

        <div className={styles.statCard} onClick={() => navigate('/app/patient/medical-records')}>
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
                {upcomingAppointments.slice(0, 3).map((apt, index) => (
                  <div 
                    key={apt.id} 
                    className={styles.appointmentItem}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate(`/app/patient/appointments/${apt.id}`)}
                  >
                    <div className={styles.appointmentLeft}>
                      <div className={styles.doctorAvatarLarge}>
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName)}&background=667eea&color=fff`}
                          alt={apt.doctorName}
                        />
                        <div className={styles.onlineBadge}></div>
                      </div>
                      <div className={styles.appointmentDetails}>
                        <h4>{apt.doctorName}</h4>
                        <p className={styles.specialty}>Bác sĩ chuyên khoa</p>
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
                          navigate(`/app/patient/appointments/${apt.id}`);
                        }}
                      >
                        <i className="bi bi-arrow-right-circle"></i>
                      </button>
                    </div>
                  </div>
                ))}
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
                  onClick={() => navigate('/app/patient/book-appointment')}
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
                onClick={() => navigate('/app/patient/book-appointment')}
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
                onClick={() => navigate('/app/patient/medical-records')}
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
                onClick={() => navigate('/app/patient/medical-records')}
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
                    onClick={() => navigate('/app/patient/medical-records')}
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
    </div>
  );
};