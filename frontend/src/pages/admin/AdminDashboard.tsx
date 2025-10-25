import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/admin/AdminDashboard.module.css';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <img src="/images/medix-logo.png" alt="MEDIX" />
            {sidebarOpen && <span>MEDIX Admin</span>}
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <a href="/app/admin" className={`${styles.navItem} ${styles.active}`}>
            <i className="bi bi-speedometer2"></i>
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="/app/admin/users" className={styles.navItem}>
            <i className="bi bi-people"></i>
            {sidebarOpen && <span>Người dùng</span>}
          </a>
          <a href="/app/admin/tracking" className={styles.navItem}>
            <i className="bi bi-search"></i>
            {sidebarOpen && <span>Truy vết</span>}
          </a>
          <a href="/app/admin/settings" className={styles.navItem}>
            <i className="bi bi-gear"></i>
            {sidebarOpen && <span>Cấu hình</span>}
          </a>
        </nav>

        {/* User Section */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
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
          </div>
          <button 
            className={styles.logoutBtn}
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Đăng xuất"
          >
            <i className="bi bi-box-arrow-right"></i>
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>

        <button 
          className={styles.sidebarToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`}></i>
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>Dashboard</h1>
              <p className={styles.subtitle}>Tổng quan hệ thống và thống kê</p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.dateTime}>
                <i className="bi bi-calendar3"></i>
                <span>{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCard1}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-people-fill"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Tổng người dùng</div>
                <div className={styles.statValue}>1,234</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>+12.5% so với tháng trước</span>
                </div>
              </div>
              <div className={styles.statBg}>
                <i className="bi bi-people-fill"></i>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard2}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-hospital"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Bác sĩ</div>
                <div className={styles.statValue}>89</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>+5.2% tuần này</span>
                </div>
              </div>
              <div className={styles.statBg}>
                <i className="bi bi-hospital"></i>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-calendar-check"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Lịch hẹn hôm nay</div>
                <div className={styles.statValue}>45</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>+8.3% so với hôm qua</span>
                </div>
              </div>
              <div className={styles.statBg}>
                <i className="bi bi-calendar-check"></i>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard4}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-file-text"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Bài viết</div>
                <div className={styles.statValue}>156</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>+3.1% tháng này</span>
                </div>
              </div>
              <div className={styles.statBg}>
                <i className="bi bi-file-text"></i>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Thống kê người dùng</h3>
                <div className={styles.chartActions}>
                  <button className={styles.chartBtn}>7 ngày</button>
                  <button className={`${styles.chartBtn} ${styles.active}`}>30 ngày</button>
                  <button className={styles.chartBtn}>90 ngày</button>
                </div>
              </div>
              <div className={styles.chartContent}>
                <div className={styles.chartPlaceholder}>
                  <i className="bi bi-bar-chart"></i>
                  <p>Biểu đồ thống kê người dùng</p>
                </div>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Hoạt động hệ thống</h3>
                <div className={styles.chartActions}>
                  <button className={`${styles.chartBtn} ${styles.active}`}>Hôm nay</button>
                  <button className={styles.chartBtn}>Tuần này</button>
                </div>
              </div>
              <div className={styles.chartContent}>
                <div className={styles.chartPlaceholder}>
                  <i className="bi bi-pie-chart"></i>
                  <p>Biểu đồ hoạt động hệ thống</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <h3>Hoạt động gần đây</h3>
              <button className={styles.viewAllBtn}>Xem tất cả</button>
            </div>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <i className="bi bi-person-plus"></i>
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Người dùng mới đăng ký</div>
                  <div className={styles.activityDesc}>Nguyễn Văn A đã đăng ký tài khoản</div>
                  <div className={styles.activityTime}>2 phút trước</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <i className="bi bi-calendar-plus"></i>
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Lịch hẹn mới</div>
                  <div className={styles.activityDesc}>Bệnh nhân đặt lịch với Bác sĩ B</div>
                  <div className={styles.activityTime}>15 phút trước</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <i className="bi bi-file-plus"></i>
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>Bài viết mới</div>
                  <div className={styles.activityDesc}>"Chăm sóc sức khỏe mùa đông" đã được xuất bản</div>
                  <div className={styles.activityTime}>1 giờ trước</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}