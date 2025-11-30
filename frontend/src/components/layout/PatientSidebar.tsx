import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from './PatientLayout';
import { useNavigate, Link } from 'react-router-dom';
import styles from './PatientSidebar.module.css';

interface PatientSidebarProps {
  currentPage?: string;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({ currentPage = 'dashboard' }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = async () => {
    setShowUserMenu(false);

    try {
      await logout();
    } catch (error) {
    }
  };

  const handleViewProfile = () => {
    setShowUserMenu(false);
    navigate('/app/patient/profile');
  };

  const handleGoHome = () => {
    setShowUserMenu(false);
    navigate('/');
    window.scrollTo(0, 0);
  };

  const handleViewDashboard = () => {
    setShowUserMenu(false);
    navigate('/app/patient');
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
          {sidebarOpen && <span>MEDIX Patient</span>}
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        <Link
          to="/app/patient"
          className={`${styles.navItem} ${currentPage === 'dashboard' ? styles.active : ''}`}
          onClick={() => {
            setShowUserMenu(false);
            window.scrollTo(0, 0);
          }}
        >
          <i className="bi bi-speedometer2"></i>
          {sidebarOpen && <span>Dashboard</span>}
        </Link>
        <Link
          to="/app/patient/appointments"
          className={`${styles.navItem} ${currentPage === 'appointments' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-calendar-check"></i>
          {sidebarOpen && <span>Lịch hẹn</span>}
        </Link>
        <Link
          to="/app/patient/results"
          className={`${styles.navItem} ${currentPage === 'results' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-clipboard-data"></i>
          {sidebarOpen && <span>Xem kết quả</span>}
        </Link>
        <Link
          to="/app/patient/finance"
          className={`${styles.navItem} ${currentPage === 'finance' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-credit-card"></i>
          {sidebarOpen && <span>Tài chính</span>}
        </Link>
        <Link
          to="/app/patient/emr-timeline"
          className={`${styles.navItem} ${currentPage === 'emr-timeline' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-file-medical-fill"></i>
          {sidebarOpen && <span>Hồ sơ EMR</span>}
        </Link>
      </nav>

      <div className={styles.userSection} ref={userMenuRef}>
        <div
          className={styles.userInfo}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className={styles.userAvatar}>
            <img
              key={user?.avatarUrl || 'avatar'}
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.email || 'Patient')}&background=667eea&color=fff`}
              alt={user?.fullName || 'Patient'}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.email || 'Patient')}&background=667eea&color=fff`;
              }}
            />
          </div>
          {sidebarOpen && (
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.fullName || 'Bệnh nhân'}</div>
              <div className={styles.userRole}>Bệnh nhân</div>
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

export default PatientSidebar;
