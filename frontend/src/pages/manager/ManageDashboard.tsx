import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers, FaCalendarAlt, FaCalendarCheck, FaCalendarTimes,
  FaUserPlus, FaFileAlt, FaBell, FaStar, FaRegStar
} from 'react-icons/fa';

import type {
  ManagerDashboardData,
  ManagerDashboardDoctor as RecentDoctor,
  ManagerDashboardRecentActivity as RecentActivity
} from '../../services/managerDashboardService';
import { managerDashboardService } from '../../services/managerDashboardService';
import { PageLoader } from '../../components/ui'; // Giả sử bạn có component này
import styles from '../../styles/manager/ManageDashboard.module.css';

// --- Helper Functions ---
const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch (error) {
    console.error("Invalid date for formatting:", dateString);
    return "Thời gian không hợp lệ";
  }
};

const getActivityIcon = (activityType: string) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    DOCTOR_REGISTRATION: <FaUserPlus className={`${styles.activityIcon} text-blue-500`} />,
    APPOINTMENT: <FaCalendarCheck className={`${styles.activityIcon} text-green-500`} />,
    ARTICLE_PUBLISHED: <FaFileAlt className={`${styles.activityIcon} text-purple-500`} />,
    default: <FaBell className={`${styles.activityIcon} text-gray-500`} />,
  };
  return iconMap[activityType] || iconMap.default;
};

const getDoctorStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'online':
      return 'bg-green-100 text-green-800';
    case 'offline':
      return 'bg-gray-100 text-gray-800';
    case 'busy':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

const renderStars = (rating: number) => {
  const stars = [];
  // API trả về rating 0-5, nên cần xử lý trường hợp 0 sao
  const validRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(validRating);
  const halfStar = validRating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className="text-gray-300" />);
  }
  return <div className="flex items-center">{stars}</div>;
};

// --- Sub-components ---

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactElement;
  colorClass: 'Green' | 'Blue' | 'Red' | 'Yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, colorClass }) => {
  const valueColorClass = `statCardValue${colorClass}`;
  const iconCircleColorClass = `iconCircle${colorClass}`;

  return (
    <div className={`${styles.statCard} ${styles.statCardWithIcon}`}>
      <div className={styles.iconWrapper}>
        <div className={`${styles.iconCircle} ${styles[iconCircleColorClass]}`}>
          {React.cloneElement(icon, { className: styles.icon })}
        </div>
      </div>
      <div>
        <h3 className={styles.statCardTitle}>{title}</h3>
        <p className={`${styles.statCardValue} ${styles[valueColorClass]}`}>{value}</p>
        {description && <p className={styles.statCardDescription}>{description}</p>}
      </div>
    </div>
  );
};

export const ManageDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Sử dụng service để gọi API, giúp xử lý xác thực và lỗi nhất quán
        const data = await managerDashboardService.getDashboardData();
        setDashboardData(data);
      } catch (err: any) {
        console.error("Không thể tải dữ liệu dashboard:", err);
        setError("Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.container}>
        <p className="text-center text-gray-700">Không có dữ liệu để hiển thị.</p>
      </div>
    );
  }

  const { summary, recentDoctors, recentActivities, recentFeedbacks } = dashboardData;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Manager Dashboard</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>
      <div className={styles.statsGrid}>
        {/* Stats Cards */}
        <StatCard
          title="Bác sĩ hoạt động"
          value={summary.activeDoctors}
          description="Bác sĩ đang online"
          icon={<FaUsers />}
          colorClass="Green"
        />

        <StatCard
          title="Lịch hẹn hôm nay"
          value={summary.todayAppointments}
          description={`Đã xác nhận: ${summary.todayConfirmedAppointments}`}
          icon={<FaCalendarAlt />}
          colorClass="Blue"
        />

        <StatCard
          title="Lịch hẹn đã hủy"
          value={summary.cancelledAppointments}
          description="Tổng số lịch hẹn bị hủy"
          icon={<FaCalendarTimes />}
          colorClass="Red"
        />


      </div>

      <div className={styles.mainGrid}>
        <div className={styles.mainContentArea}>
          {/* Recent Activities */}
          <div className={`${styles.card} mb-6`}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Hoạt động gần đây</h3>
            </div>
            <div className={styles.cardContent}>
              {recentActivities && recentActivities.length > 0 ? (
                <div className={styles.cardContentListScrollable}>
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.activityType)}
                      </div>
                      <div className="ml-3 flex-grow">
                        <p className="text-sm text-gray-800 font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>Không có hoạt động nào gần đây.</p>
              )}
            </div>
          </div>

          {/* Recent Feedbacks */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Đánh giá gần đây</h3>
              <button
                className={styles.viewAllButton}
                onClick={() => navigate('/app/manager/feedback')}
              >
                Xem tất cả
              </button>
            </div>
            <div className={styles.cardContent}>
              {recentFeedbacks && recentFeedbacks.length > 0 ? (
                <div className="space-y-5">
                  {recentFeedbacks.map((feedback) => (
                    <div key={feedback.reviewId} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {feedback.patientName.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4 flex-grow">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{feedback.patientName}</p>
                            <p className="text-xs text-gray-500">
                              Đã đánh giá bác sĩ <span className="font-semibold">{feedback.doctorName}</span>
                            </p>
                          </div>
                          {renderStars(feedback.rating)}
                        </div>
                        <p className="text-sm text-gray-700 mt-2 italic border-l-4 border-gray-200 pl-3">
                          "{feedback.comment || 'Không có bình luận'}"
                        </p>
                        <p className="text-xs text-gray-400 mt-2 text-right">{formatRelativeTime(feedback.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>Chưa có đánh giá nào gần đây.</p>
              )}
            </div>
          </div>
        </div>

        {/* Doctor Management */}
        <div className={styles.card}>
          {/* <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Bác sĩ gần đây</h3>

          </div> */}
          {/* <div className={styles.cardContent}>
            {recentDoctors && recentDoctors.length > 0 ? (
              <div className={styles.cardContentList}>
                {recentDoctors.map((doctor) => (
                  <div key={doctor.doctorId} className={styles.doctorItem}>
                    <div className={styles.doctorInfo}>
                      <h4>{doctor.doctorName}</h4>
                      <p>{doctor.specialtyName}</p>
                    </div>
                    <div className={styles.doctorActions}>
                      <span className={`${styles.doctorStatus} ${getDoctorStatusClass(doctor.status)}`}>
                        {doctor.statusDisplayName}
                      </span>
                      <button className={styles.viewButton}>Xem</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>Không có hoạt động nào của bác sĩ gần đây.</p>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
};
