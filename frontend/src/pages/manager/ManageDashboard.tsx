import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { FaStar, FaRegStar,
  FaUserMd, FaCalendarAlt, FaCalendarCheck, FaCalendarTimes,
  FaClock, FaUserClock, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaBan, FaRunning, FaUserInjured
} from 'react-icons/fa';

import type {
  ManagerDashboardData, Appointment, TodayAppointment
} from '../../services/managerDashboardService';
import { managerDashboardService } from '../../services/managerDashboardService';
import { PageLoader } from '../../components/ui';
import styles from '../../styles/manager/ManageDashboard.module.css';

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch (error) {
    return "Thời gian không hợp lệ";
  }
};

const formatTime = (timeString: string) => {
  try {
    // Giả sử timeString là "HH:mm:ss"
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  } catch {
    return timeString;
  }
};

const getAppointmentStatusInfo = (status: string) => {
  const statusMap: { [key: string]: { icon: React.ReactElement, text: string, className: string } } = {
    Confirmed: { icon: <FaCheckCircle />, text: 'Đã xác nhận', className: 'text-green-500' },
    OnProgressing: { icon: <FaRunning />, text: 'Đang diễn ra', className: 'text-blue-500' },
    CancelledByPatient: { icon: <FaTimesCircle />, text: 'Bệnh nhân hủy', className: 'text-red-500' },
    CancelledByDoctor: { icon: <FaBan />, text: 'Bác sĩ hủy', className: 'text-red-600' }, // NOSONAR
    MissedByDoctor: { icon: <FaUserClock />, text: 'Bác sĩ vắng', className: 'text-yellow-600' },
    MissedByPatient: { icon: <FaUserInjured />, text: 'Bệnh nhân không đến', className: 'text-yellow-500' },
    NoShow: { icon: <FaUserInjured />, text: 'Bệnh nhân không đến', className: 'text-yellow-500' }, // Giữ lại để tương thích
    Completed: { icon: <FaCheckCircle />, text: 'Đã hoàn thành', className: 'text-gray-500' },
    BeforeAppointment: { icon: <FaCalendarAlt />, text: 'Sắp diễn ra', className: 'text-purple-500' }, // NOSONAR
    BeforeAppoiment: { icon: <FaCalendarAlt />, text: 'Sắp diễn ra', className: 'text-purple-500' }, // Xử lý lỗi chính tả từ backend
    default: { icon: <FaQuestionCircle />, text: 'Không xác định', className: 'text-gray-400' }
  };
  return statusMap[status] || statusMap.default;
};

const renderStars = (rating: number) => {
  const stars = [];
  const validRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(validRating);
  const emptyStars = 5 - fullStars;

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
    const fetchDashboardData = async () => { //NOSONAR
      setIsLoading(true);
      setError(null);
      try {
        // Sử dụng service để gọi API, giúp xử lý xác thực và lỗi nhất quán
        const data = await managerDashboardService.getDashboardData();
        setDashboardData(data);
      } catch (err: any) {
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

  const { appointmentStats, doctorsTodaySchedules, todayAppointments, allAppointments } = dashboardData;

  const doctorsWithShifts = doctorsTodaySchedules.filter((d) => d.workShifts.length > 0);
  const recentFeedbacks = allAppointments.filter(appt => appt.review).slice(0, 5); // Lấy 5 đánh giá gần nhất

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <i className="bi bi-speedometer2" style={{ fontSize: '28px' }}></i>
            </div>
            <div>
              <h1 className={styles.title}>Manager Dashboard</h1>
              <p className={styles.subtitle}>Tổng quan và quản lý hệ thống MEDIX</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.statsGrid}>
        {/* Stats Cards */}
        <StatCard
          title="Bác sĩ làm việc hôm nay"
          value={doctorsWithShifts.length}
          description="Số bác sĩ có ca làm việc trong ngày"
          icon={<FaUserMd />}
          colorClass="Green"
        />
        <StatCard
          title="Tổng số lịch hẹn"
          value={appointmentStats.totalAppointments}
          description="Tất cả các lịch hẹn đã tạo"
          icon={<FaCalendarAlt />}
          colorClass="Blue"
        />
        <StatCard //NOSONAR
          title="Lịch hẹn hôm nay"
          value={appointmentStats.todayAppointmentsCount}
          description="Các lịch hẹn trong ngày hôm nay"
          icon={<FaCalendarAlt />}
          colorClass="Blue"
        />
        <StatCard
          title="Sắp diễn ra" //NOSONAR
          value={
            allAppointments.filter(
              (a) => a.status === 'BeforeAppoiment'
            ).length
          }
          description="Lịch hẹn đang chờ diễn ra"
          icon={<FaCalendarCheck />}
          colorClass="Green"
        />
        <StatCard
          title="Bác sĩ vắng"
          value={appointmentStats.missedByDoctor}
          description="Lịch hẹn bị bác sĩ bỏ lỡ"
          icon={<FaUserClock />}
          colorClass="Yellow"
        />
        <StatCard
          title="Bệnh nhân không đến"
          // TODO: Update AppointmentStats type to include missedByPatient and use it here.
          value={appointmentStats.missedByPatient}
          description="Lịch hẹn bị bệnh nhân bỏ lỡ"
          icon={<FaUserInjured />}
          colorClass="Yellow"
        />
      </div>

      <div className={styles.mainGrid}>
        {/* --- Cột Trái: Thông tin trong ngày --- */}
        <div className={styles.contentColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Lịch hẹn trong ngày</h3>
            </div>
            <div className={styles.cardContent}>
              {todayAppointments && todayAppointments.length > 0 ? (
                <div className={styles.cardContentListScrollable}>
                  {todayAppointments.map((appt) => {
                    const statusInfo = getAppointmentStatusInfo(appt.status);
                    return (
                      <div key={appt.appointmentId} className={styles.appointmentItem}>
                        <div className="flex-grow">
                          <p className="font-bold text-gray-800">{appt.patientName}</p>
                          <p className="text-sm text-gray-600">
                            Bác sĩ: <span className="font-semibold">{appt.doctorName}</span> ({appt.specialization})
                          </p>
                          <div className="text-sm text-blue-600 flex items-center mt-1">
                            <FaClock className="mr-2" />
                            <span>{format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}</span>
                          </div>
                        </div>
                        <div className={`flex items-center text-sm font-semibold ${statusInfo.className}`}>
                          {statusInfo.icon}
                          <span className="ml-2">{statusInfo.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.emptyState}>Không có lịch hẹn nào hôm nay.</p>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Lịch làm việc của Bác sĩ hôm nay</h3>
            </div>
            <div className={styles.cardContent}>
              {doctorsWithShifts.length > 0 ? (
                <div className={styles.cardContentListScrollable}>
                  {doctorsWithShifts.map((doctor) => (
                    <div key={doctor.doctorId} className={styles.doctorScheduleItem}>
                      <div className="flex items-center mb-2">
                        <FaUserMd className="text-xl text-blue-500 mr-3" />
                        <div>
                          <h4 className="font-bold text-gray-800">{doctor.doctorName}</h4>
                          <p className="text-sm text-gray-500">{doctor.specializationName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>Không có bác sĩ nào có lịch làm việc hôm nay.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Cột Phải: Thông tin tổng quan --- */}
        <div className={styles.contentColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Tất cả lịch hẹn</h3>
            </div>
            <div className={styles.cardContent}>
              {allAppointments.length > 0 ? (
                <div className={styles.cardContentListScrollable}>
                  {allAppointments.map((appt) => {
                    const statusInfo = getAppointmentStatusInfo(appt.status);
                    return (
                      <div key={appt.appointmentId} className={styles.appointmentItem}>
                        <div className="flex-grow">
                          <p className="font-bold text-gray-800">{appt.patientName}</p>
                          <p className="text-sm text-gray-600">BS. {appt.doctorName} - {format(new Date(appt.startTime), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                        <div className={`flex items-center text-sm font-semibold ${statusInfo.className}`}>
                          {statusInfo.icon}
                          <span className="ml-2">{statusInfo.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.emptyState}>Không có lịch hẹn nào trong hệ thống.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Khu vực Đánh giá gần đây (Full-width) --- */}
      <div className={`${styles.card} ${styles.fullWidthCard}`}>
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
          {recentFeedbacks.length > 0 ? (
            <div className="space-y-5">
              {recentFeedbacks.map((feedback) => (
                <div key={feedback.appointmentId} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {feedback.patientName.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">{feedback.patientName}</p>
                      {feedback.review && renderStars(feedback.review.rating)}
                    </div>
                    <p className="text-sm text-gray-700 mt-2 italic border-l-4 border-gray-200 pl-3">
                      "{feedback.review?.comment || 'Không có bình luận'}"
                    </p>
                    <p className="text-xs text-gray-400 mt-2 text-right">Ngày hẹn: {format(new Date(feedback.startTime), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Chưa có đánh giá nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};
