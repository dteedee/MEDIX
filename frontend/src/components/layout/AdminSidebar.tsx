import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from './AdminLayout';
import { useNavigate } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  currentPage?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPage = 'dashboard' }) => {
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
    navigate('/app/admin/profile');
  };

  const handleGoHome = () => {
    setShowUserMenu(false);
    navigate('/');
    // Scroll to top when navigating to home
    window.scrollTo(0, 0);
  };

  const handleChangePassword = () => {
    setShowUserMenu(false);
    // Navigate to change password page or show change password modal
    console.log('Change password');
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
          {sidebarOpen && <span>MEDIX Admin</span>}
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        <a 
          href="/app/admin" 
          className={`${styles.navItem} ${currentPage === 'dashboard' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-speedometer2"></i>
          {sidebarOpen && <span>Dashboard</span>}
        </a>
        <a 
          href="/app/admin/users" 
          className={`${styles.navItem} ${currentPage === 'users' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-people"></i>
          {sidebarOpen && <span>Người dùng</span>}
        </a>
        <a 
          href="/app/admin/tracking" 
          className={`${styles.navItem} ${currentPage === 'tracking' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-search"></i>
          {sidebarOpen && <span>Truy vết</span>}
        </a>
        <a 
          href="/app/admin/settings" 
          className={`${styles.navItem} ${currentPage === 'settings' ? styles.active : ''}`}
          onClick={() => window.scrollTo(0, 0)}
        >
          <i className="bi bi-gear"></i>
          {sidebarOpen && <span>Cấu hình</span>}
        </a>
      </nav>

      <div className={styles.userSection} ref={userMenuRef}>
        <div 
          className={styles.userInfo}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className={styles.userAvatar}>
            <img 
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.email || 'Admin')}&background=667eea&color=fff`}
              alt={user?.fullName || 'Admin'}
            />
          </div>
          {sidebarOpen && (
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.fullName || 'Admin'}</div>
              <div className={styles.userRole}>Quản trị viên</div>
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
    </div>
  );
};

export default AdminSidebar;
