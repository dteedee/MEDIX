import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from './DoctorLayout';
import { useNavigate } from 'react-router-dom';
import styles from './DoctorSidebar.module.css';

interface DoctorSidebarProps {
  currentPage?: string;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ currentPage = 'dashboard' }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewProfile = () => {
    setShowUserMenu(false);
    navigate('/app/doctor/profile');
  };

  const handleGoHome = () => {
    setShowUserMenu(false);
    navigate('/');
    // Scroll to top when navigating to home
    window.scrollTo(0, 0);
  };

  return (
    <div className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo}>
          <div className={styles.logoContainer}>
            <img src="/images/medix-logo.png" alt="MEDIX" />
            <div className={styles.bubble1}></div>
            <div className={styles.bubble2}></div>
            <div className={styles.bubble3}></div>
          </div>
          {sidebarOpen && <span>MEDIX Doctor</span>}
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        <a 
          href="/app/doctor" 
          className={`${styles.navItem} ${currentPage === 'dashboard' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-speedometer2"></i>
          {sidebarOpen && <span>Dashboard</span>}
        </a>
        <a 
          href="/app/doctor/schedule" 
          className={`${styles.navItem} ${currentPage === 'schedule' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-calendar-week"></i>
          {sidebarOpen && <span>Lịch làm việc</span>}
        </a>
        <a 
          href="/app/doctor/appointments" 
          className={`${styles.navItem} ${currentPage === 'appointments' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-calendar-check"></i>
          {sidebarOpen && <span>Lịch hẹn</span>}
        </a>
        <a 
          href="/app/doctor/patients" 
          className={`${styles.navItem} ${currentPage === 'patients' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-people"></i>
          {sidebarOpen && <span>Bệnh nhân</span>}
        </a>
        <a 
          href="/app/doctor/wallet" 
          className={`${styles.navItem} ${currentPage === 'wallet' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-wallet2"></i>
          {sidebarOpen && <span>Ví & doanh thu</span>}
        </a>
        <a 
          href="/app/doctor/packages" 
          className={`${styles.navItem} ${currentPage === 'packages' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-box"></i>
          {sidebarOpen && <span>Gói dịch vụ</span>}
        </a>
        <a 
          href="/app/doctor/feedback" 
          className={`${styles.navItem} ${currentPage === 'feedback' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-chat-dots"></i>
          {sidebarOpen && <span>Phản hồi</span>}
        </a>
      </nav>

      <div className={styles.userSection} ref={userMenuRef}>
        <div 
          className={styles.userInfo}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className={styles.userAvatar}>
            <img 
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.email || 'Doctor')}&background=667eea&color=fff`}
              alt={user?.fullName || 'Doctor'}
            />
          </div>
          {sidebarOpen && (
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.fullName || 'Doctor'}</div>
              <div className={styles.userRole}>Bác sĩ</div>
            </div>
          )}
          {sidebarOpen && (
            <div className={styles.userMenuToggle}>
              <i className={`bi bi-chevron-${showUserMenu ? 'up' : 'down'}`}></i>
            </div>
          )}
        </div>

        {showUserMenu && sidebarOpen && (
          <div className={styles.userMenu}>
            <button className={styles.menuItem} onClick={handleGoHome}>
              <i className="bi bi-house-door"></i>
              <span>Trang chủ</span>
            </button>
            <button className={styles.menuItem} onClick={handleViewProfile}>
              <i className="bi bi-person"></i>
              <span>Xem tài khoản</span>
            </button>
            <div className={styles.menuDivider}></div>
            <button className={styles.menuItem} onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        {!sidebarOpen && (
          <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
            <i className="bi bi-box-arrow-right"></i>
          </button>
        )}
      </div>

      <button 
        className={styles.sidebarToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? 'Thu gọn sidebar' : 'Mở rộng sidebar'}
      >
        <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`}></i>
      </button>
    </div>
  );
};

export default DoctorSidebar;
