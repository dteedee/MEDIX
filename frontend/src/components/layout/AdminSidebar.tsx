import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from './AdminLayout';
import styles from './AdminSidebar.module.css';

interface AdminSidebarProps {
  currentPage?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentPage = 'dashboard' }) => {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
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
        >
          <i className="bi bi-speedometer2"></i>
          {sidebarOpen && <span>Dashboard</span>}
        </a>
        <a 
          href="/app/admin/users" 
          className={`${styles.navItem} ${currentPage === 'users' ? styles.active : ''}`}
        >
          <i className="bi bi-people"></i>
          {sidebarOpen && <span>Người dùng</span>}
        </a>
        <a 
          href="/app/admin/tracking" 
          className={`${styles.navItem} ${currentPage === 'tracking' ? styles.active : ''}`}
        >
          <i className="bi bi-search"></i>
          {sidebarOpen && <span>Truy vết</span>}
        </a>
        <a 
          href="/app/admin/settings" 
          className={`${styles.navItem} ${currentPage === 'settings' ? styles.active : ''}`}
        >
          <i className="bi bi-gear"></i>
          {sidebarOpen && <span>Cấu hình</span>}
        </a>
      </nav>

      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <img src="/images/medix-logo.png" alt="Admin" />
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>{user?.fullName || 'Admin'}</div>
            <div className={styles.userRole}>Quản trị viên</div>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          {sidebarOpen && <span>Đăng xuất</span>}
        </button>
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
