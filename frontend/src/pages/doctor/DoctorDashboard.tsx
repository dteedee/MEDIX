import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import doctorDashboardService from '../../services/doctorDashboardService';
import { reviewService } from '../../services/reviewService';
import { appointmentService } from '../../services/appointmentService';
import styles from '../../styles/doctor/DoctorDashboard.module.css';
import { Link } from 'react-router-dom';
import { PageLoader } from '../../components/ui';

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
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  
  // Tách biệt trạng thái loading và error cho từng khối dữ liệu
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  
  
  const toYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getRelativeDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
      return 'Hôm nay';
    }
    if (checkDate.getTime() === tomorrow.getTime()) {
      return 'Ngày mai';
    }
    return date.toLocaleDateString('vi-VN');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date();
        const todayStr = toYYYYMMDD(today);

        // Sử dụng Promise.allSettled để xử lý lỗi của từng API một cách độc lập
        const results = await Promise.allSettled([
          doctorDashboardService.getDashboardStats(),
          appointmentService.getMyAppointmentsByDateRange("2020-01-01", "2030-12-31"), // Lấy tất cả lịch hẹn để tính tổng
          reviewService.getReviewsForCurrentDoctor()
        ]);

        const [statsResult, appointmentsResult, reviewsResult] = results;

        // Xử lý kết quả của reviews và appointments trước vì chúng cần cho stats
        let totalAppointments = 0;
        let totalUniquePatients = 0;
        let todayAppointmentsCount = 0; // Vẫn giữ để hiển thị lịch hẹn hôm nay

        if (appointmentsResult.status === 'fulfilled') {
          const allAppointments = appointmentsResult.value;

          // DEBUG: In ra danh sách các cuộc hẹn để kiểm tra patientId
          console.log("Tất cả các cuộc hẹn đã tải:", allAppointments.map(a => ({ appointmentId: a.id, patientName: a.patientName, patientId: a.patientId })));

          totalAppointments = allAppointments.length;
          // Sửa lỗi đếm bệnh nhân: Sử dụng tổ hợp patientId và patientName để đảm bảo tính duy nhất
          // trong trường hợp patientId có thể bị trùng lặp cho các bệnh nhân khác nhau.
          const uniquePatientKeys = new Set(allAppointments.map(app => `${app.patientId}-${app.patientName}`));
          totalUniquePatients = uniquePatientKeys.size;

          const upcoming = allAppointments
            .filter(app => new Date(app.appointmentStartTime) > new Date())
            .sort((a, b) => new Date(a.appointmentStartTime).getTime() - new Date(b.appointmentStartTime).getTime())
            .map(app => {
              const appDate = new Date(app.appointmentStartTime);
              return {
                id: app.id,
                patientName: app.patientName,
                appointmentTime: appDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                appointmentDate: getRelativeDate(appDate), // Sửa lỗi hiển thị ngày
                serviceType: 'Khám bệnh', // Có thể thay đổi nếu API trả về
                status: app.statusDisplayName || 'Chưa xác định'
              };
            });
          setUpcomingAppointments(upcoming);

          // Đếm lịch hẹn hôm nay từ danh sách đã có
          todayAppointmentsCount = allAppointments.filter(app => toYYYYMMDD(new Date(app.appointmentStartTime)) === todayStr).length;

          // Tạo danh sách bệnh nhân gần đây từ lịch hẹn
          const now = new Date();
          // Lọc ra các cuộc hẹn đã diễn ra (trong quá khứ hoặc hôm nay)
          const pastAppointments = allAppointments.filter(app => new Date(app.appointmentStartTime) <= now);

          const patientMap = new Map<string, any>(); // Sử dụng khóa duy nhất (patientId-patientName)
          pastAppointments.forEach(app => {
            const patientKey = `${app.patientId}-${app.patientName}`;
            // Từ các cuộc hẹn đã qua, tìm ra cuộc hẹn gần nhất của mỗi bệnh nhân
            if (!patientMap.has(patientKey) || new Date(app.appointmentStartTime) > new Date(patientMap.get(patientKey).appointmentStartTime)) {
              patientMap.set(patientKey, app);
            }
          });

          const recentPatientsFromAppointments: RecentPatient[] = Array.from(patientMap.values())
            .sort((a, b) => new Date(b.appointmentStartTime).getTime() - new Date(a.appointmentStartTime).getTime()) // Sắp xếp mới nhất lên đầu
            .slice(0, 5) // Chỉ lấy 5 bệnh nhân gần nhất
            .map(app => ({
              id: app.patientId, // Sử dụng patientId
              name: app.patientName,
              avatar: app.patientAvatar, // API cần trả về trường này
              lastVisit: new Date(app.appointmentStartTime).toLocaleDateString('vi-VN'),
              diagnosis: '', // Để trống vì thông tin này không có trong dữ liệu cuộc hẹn
              rating: 0, // Thông tin này không có trong appointment
            }));
          
          setRecentPatients(recentPatientsFromAppointments);

        } else {
          console.error("Error fetching appointments:", appointmentsResult.reason);
          setAppointmentsError("Không tải được lịch hẹn.");
        }

        let totalReviews = 0;
        let averageRating = 0;
        if (reviewsResult.status === 'fulfilled') {
          const reviewsData = reviewsResult.value;
          totalReviews = reviewsData.length;
          averageRating = totalReviews > 0
            ? parseFloat((reviewsData.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / totalReviews).toFixed(1))
            : 0;
        }
        // Không set lỗi cho review vì nó chỉ là một phần của stats

        // Xử lý kết quả của stats
        if (statsResult.status === 'fulfilled') {
          setStats({ // Sử dụng dữ liệu thật khi thành công
            ...statsResult.value,
            totalAppointments: totalAppointments, // Ghi đè bằng dữ liệu thật
            totalPatients: totalUniquePatients, // Ghi đè bằng dữ liệu thật
            todayAppointments: todayAppointmentsCount,
            averageRating: averageRating,
            totalReviews: totalReviews,
          });
        } else {
          console.warn("Could not fetch stats, using fallback data:", statsResult.reason);
          // Sử dụng mock data khi API stats lỗi, nhưng vẫn giữ lại dữ liệu đã lấy được
          setStats({
            monthlyEarnings: 0, // Dữ liệu giả
            totalAppointments: totalAppointments, // Dữ liệu thật nếu có
            totalPatients: totalUniquePatients, // Dữ liệu thật nếu có
            todayAppointments: todayAppointmentsCount, // Dữ liệu thật nếu có
            averageRating: averageRating, // Dữ liệu thật nếu có
            totalReviews: totalReviews, // Dữ liệu thật nếu có
          });
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Lỗi chung nếu `Promise.allSettled` có vấn đề (rất hiếm)
        setAppointmentsError('Lỗi không xác định.');
        setPatientsError('Lỗi không xác định.');
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (isPageLoading) {
    return <PageLoader />;
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

        {stats ? (
          <>
            <div className={`${styles.statCard} ${styles.statCard1}`}>
            <div className={styles.statIcon}>
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Lịch hẹn hôm nay</div>
              <div className={styles.statValue}>{stats.todayAppointments}</div>
              <div className={styles.statTrend}>
                <i className="bi bi-arrow-right-circle"></i>
                <Link to="/app/doctor/appointments">Xem chi tiết</Link>
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
                <i className="bi bi-arrow-right-circle"></i>
                <Link to="/app/doctor/patients">Xem danh sách</Link>
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
                <i className="bi bi-arrow-right-circle"></i>
                <Link to="/app/doctor/wallet">Xem chi tiết</Link>
              </div>
            </div>
            <div className={styles.statBg}>
              <i className="bi bi-wallet2"></i>
            </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard3}`}>
            <div className={styles.statIcon}>
              <i className="bi bi-wallet2"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Tổng các lịch hẹn</div>
              <div className={styles.statValue}>{stats.totalAppointments}</div>
              <div className={styles.statTrend}>
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
                <i className="bi bi-chat-quote"></i>
                <Link to="/app/doctor/feedback">({stats.totalReviews} đánh giá)</Link>
              </div>
            </div>
            <div className={styles.statBg}>
              <i className="bi bi-star-fill"></i>
            </div>
            </div>
          </>
        ) : (
          <div className={`${styles.statCard} ${styles.loadingCard}`}>Đang tải thống kê...</div>
        )}
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
            <Link to="/app/doctor/appointments" className={styles.viewAllBtn}>Xem tất cả</Link>
          </div>
          <div className={styles.appointmentsList}>
            {appointmentsError ? (
              <div className={styles.emptyList}>
                <i className="bi bi-exclamation-circle-fill"></i>
                <p>{appointmentsError}</p>
              </div>
            ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <Link to={`/app/doctor/medical-records/${appointment.id}`} key={appointment.id} className={styles.appointmentItem}>
                    <div className={styles.patientInfo}>
                      <div className={styles.patientAvatar}>
                        <img src={appointment.patientAvatar || `https://ui-avatars.com/api/?name=${appointment.patientName.replace(/\s/g, '+')}&background=667eea&color=fff`} alt={appointment.patientName} />
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
                  </Link>
                ))
              ) : (
                <div className={styles.emptyList}>
                  <i className="bi bi-calendar-x"></i>
                  <p>Không có lịch hẹn nào sắp tới.</p>
                </div>
              )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <i className="bi bi-people"></i>
            </div>
            <h3 className={styles.cardTitle}>Bệnh nhân gần đây</h3>
            <Link to="/app/doctor/patients" className={styles.viewAllBtn}>Xem tất cả</Link>
          </div>
          <div className={styles.patientsList}>
            {patientsError ? (
              <div className={styles.emptyList}>
                <i className="bi bi-exclamation-circle-fill"></i>
                <p>{patientsError}</p>
              </div>
            ) : recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <Link to={`/app/doctor/patients/${patient.id}`} key={patient.id} className={styles.patientItem}>
                    <div className={styles.patientAvatar}>
                      <img src={patient.avatar || `https://ui-avatars.com/api/?name=${patient.name.replace(/\s/g, '+')}&background=f093fb&color=fff`} alt={patient.name} />
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
                            className={`bi bi-star-fill ${i < (patient.rating || 0) ? styles.starFilled : styles.starEmpty}`}
                          ></i>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyList}>
                  <i className="bi bi-person-x"></i>
                  <p>Không có bệnh nhân nào gần đây.</p>
                </div>
              )}
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
            <Link to="/app/doctor/schedule" className={styles.actionBtn}>
              <i className="bi bi-calendar-plus"></i>
              <span>Quản lý lịch</span>
            </Link>
            <Link to="/app/doctor/appointments" className={styles.actionBtn}>
              <i className="bi bi-file-text"></i>
              <span>Xem lịch hẹn</span>
            </Link>
            <Link to="/app/doctor/patients" className={styles.actionBtn}>
              <i className="bi bi-chat-dots"></i>
              <span>Bệnh nhân</span>
            </Link>
            <Link to="/app/doctor/feedback" className={styles.actionBtn}>
              <i className="bi bi-graph-up"></i>
              <span>Xem phản hồi</span>
            </Link>
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
