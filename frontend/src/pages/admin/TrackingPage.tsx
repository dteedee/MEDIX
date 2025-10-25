import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/admin/TrackingPage.module.css';

export default function TrackingPage() {
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
          <a href="/app/admin" className={styles.navItem}>
            <i className="bi bi-speedometer2"></i>
            {sidebarOpen && <span>Dashboard</span>}
          </a>
          <a href="/app/admin/users" className={styles.navItem}>
            <i className="bi bi-people"></i>
            {sidebarOpen && <span>Người dùng</span>}
          </a>
          <a href="/app/admin/tracking" className={`${styles.navItem} ${styles.active}`}>
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
              <h1 className={styles.title}>Truy vết</h1>
              <p className={styles.subtitle}>Theo dõi và phân tích hoạt động hệ thống</p>
            </div>
            <div className={styles.headerRight}>
              <button className={styles.exportBtn}>
                <i className="bi bi-download"></i>
                Xuất báo cáo
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className={styles.searchSection}>
            <div className={styles.searchWrapper}>
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm theo IP, User ID, hoặc Action..."
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <select className={styles.filterSelect}>
                <option value="all">Tất cả hành động</option>
                <option value="login">Đăng nhập</option>
                <option value="logout">Đăng xuất</option>
                <option value="create">Tạo mới</option>
                <option value="update">Cập nhật</option>
                <option value="delete">Xóa</option>
              </select>
              <select className={styles.filterSelect}>
                <option value="all">Tất cả người dùng</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
              <input type="date" className={styles.dateInput} />
              <button className={styles.searchBtn}>
                <i className="bi bi-search"></i>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCard1}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-eye"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Tổng lượt truy cập</div>
                <div className={styles.statValue}>12,456</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>+8.2% hôm nay</span>
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard2}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-person-check"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Người dùng hoạt động</div>
                <div className={styles.statValue}>234</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-up"></i>
                  <span>+12.5% so với hôm qua</span>
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-shield-exclamation"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Cảnh báo bảo mật</div>
                <div className={styles.statValue}>3</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-down"></i>
                  <span>-2 so với tuần trước</span>
                </div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard4}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-clock-history"></i>
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Thời gian phản hồi</div>
                <div className={styles.statValue}>245ms</div>
                <div className={styles.statTrend}>
                  <i className="bi bi-graph-down"></i>
                  <span>-15ms cải thiện</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className={styles.logCard}>
            <div className={styles.logHeader}>
              <h3>Nhật ký hoạt động</h3>
              <div className={styles.logActions}>
                <button className={styles.refreshBtn}>
                  <i className="bi bi-arrow-clockwise"></i>
                  Làm mới
                </button>
                <button className={styles.filterBtn}>
                  <i className="bi bi-funnel"></i>
                  Bộ lọc
                </button>
              </div>
            </div>
            <div className={styles.logTable}>
              <table>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Người dùng</th>
                    <th>Hành động</th>
                    <th>IP Address</th>
                    <th>Trạng thái</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>14:32:15</td>
                    <td>
                      <div className={styles.userCell}>
                        <img src="https://ui-avatars.com/api/?name=Admin&background=667eea&color=fff" alt="Admin" />
                        <span>admin@medix.com</span>
                      </div>
                    </td>
                    <td><span className={styles.actionBadge}>Đăng nhập</span></td>
                    <td>192.168.1.100</td>
                    <td><span className={styles.statusSuccess}>Thành công</span></td>
                    <td>
                      <button className={styles.detailBtn}>
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>14:28:42</td>
                    <td>
                      <div className={styles.userCell}>
                        <img src="https://ui-avatars.com/api/?name=Doctor&background=667eea&color=fff" alt="Doctor" />
                        <span>doctor@medix.com</span>
                      </div>
                    </td>
                    <td><span className={styles.actionBadge}>Cập nhật hồ sơ</span></td>
                    <td>192.168.1.105</td>
                    <td><span className={styles.statusSuccess}>Thành công</span></td>
                    <td>
                      <button className={styles.detailBtn}>
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>14:25:18</td>
                    <td>
                      <div className={styles.userCell}>
                        <img src="https://ui-avatars.com/api/?name=Patient&background=667eea&color=fff" alt="Patient" />
                        <span>patient@medix.com</span>
                      </div>
                    </td>
                    <td><span className={styles.actionBadge}>Đặt lịch hẹn</span></td>
                    <td>192.168.1.110</td>
                    <td><span className={styles.statusSuccess}>Thành công</span></td>
                    <td>
                      <button className={styles.detailBtn}>
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td>14:20:33</td>
                    <td>
                      <div className={styles.userCell}>
                        <img src="https://ui-avatars.com/api/?name=Unknown&background=667eea&color=fff" alt="Unknown" />
                        <span>unknown@example.com</span>
                      </div>
                    </td>
                    <td><span className={styles.actionBadge}>Đăng nhập</span></td>
                    <td>192.168.1.200</td>
                    <td><span className={styles.statusError}>Thất bại</span></td>
                    <td>
                      <button className={styles.detailBtn}>
                        <i className="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
