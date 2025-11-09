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
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordDto[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setStatsLoading(true);
        setError(null);
        
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
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
        setStatsLoading(false);
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
    return aptDate >= now && (apt.statusCode === 'CONFIRMED' || apt.statusCode === 'PENDING');
  }).sort((a, b) => 
    new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime()
  );

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentStartTime);
    return aptDate >= thisWeekStart && aptDate <= now;
  });

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRecords = medicalRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= thisMonthStart;
  });

  const aiResults = appointments.filter(apt => apt.aiSymptomAnalysisId).length;
  const thisWeekAiResults = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentStartTime);
    return aptDate >= thisWeekStart && apt.aiSymptomAnalysisId;
  }).length;

  const upcomingCount = upcomingAppointments.length;
  const historyCount = medicalRecords.length;
  const remindersCount = upcomingAppointments.length + (medicalRecords.length > 0 ? 1 : 0);
  const todayReminders = upcomingAppointments.filter(apt => {
    const aptDate = new Date(apt.appointmentStartTime);
    return aptDate.toDateString() === now.toDateString();
  }).length;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('vi-VN');
    return `${time}, ${dateStr}`;
  };

  const getStatusBadge = (statusCode: string): string => {
    switch (statusCode) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getStatusBadgeClass = (statusCode: string): string => {
    switch (statusCode) {
      case 'CONFIRMED':
        return styles.statusBadge;
      case 'PENDING':
        return styles.statusBadge;
      case 'COMPLETED':
        return styles.statusBadge;
      default:
        return styles.statusBadge;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Dashboard</h1>
          <p>
            <span className={styles.waveEmoji}>👋</span>
            Chào mừng trở lại, <strong>{user?.fullName || 'Bệnh nhân'}</strong>!
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.walletBalance}>
            <i className={`bi bi-wallet2 ${styles.walletIcon}`}></i>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Số dư ví</div>
              {loading ? (
                <div className={styles.walletAmount}>Đang tải...</div>
              ) : error ? (
                <div className={styles.walletAmount} style={{ color: '#ef4444' }}>
                  Lỗi
                </div>
              ) : wallet ? (
                <div className={styles.walletAmount}>
                  {formatBalance(wallet.balance, wallet.currency)}
                </div>
              ) : (
                <div className={styles.walletAmount}>0 đ</div>
              )}
            </div>
            <button
              onClick={() => navigate('/app/patient/finance')}
              className={styles.walletAddButton}
              title="Nạp tiền"
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Lịch hẹn sắp tới</div>
            <div className={styles.statValue}>{statsLoading ? '...' : upcomingCount}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+{thisWeekAppointments.length} tuần này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-calendar-check"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-clipboard-data"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Lịch sử khám</div>
            <div className={styles.statValue}>{statsLoading ? '...' : historyCount}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+{thisMonthRecords.length} tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-clipboard-data"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-robot"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Kết quả AI</div>
            <div className={styles.statValue}>{statsLoading ? '...' : aiResults}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+{thisWeekAiResults} tuần này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-robot"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-bell"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Nhắc nhở</div>
            <div className={styles.statValue}>{statsLoading ? '...' : remindersCount}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+{todayReminders} hôm nay</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-bell"></i>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Upcoming Appointment */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-calendar-check"></i>
            </div>
            <h3 className={styles.cardTitle}>Lịch hẹn sắp tới</h3>
          </div>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.slice(0, 1).map((apt) => (
              <div key={apt.id} className={styles.appointmentCard}>
                <div className={styles.doctorInfo}>
                  <div className={styles.doctorAvatar}>
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName)}&background=667eea&color=fff`} 
                      alt={apt.doctorName} 
                    />
                  </div>
                  <div className={styles.doctorDetails}>
                    <div className={styles.doctorName}>{apt.doctorName}</div>
                    <div className={styles.doctorTitle}>Bác sĩ</div>
                    <div className={styles.doctorSpecialty}>Lịch hẹn</div>
                  </div>
                </div>
                <div className={styles.appointmentTime}>
                  <span className={styles.timeText}>{formatDateTime(apt.appointmentStartTime)}</span>
                  <span className={getStatusBadgeClass(apt.statusCode)}>{getStatusBadge(apt.statusCode)}</span>
                </div>
                <div className={styles.appointmentActions}>
                  <button 
                    className={styles.updateBtn}
                    onClick={() => navigate(`/app/patient/appointments/${apt.id}`)}
                  >
                    XEM CHI TIẾT
                  </button>
                  <button 
                    className={styles.cancelBtn}
                    onClick={async () => {
                      if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) {
                        try {
                          await appointmentService.cancelPatientAppointment(apt.id);
                          window.location.reload();
                        } catch (err) {
                          alert('Không thể hủy lịch hẹn');
                        }
                      }
                    }}
                  >
                    HỦY LỊCH KHÁM
                  </button>
                </div>
              </div>
            ))
          ) : (
            <>
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <i className="bi bi-calendar-x" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                <p>Chưa có lịch hẹn sắp tới</p>
              </div>
              <button 
                className={styles.viewAllBtn}
                onClick={() => navigate('/app/patient/appointments')}
              >
                XEM TẤT CẢ
              </button>
            </>
          )}
        </div>

        {/* Examination History */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-clipboard-data"></i>
            </div>
            <h3 className={styles.cardTitle}>Lịch sử khám</h3>
          </div>
          {medicalRecords.length > 0 ? (
            <>
              <div className={styles.historyList}>
                {medicalRecords.slice(0, 2).map((record) => (
                  <div key={record.id} className={styles.historyItem}>
                    <div className={styles.historyDate}>{formatDate(record.date)}</div>
                    <div className={styles.historyDoctor}>{record.doctor}</div>
                    <div className={styles.historyDiagnosis}>{record.diagnosis || record.chiefComplaint || 'Chưa có chẩn đoán'}</div>
                  </div>
                ))}
              </div>
              <button 
                className={styles.viewAllBtn}
                onClick={() => navigate('/app/patient/medical-records')}
              >
                XEM TẤT CẢ
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <i className="bi bi-clipboard-x" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                <p>Chưa có lịch sử khám</p>
              </div>
              <button 
                className={styles.viewAllBtn}
                onClick={() => navigate('/app/patient/medical-records')}
              >
                XEM TẤT CẢ
              </button>
            </>
          )}
        </div>

        {/* AI Checkup Results */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-robot"></i>
            </div>
            <h3 className={styles.cardTitle}>Kết quả kiểm tra AI gần đây</h3>
          </div>
          {appointments.filter(apt => apt.aiSymptomAnalysisId).length > 0 ? (
            (() => {
              const latestAiAppointment = appointments
                .filter(apt => apt.aiSymptomAnalysisId)
                .sort((a, b) => new Date(b.appointmentStartTime).getTime() - new Date(a.appointmentStartTime).getTime())[0];
              
              return (
                <>
                  <div className={styles.aiResult}>
                    <div className={styles.aiAvatar}>
                      <div className={styles.aiLogo}>MEDIX</div>
                      <div className={styles.aiDate}>{formatDate(latestAiAppointment.appointmentStartTime)}</div>
                    </div>
                    <div className={styles.aiContent}>
                      <div className={styles.aiSymptoms}>
                        {latestAiAppointment.medicalInfo || 'Đã có kết quả phân tích AI'}
                      </div>
                      <div className={styles.aiStatus}>Cần chú ý</div>
                    </div>
                  </div>
                  <button 
                    className={styles.viewAllBtn}
                    onClick={() => navigate(`/app/patient/appointments/${latestAiAppointment.id}`)}
                  >
                    XEM CHI TIẾT
                  </button>
                </>
              );
            })()
          ) : (
            <>
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <i className="bi bi-robot" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                <p>Chưa có kết quả kiểm tra AI</p>
              </div>
              <button 
                className={styles.viewAllBtn}
                onClick={() => navigate('/app/patient/ai-checkup')}
              >
                KIỂM TRA NGAY
              </button>
            </>
          )}
        </div>

        {/* Reminders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-bell"></i>
            </div>
            <h3 className={styles.cardTitle}>Nhắc nhở</h3>
          </div>
          {upcomingAppointments.length > 0 ? (
            <>
              <div className={styles.remindersList}>
                {upcomingAppointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className={styles.reminderItem}>
                    <div className={styles.reminderIcon}>
                      <i className="bi bi-calendar-event"></i>
                    </div>
                    <div className={styles.reminderText}>
                      Lịch hẹn với BS. {apt.doctorName} vào {formatDateTime(apt.appointmentStartTime)}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className={styles.viewAllBtn}
                onClick={() => navigate('/app/patient/appointments')}
              >
                XEM TẤT CẢ
              </button>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', padding: '40px', color: '#718096', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <i className="bi bi-bell-slash" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                <p>Chưa có nhắc nhở</p>
              </div>
              <button 
                className={styles.viewAllBtn}
                onClick={() => navigate('/app/patient/appointments')}
              >
                XEM LỊCH HẸN
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};