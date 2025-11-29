import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/pages/MaintenancePage.module.css';

function formatSchedule(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('vi-VN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [message, setMessage] = useState('Hệ thống đang bảo trì.');
  const [schedule, setSchedule] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchMaintenanceInfo = async () => {
      try {
        const [messageRes, scheduleRes] = await Promise.all([
          apiClient.get('/SystemConfiguration/MAINTENANCE_MESSAGE'),
          apiClient.get('/SystemConfiguration/MAINTENANCE_SCHEDULE'),
        ]);

        setMessage(messageRes.data?.configValue || 'Hệ thống đang bảo trì.');
        setSchedule(scheduleRes.data?.configValue || null);
      } catch (error) {
        console.error('Failed to load maintenance information', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaintenanceInfo();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  const scheduleText = schedule ? formatSchedule(schedule) : null;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Logout sẽ tự động redirect, nhưng để chắc chắn
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <i className="bi bi-cone-striped"></i>
        </div>
        <h1 className={styles.title}>Hệ thống đang bảo trì</h1>
        <p className={styles.message}>{message}</p>
        {scheduleText && (
          <p className={styles.schedule}>Dự kiến hoàn thành: {scheduleText}</p>
        )}
        
        {user ? (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <i className="bi bi-person-circle"></i>
              <span className={styles.userName}>Xin chào, {user.fullName || user.email}</span>
            </div>
            <div className={styles.actions}>
              <button 
                className={styles.logoutBtn} 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <i className="bi bi-box-arrow-right"></i>
                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            <button 
              className={styles.loginBtn} 
              onClick={() => navigate('/login')}
            >
              <i className="bi bi-box-arrow-in-right"></i>
              Đăng nhập
            </button>
          </div>
        )}
        
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Chúng tôi đang nỗ lực để cải thiện dịch vụ. Vui lòng quay lại sau.
          </p>
        </div>
      </div>
    </div>
  );
};

