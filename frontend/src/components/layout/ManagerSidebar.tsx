import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from './ManagerLayout';
import { useNavigate, Link } from 'react-router-dom';
import styles from './ManagerSidebar.module.css';

interface ManagerSidebarProps {
  currentPage?: string;
}

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ currentPage = 'dashboard' }) => {
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

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewProfile = () => {
    setShowUserMenu(false);
    navigate('/app/manager/profile');
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
          {sidebarOpen && <span>MEDIX Manager</span>}
        </div>
      </div>

      <nav className={styles.sidebarNav}>
        <Link
          to="/app/manager"
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
          to="/app/manager/doctors"
          className={`${styles.navItem} ${currentPage === 'doctors' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-person-badge"></i>
          {sidebarOpen && <span>Quản lý bác sĩ</span>}
        </Link>
        <Link
          to="/app/manager/reports"
          className={`${styles.navItem} ${currentPage === 'reports' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-graph-up"></i>
          {sidebarOpen && <span>Báo cáo & Thống kê</span>}
        </Link>
        <Link
          to="/app/manager/articles"
          className={`${styles.navItem} ${currentPage === 'articles' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-file-text"></i>
          {sidebarOpen && <span>Bài viết</span>}
        </Link>
        <Link
          to="/app/manager/banners"
          className={`${styles.navItem} ${currentPage === 'banners' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-image"></i>
          {sidebarOpen && <span>Banner</span>}
        </Link>
        <Link
          to="/app/manager/categories"
          className={`${styles.navItem} ${currentPage === 'reports' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-grid"></i>
          {sidebarOpen && <span>Danh mục</span>}
        </Link>

        <Link
          to="/app/manager/services"
          className={`${styles.navItem} ${currentPage === 'services' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-box"></i>
          {sidebarOpen && <span>Gói dịch vụ</span>}
        </Link>
        {/* <Link
          to="/app/manager/commissions"
          className={`${styles.navItem} ${currentPage === 'commissions' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-percent"></i>
          {sidebarOpen && <span>Hoa hồng</span>}
        </Link> */}
        <Link
          to="/app/manager/transfer-transactions"
          className={`${styles.navItem} ${currentPage === 'transfer-transactions' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >

          <i className="bi bi-arrow-left-right"></i>
          {sidebarOpen && <span>Yêu cầu chuyển tiền</span>}
        </Link>


        <Link
          to="/app/manager/feedback"
          className={`${styles.navItem} ${currentPage === 'feedback' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-chat-dots"></i>
          {sidebarOpen && <span>Phản hồi</span>}
        </Link>

        <Link
          to="/app/manager/promotions"
          className={`${styles.navItem} ${currentPage === 'promotions' ? styles.active : ''}`}
          onClick={() => setShowUserMenu(false)}
        >
          <i className="bi bi-tag-fill"></i>
          {sidebarOpen && <span>Khuyến mãi</span>}
        </Link>
      </nav>

      <div className={styles.userSection} ref={userMenuRef}>
        <div
          className={styles.userInfo}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className={styles.userAvatar}>
            <img
              src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.email || 'Manager')}&background=667eea&color=fff`}
              alt={user?.fullName || 'Manager'}
            />
          </div>
          {sidebarOpen && (
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user?.fullName || 'Manager'}</div>
              <div className={styles.userRole}>Quản lý</div>
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

export default ManagerSidebar;
