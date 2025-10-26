import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from './PatientLayout';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordModal } from '../../pages/auth/ChangePasswordModal';
import styles from './PatientSidebar.module.css';

interface PatientSidebarProps {
  currentPage?: string;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({ currentPage = 'dashboard' }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
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
    navigate('/app/patient/profile');
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    setShowChangePasswordModal(true);
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
        <a 
          href="/app/patient" 
          className={`${styles.navItem} ${currentPage === 'dashboard' ? styles.active : ''}`}
        >
          <i className="bi bi-speedometer2"></i>
          {sidebarOpen && <span>Dashboard</span>}
        </a>
        <a 
          href="/app/patient/appointments" 
          className={`${styles.navItem} ${currentPage === 'appointments' ? styles.active : ''}`}
        >
          <i className="bi bi-calendar-check"></i>
          {sidebarOpen && <span>Lịch hẹn</span>}
        </a>
        <a 
          href="/app/patient/results" 
          className={`${styles.navItem} ${currentPage === 'results' ? styles.active : ''}`}
        >
          <i className="bi bi-clipboard-data"></i>
          {sidebarOpen && <span>Xem kết quả</span>}
        </a>
        <a 
          href="/app/patient/finance" 
          className={`${styles.navItem} ${currentPage === 'finance' ? styles.active : ''}`}
        >
          <i className="bi bi-credit-card"></i>
          {sidebarOpen && <span>Tài chính</span>}
        </a>
      </nav>

      <div className={styles.userSection} ref={userMenuRef}>
        <div 
          className={styles.userInfo}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className={styles.userAvatar}>
            <img 
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.email || 'Patient')}&background=667eea&color=fff`}
              alt={user?.fullName || 'Patient'}
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
            <button className={styles.menuItem} onClick={handleViewProfile}>
              <i className="bi bi-person"></i>
              <span>Xem tài khoản</span>
            </button>
            <button className={styles.menuItem} onClick={handleChangePassword}>
              <i className="bi bi-key"></i>
              <span>Đổi mật khẩu</span>
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          setShowChangePasswordModal(false);
          // Optionally show success message or redirect
        }}
      />
    </div>
  );
};

export default PatientSidebar;
