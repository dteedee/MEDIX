import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/AdminDashboard.module.css';
import { adminDashboardService } from '../../services/adminDashboardService';
import { apiClient } from '../../lib/apiClient';
import { PageLoader } from '../../components/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
 
const colorPalette = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  todayAppointments: number;
  totalAppointments: number;
  totalHealthArticles: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  averageRating: number;
}

interface DashboardGrowth {
  usersGrowthPercentage: number;
  doctorsGrowthPercentage: number;
  appointmentsGrowthPercentage: number;
  articlesGrowthPercentage: number;
  revenueGrowthPercentage: number;
  todayAppointmentsGrowthPercentage: number;
}

interface RecentActivity {
  activityType: string;
  title: string;
  description: string;
  createdAt: string;
  userName: string;
}

interface AuditLog {
  id: number;
  userName: string;
  actionType: string;
  entityType: string;
  timestamp: string;
  oldValues: string | null;
  newValues: string | null;
}

// Interface cho dữ liệu tăng trưởng người dùng
interface UserGrowthItem {
  period: string;
  users: number;
  doctors: number;
  patients: number;
}

// You can expand this interface with other properties from your JSON if needed
interface DashboardData {
  summary: DashboardSummary;
  growth: DashboardGrowth;
  recentActivities: RecentActivity[];
  userGrowth: UserGrowthItem[];
  auditLogs: AuditLog[];
  // Thêm các trường khác nếu cần: appointmentTrends, revenueTrends, topSpecialties
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State lưu trữ dữ liệu đã được lọc và định dạng cho biểu đồ tăng trưởng người dùng
  const [userGrowthChartData, setUserGrowthChartData] = useState<UserGrowthItem[]>([]);
    // State lưu trữ bộ lọc thời gian cho biểu đồ tăng trưởng người dùng (7, 30, hoặc 90 ngày)
  const [userGrowthFilter, setUserGrowthFilter] = useState<number>(30); // 7, 30, or 90 days
  // State cho bộ lọc biểu đồ hoạt động ('recent', 'today', 'week')
  const [activityFilter, setActivityFilter] = useState<'today' | 'week'>('today');
  const [activityChartData, setActivityChartData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [dashboardData, auditLogsResponse] = await Promise.all([
          adminDashboardService.getDashboardData(),
          apiClient.get('/AuditLogs?page=1&pageSize=100')
        ]);
        const data = await adminDashboardService.getDashboardData(); 
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

  }, []);

  // Effect để chuẩn bị dữ liệu cho biểu đồ người dùng và biểu đồ hoạt động khi dashboardData hoặc userGrowthFilter thay đổi
  useEffect(() => { 
    // Đảm bảo có dữ liệu dashboard trước khi xử lý
    if (!dashboardData?.userGrowth) return;

    const today = new Date();
    const currentYear = today.getFullYear();


    // Lọc dữ liệu tăng trưởng người dùng dựa trên userGrowthFilter
    const filteredData = dashboardData.userGrowth.filter(item => {
      const [month, day] = item.period.split('/').map(Number);
      // Giả định năm hiện tại. Lưu ý: tháng trong JS Date là 0-indexed.
      const itemDate = new Date(currentYear, month - 1, day);

      // Xử lý trường hợp chuyển giao năm:
      // Nếu ngày của itemDate lớn hơn ngày hiện tại (ví dụ: hôm nay là 11/2025, item là 12/2025),
      // thì có thể item đó thuộc về năm trước (12/2024).
      // Điều chỉnh năm của itemDate để tính toán khoảng thời gian chính xác.
      if (itemDate > today) {
        // Giảm năm của itemDate đi 1 để so sánh đúng
        itemDate.setFullYear(currentYear - 1);
      }

      const diffTime = today.getTime() - itemDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      return diffDays <= userGrowthFilter;
    });

    // Chuyển đổi định dạng 'MM/DD' thành 'DD/MM' để hiển thị trên biểu đồ
    const formattedChartData = filteredData.map(item => {
      const parts = item.period.split('/');
      return {
        ...item,
        period: `${parts[1]}/${parts[0]}` // Đảo ngược ngày và tháng
      };
    });
    // Cập nhật state dữ liệu cho biểu đồ tăng trưởng người dùng
    setUserGrowthChartData(formattedChartData);


    // Chuẩn bị dữ liệu cho biểu đồ hoạt động hệ thống
    if (dashboardData?.recentActivities) { 
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Giả sử tuần bắt đầu từ Chủ nhật

      const filteredActivities = dashboardData.recentActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        if (activityFilter === 'today') {
          return activityDate >= today;
        }
        if (activityFilter === 'week') {
          return activityDate >= startOfWeek;
        }
        // 'recent' sẽ hiển thị tất cả, không cần lọc thêm
        return true;
      });


      // Đếm số lượng của mỗi loại hoạt động
      const activityCounts = filteredActivities.reduce((acc, activity) => {
        acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const activityMapping: Record<string, string> = {
        USER_REGISTRATION: 'Đăng ký mới',
        APPOINTMENT_CREATED: 'Tạo lịch hẹn',
        ARTICLE_PUBLISHED: 'Tạo bài viết',
      };

      // Chuyển đổi dữ liệu đếm thành định dạng phù hợp cho PieChart
      const chartData = Object.entries(activityCounts).map(([type, count]) => ({
        name: activityMapping[type] || type,
        value: count,
      }));

      // Cập nhật state dữ liệu cho biểu đồ hoạt động
      setActivityChartData(chartData);
    }


  }, [dashboardData, userGrowthFilter, activityFilter]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  return (
    <div className={styles.container}> 
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>Dashboard</h1>
              <p className={styles.subtitle}>Tổng quan hệ thống và thống kê</p>
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
            <div className={styles.statCard}>
              <div className={`${styles.statCircle} ${styles.statCard1}`}>
                <i className="bi bi-people-fill"></i>
                <span className={styles.statValue}>{dashboardData?.summary.totalUsers}</span>
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Tổng người dùng</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>{dashboardData?.growth.usersGrowthPercentage}% so với tháng trước</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statCircle} ${styles.statCard2}`}>
                <i className="bi bi-hospital"></i>
                <span className={styles.statValue}>{dashboardData?.summary.totalDoctors}</span>
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Bác sĩ</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>{dashboardData?.growth.doctorsGrowthPercentage}% so với tuần trước</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statCircle} ${styles.statCard3}`}>
                <i className="bi bi-calendar-check"></i>
                <span className={styles.statValue}>{dashboardData?.summary.todayAppointments}</span>
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Lịch hẹn hôm nay</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>{dashboardData?.growth.todayAppointmentsGrowthPercentage}% so với hôm qua</span>
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statCircle} ${styles.statCard4}`}>
                <i className="bi bi-file-text"></i>
                <span className={styles.statValue}>{dashboardData?.summary.totalHealthArticles}</span>
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Bài viết</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>{dashboardData?.growth.articlesGrowthPercentage}% so với tháng trước</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Thống kê người dùng</h3>
                <div className={styles.chartActions}>
                  <button 
                    className={`${styles.chartBtn} ${userGrowthFilter === 7 ? styles.active : ''}`}
                    onClick={() => setUserGrowthFilter(7)}
                  >
                    7 ngày
                  </button>
                  <button 
                    className={`${styles.chartBtn} ${userGrowthFilter === 30 ? styles.active : ''}`}
                    onClick={() => setUserGrowthFilter(30)}
                  >
                    30 ngày
                  </button>
                  <button 
                    className={`${styles.chartBtn} ${userGrowthFilter === 90 ? styles.active : ''}`}
                    onClick={() => setUserGrowthFilter(90)}
                  >
                    90 ngày
                  </button>
                </div>
              </div>
              <div className={styles.chartContent} style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={userGrowthChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="patients" fill="#82ca9d" name="Bệnh nhân" />
                    <Bar dataKey="doctors" fill="#ffc658" name="Bác sĩ" />
                    <Bar dataKey="users" fill="#8884d8" name="Tổng người dùng" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Phân bổ hoạt động</h3>
                <div className={styles.chartActions}>
                  <button 
                    className={`${styles.chartBtn} ${activityFilter === 'today' ? styles.active : ''}`}
                    onClick={() => setActivityFilter('today')}
                  >
                    Hôm nay
                  </button>
                  <button 
                    className={`${styles.chartBtn} ${activityFilter === 'week' ? styles.active : ''}`}
                    onClick={() => setActivityFilter('week')}
                  >Tuần này</button>
                </div>
              </div>
              <div className={styles.chartContent} style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={activityChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90} // Thu nhỏ bán kính lại 25% (120 * 0.75 = 90)
                      labelLine={false} // Tắt đường kẻ nối từ miếng bánh ra nhãn
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }) => {
                        // Kiểm tra các giá trị có tồn tại không để tránh lỗi TypeScript
                        if (percent === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined) return null;
                        if (percent < 0.07) return null; // Chỉ hiển thị nhãn nếu phần trăm đủ lớn để tránh chồng chéo

                        const RADIAN = Math.PI / 180;
                        // Tính toán vị trí của nhãn bên trong miếng bánh
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize="12">
                            {value}
                          </text>
                        );
                      }}
                    >
                      {activityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <h3>Hoạt động gần đây</h3>
            </div>
            <div className={styles.activityList}>
            {dashboardData?.recentActivities.slice(0, 5).map((activity: RecentActivity, index: number) => (
                <div className={styles.activityItem} key={index}>
                  <div className={styles.activityIcon}>
                    {/* Thay đổi icon dựa trên activityType */}
                    {activity.activityType === 'USER_REGISTRATION' && <i className="bi bi-person-plus"></i>} 
                    {activity.activityType === 'APPOINTMENT_CREATED' && <i className="bi bi-calendar-plus"></i>}
                    {activity.activityType === 'ARTICLE_PUBLISHED' && <i className="bi bi-file-plus"></i>}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>{activity.title}</div>
                    <div className={styles.activityDesc}>{activity.description}</div>
                    <div className={styles.activityTime}>{new Date(activity.createdAt).toLocaleString('vi-VN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
    </div>
  );
}