import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import doctorService from '../../services/doctorService';
import doctorDashboardService from '../../services/doctorDashboardService';
import styles from '../../styles/doctor/DoctorDashboard.module.css';

interface DoctorStats {
  totalAppointments: number;
  todayAppointments: number;
  totalPatients: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
}

interface UpcomingAppointment {
  id: string;
  patientName: string;
  patientAvatar?: string;
  appointmentTime: string;
  appointmentDate: string;
  serviceType: string;
  status: string;
}

interface RecentPatient {
  id: string;
  name: string;
  avatar?: string;
  lastVisit: string;
  diagnosis: string;
  rating: number;
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DoctorStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from API, fallback to mock data if API is not available
      try {
        const [statsData, appointmentsData, patientsData] = await Promise.all([
          doctorDashboardService.getDashboardStats(),
          doctorDashboardService.getUpcomingAppointments(),
          doctorDashboardService.getRecentPatients()
        ]);
        
        setStats(statsData);
        setUpcomingAppointments(appointmentsData);
        setRecentPatients(patientsData);
      } catch (apiError) {
        console.warn('API not available, using mock data:', apiError);
        
        // Fallback to mock data
        setStats({
          totalAppointments: 156,
          todayAppointments: 8,
          totalPatients: 89,
          monthlyEarnings: 12500000,
          averageRating: 4.8,
          totalReviews: 124
        });

        setUpcomingAppointments([
          {
            id: '1',
            patientName: 'Nguyễn Văn A',
            patientAvatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=667eea&color=fff',
            appointmentTime: '09:00',
            appointmentDate: 'Hôm nay',
            serviceType: 'Khám tổng quát',
            status: 'Đang chờ'
          },
          {
            id: '2',
            patientName: 'Trần Thị B',
            patientAvatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=667eea&color=fff',
            appointmentTime: '10:30',
            appointmentDate: 'Hôm nay',
            serviceType: 'Tư vấn chuyên khoa',
            status: 'Đang chờ'
          },
          {
            id: '3',
            patientName: 'Lê Văn C',
            patientAvatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=667eea&color=fff',
            appointmentTime: '14:00',
            appointmentDate: 'Hôm nay',
            serviceType: 'Khám định kỳ',
            status: 'Đang chờ'
          }
        ]);

        setRecentPatients([
          {
            id: '1',
            name: 'Phạm Thị D',
            avatar: 'https://ui-avatars.com/api/?name=Pham+Thi+D&background=667eea&color=fff',
            lastVisit: '2 ngày trước',
            diagnosis: 'Cảm cúm',
            rating: 5
          },
          {
            id: '2',
            name: 'Hoàng Văn E',
            avatar: 'https://ui-avatars.com/api/?name=Hoang+Van+E&background=667eea&color=fff',
            lastVisit: '1 tuần trước',
            diagnosis: 'Đau đầu',
            rating: 4
          },
          {
            id: '3',
            name: 'Vũ Thị F',
            avatar: 'https://ui-avatars.com/api/?name=Vu+Thi+F&background=667eea&color=fff',
            lastVisit: '2 tuần trước',
            diagnosis: 'Mất ngủ',
            rating: 5
          }
        ]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatTime = (time: string) => {
    return time;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            <span className={styles.waveEmoji}>👋</span>
            Chào mừng trở lại, <strong>{user?.fullName || 'Bác sĩ'}</strong>!
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Lịch hẹn hôm nay</div>
            <div className={styles.statValue}>{stats.todayAppointments}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+2 so với hôm qua</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-calendar-check"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-people"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng bệnh nhân</div>
            <div className={styles.statValue}>{stats.totalPatients}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+5 tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-people"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-wallet2"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Thu nhập tháng</div>
            <div className={styles.statValue}>{formatCurrency(stats.monthlyEarnings)}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+12% so với tháng trước</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-wallet2"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-star-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đánh giá trung bình</div>
            <div className={styles.statValue}>{stats.averageRating}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>({stats.totalReviews} đánh giá)</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-star-fill"></i>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Upcoming Appointments */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-calendar-check"></i>
            </div>
            <h3 className={styles.cardTitle}>Lịch hẹn sắp tới</h3>
            <button className={styles.viewAllBtn}>Xem tất cả</button>
          </div>
          <div className={styles.appointmentsList}>
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className={styles.appointmentItem}>
                <div className={styles.patientInfo}>
                  <div className={styles.patientAvatar}>
                    <img src={appointment.patientAvatar} alt={appointment.patientName} />
                  </div>
                  <div className={styles.patientDetails}>
                    <div className={styles.patientName}>{appointment.patientName}</div>
                    <div className={styles.serviceType}>{appointment.serviceType}</div>
                  </div>
                </div>
                <div className={styles.appointmentTime}>
                  <div className={styles.timeText}>{appointment.appointmentTime}</div>
                  <div className={styles.dateText}>{appointment.appointmentDate}</div>
                </div>
                <div className={styles.appointmentStatus}>
                  <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patients */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-people"></i>
            </div>
            <h3 className={styles.cardTitle}>Bệnh nhân gần đây</h3>
            <button className={styles.viewAllBtn}>Xem tất cả</button>
          </div>
          <div className={styles.patientsList}>
            {recentPatients.map((patient) => (
              <div key={patient.id} className={styles.patientItem}>
                <div className={styles.patientAvatar}>
                  <img src={patient.avatar} alt={patient.name} />
                </div>
                <div className={styles.patientInfo}>
                  <div className={styles.patientName}>{patient.name}</div>
                  <div className={styles.patientDiagnosis}>{patient.diagnosis}</div>
                  <div className={styles.patientLastVisit}>{patient.lastVisit}</div>
                </div>
                <div className={styles.patientRating}>
                  <div className={styles.stars}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <i 
                        key={i} 
                        className={`bi bi-star-fill ${i < patient.rating ? styles.starFilled : styles.starEmpty}`}
                      ></i>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-lightning"></i>
            </div>
            <h3 className={styles.cardTitle}>Thao tác nhanh</h3>
          </div>
          <div className={styles.quickActions}>
            <button className={styles.actionBtn}>
              <i className="bi bi-calendar-plus"></i>
              <span>Tạo lịch hẹn</span>
            </button>
            <button className={styles.actionBtn}>
              <i className="bi bi-file-text"></i>
              <span>Viết đơn thuốc</span>
            </button>
            <button className={styles.actionBtn}>
              <i className="bi bi-chat-dots"></i>
              <span>Chat với bệnh nhân</span>
            </button>
            <button className={styles.actionBtn}>
              <i className="bi bi-graph-up"></i>
              <span>Xem báo cáo</span>
            </button>
          </div>
        </div>

        {/* Performance Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-bar-chart"></i>
            </div>
            <h3 className={styles.cardTitle}>Hiệu suất tuần này</h3>
            <div className={styles.chartActions}>
              <button className={`${styles.chartBtn} ${styles.active}`}>Tuần</button>
              <button className={styles.chartBtn}>Tháng</button>
            </div>
          </div>
          <div className={styles.chartContent}>
            <div className={styles.chartPlaceholder}>
              <i className="bi bi-bar-chart"></i>
              <p>Biểu đồ hiệu suất</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
