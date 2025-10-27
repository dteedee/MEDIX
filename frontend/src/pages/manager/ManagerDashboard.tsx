import React, { useState, useEffect } from 'react';
import styles from '../../styles/manager/ManagerDashboard.module.css';

interface DashboardStats {
  totalDoctors: number;
  totalArticles: number;
  totalBanners: number;
  totalPackages: number;
  monthlyRevenue: number;
  totalCommissions: number;
  pendingFeedback: number;
  activeUsers: number;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalArticles: 0,
    totalBanners: 0,
    totalPackages: 0,
    monthlyRevenue: 0,
    totalCommissions: 0,
    pendingFeedback: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('30days');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        // const response = await managerDashboardService.getStats();
        // setStats(response.data);
        
        // Mock data for now
        setStats({
          totalDoctors: 45,
          totalArticles: 156,
          totalBanners: 12,
          totalPackages: 8,
          monthlyRevenue: 12500000,
          totalCommissions: 2500000,
          pendingFeedback: 23,
          activeUsers: 1234
        });
      } catch (err) {
        setError('Không thể tải dữ liệu dashboard');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dashboard Manager</h1>
          <p className={styles.subtitle}>Tổng quan quản lý hệ thống và thống kê</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className={styles.filterBtn}
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          >
            <i className="bi bi-funnel"></i>
            Bộ lọc
            <i className={`bi bi-chevron-${showAdvancedFilter ? 'up' : 'down'}`}></i>
          </button>
        </div>

        {showAdvancedFilter && (
          <div className={styles.advancedFilter}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>Thời gian</label>
                <select value={selectedChartPeriod} onChange={(e) => setSelectedChartPeriod(e.target.value)}>
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                  <option value="90days">90 ngày qua</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Loại dữ liệu</label>
                <select>
                  <option value="all">Tất cả</option>
                  <option value="doctors">Bác sĩ</option>
                  <option value="articles">Bài viết</option>
                  <option value="banners">Banner</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-person-badge"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng bác sĩ</div>
            <div className={styles.statValue}>{stats.totalDoctors}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+5.2% tuần này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-person-badge"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-file-text"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Bài viết</div>
            <div className={styles.statValue}>{stats.totalArticles}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+12.3% tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-file-text"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-image"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Banner</div>
            <div className={styles.statValue}>{stats.totalBanners}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+2.1% tuần này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-image"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-box"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Gói dịch vụ</div>
            <div className={styles.statValue}>{stats.totalPackages}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+1.8% tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-box"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard5}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-currency-dollar"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Doanh thu tháng</div>
            <div className={styles.statValue}>
              {stats.monthlyRevenue.toLocaleString('vi-VN')} đ
            </div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+8.5% so với tháng trước</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-currency-dollar"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard6}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-percent"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng hoa hồng</div>
            <div className={styles.statValue}>
              {stats.totalCommissions.toLocaleString('vi-VN')} đ
            </div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+15.2% tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-percent"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard7}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-chat-dots"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Phản hồi chờ xử lý</div>
            <div className={styles.statValue}>{stats.pendingFeedback}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-down"></i>
              <span>-3.1% so với tuần trước</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-chat-dots"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard8}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-people"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Người dùng hoạt động</div>
            <div className={styles.statValue}>{stats.activeUsers}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>+22.1% tháng này</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-people"></i>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Thống kê doanh thu</h3>
            <div className={styles.chartActions}>
              <button 
                className={`${styles.chartBtn} ${selectedChartPeriod === '7days' ? styles.active : ''}`}
                onClick={() => setSelectedChartPeriod('7days')}
              >
                7 ngày
              </button>
              <button 
                className={`${styles.chartBtn} ${selectedChartPeriod === '30days' ? styles.active : ''}`}
                onClick={() => setSelectedChartPeriod('30days')}
              >
                30 ngày
              </button>
              <button 
                className={`${styles.chartBtn} ${selectedChartPeriod === '90days' ? styles.active : ''}`}
                onClick={() => setSelectedChartPeriod('90days')}
              >
                90 ngày
              </button>
            </div>
          </div>
          <div className={styles.chartContent}>
            <div className={styles.chartPlaceholder}>
              <i className="bi bi-bar-chart"></i>
              <p>Biểu đồ doanh thu theo thời gian</p>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Phân bố bác sĩ theo chuyên khoa</h3>
          </div>
          <div className={styles.chartContent}>
            <div className={styles.chartPlaceholder}>
              <i className="bi bi-pie-chart"></i>
              <p>Biểu đồ phân bố chuyên khoa</p>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Hoạt động người dùng</h3>
          </div>
          <div className={styles.chartContent}>
            <div className={styles.chartPlaceholder}>
              <i className="bi bi-graph-up"></i>
              <p>Biểu đồ hoạt động người dùng</p>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Hiệu suất bài viết</h3>
          </div>
          <div className={styles.chartContent}>
            <div className={styles.chartPlaceholder}>
              <i className="bi bi-bar-chart-line"></i>
              <p>Biểu đồ hiệu suất bài viết</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
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
              <div className={styles.activityTitle}>Bác sĩ mới đăng ký</div>
              <div className={styles.activityDesc}>Dr. Nguyễn Văn A đã đăng ký tài khoản</div>
              <div className={styles.activityTime}>2 phút trước</div>
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <i className="bi bi-file-plus"></i>
            </div>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>Bài viết mới</div>
              <div className={styles.activityDesc}>"Chăm sóc sức khỏe mùa đông" đã được xuất bản</div>
              <div className={styles.activityTime}>15 phút trước</div>
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <i className="bi bi-image"></i>
            </div>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>Banner mới</div>
              <div className={styles.activityDesc}>Banner "Khuyến mãi tháng 12" đã được tạo</div>
              <div className={styles.activityTime}>1 giờ trước</div>
            </div>
          </div>
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <i className="bi bi-chat-dots"></i>
            </div>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>Phản hồi mới</div>
              <div className={styles.activityDesc}>Bệnh nhân gửi phản hồi về dịch vụ</div>
              <div className={styles.activityTime}>2 giờ trước</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
