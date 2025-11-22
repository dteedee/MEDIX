import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { managerDashboardService } from '../../services/managerDashboardService';
import { useNavigate } from 'react-router-dom';
import type { 
  ManagerDashboardData, 
  ManagerDashboardDoctor as RecentDoctor, 
  ManagerDashboardRecentActivity as RecentActivity 
} from '../../services/managerDashboardService';
import { PageLoader } from '../../components/ui'; // Giả sử bạn có component này

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
  const iconMap: { [key: string]: string } = {
    DOCTOR_REGISTRATION: 'bi-person-plus-fill text-blue-500',
    APPOINTMENT: 'bi-calendar-check-fill text-green-500',
    ARTICLE_PUBLISHED: 'bi-file-earmark-text-fill text-purple-500',
    default: 'bi-bell-fill text-gray-500',
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
    stars.push(<i key={`full-${i}`} className="bi bi-star-fill text-yellow-400"></i>);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<i key={`empty-${i}`} className="bi bi-star text-gray-300"></i>);
  }
  return <div className="flex items-center">{stars}</div>;
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
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h1>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-700">Không có dữ liệu để hiển thị.</p>
      </div>
    );
  }

  const { summary, recentDoctors, recentActivities, recentFeedbacks } = dashboardData;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manager Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Bác sĩ hoạt động</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{summary.activeDoctors}</p>
          <p className="text-sm text-gray-500 mt-1">Bác sĩ đang online</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Lịch hẹn hôm nay</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{summary.todayAppointments}</p>
          <p className="text-sm text-gray-500 mt-1">Đã xác nhận: {summary.todayConfirmedAppointments}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Đánh giá trung bình</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{summary.averageRating.toFixed(1)} <span className="text-xl">/ 5</span></p>
          <p className="text-sm text-gray-500 mt-1">Từ {summary.totalReviews} đánh giá</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Bác sĩ gần đây</h3>
           
          </div>
          <div className="p-6">
            {recentDoctors.length > 0 ? (
              <div className="space-y-4">
                {recentDoctors.map((doctor) => (
                  <div key={doctor.doctorId} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{doctor.doctorName}</h4>
                      <p className="text-sm text-gray-500">{doctor.specialtyName}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDoctorStatusClass(doctor.status)}`}>
                        {doctor.statusDisplayName}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Xem</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Không có hoạt động nào của bác sĩ gần đây.</p>
            )}
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Hoạt động gần đây</h3>
            
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <i className={`bi ${getActivityIcon(activity.activityType)} text-lg`}></i>
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
              <p className="text-sm text-gray-500 text-center py-4">Không có hoạt động nào gần đây.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Feedbacks */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Đánh giá gần đây</h3>
          <button
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            onClick={() => navigate('/app/manager/feedback')}
          >
            Xem tất cả
          </button>
        </div>
        <div className="p-6">
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
            <p className="text-sm text-gray-500 text-center py-4">Chưa có đánh giá nào gần đây.</p>
          )}
        </div>
      </div>
    </div>
  );
};
