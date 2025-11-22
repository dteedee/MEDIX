import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import dashboardService from '../../services/dashboardService'
import { SpecializationDistributionDto, AppointmentTrendsDto, UserGrowthDto, ManagerDashboardSummaryDto } from '../../types/dashboard.types'
import styles from '../../styles/manager/ReportsAndAnalytics.module.css'

export default function ReportsAndAnalytics() {
  const [summary, setSummary] = useState<ManagerDashboardSummaryDto | null>(null);
  const [specializations, setSpecializations] = useState<SpecializationDistributionDto[]>([]);
  const [appointmentTrends, setAppointmentTrends] = useState<AppointmentTrendsDto | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedReport, setSelectedReport] = useState('overview');
  const { showToast } = useToast();

  useEffect(() => {
    loadSummary();
    loadSpecializations();
    loadAppointmentTrends();  
    loadUserGrowth();
  }, [selectedPeriod, selectedYear]);

  const loadSpecializations = async () => {
    try {
      const data = await dashboardService.getPopularSpecializations();
      console.log('📊 Chuyên khoa phổ biến:', data);
      setSpecializations(data);
    } catch (error) {
      console.error('Error loading specializations:', error);
      showToast('Không thể tải dữ liệu chuyên khoa', 'error');
    }
  };

  const loadAppointmentTrends = async () => {
    try {
      const data = await dashboardService.getAppointmentTrends(undefined, selectedYear);
      console.log('📈 Xu hướng lịch hẹn:', data);
      setAppointmentTrends(data);
    } catch (error) {
      console.error('Error loading appointment trends:', error);
      showToast('Không thể tải dữ liệu xu hướng lịch hẹn', 'error');
    }
  };

  const loadUserGrowth = async () => {
    try {
      const data = await dashboardService.getUserGrowth(selectedYear);
      console.log('👥 Tăng trưởng người dùng:', data);
      setUserGrowth(data);
    } catch (error) {
      console.error('Error loading user growth:', error);
      showToast('Không thể tải dữ liệu tăng trưởng người dùng', 'error');
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getSummary();
      console.log('📊 Resumo do Dashboard:', data);
      setSummary(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading summary:', error);
      showToast('Không thể tải dữ liệu tóm tắt', 'error');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
          <polyline points="17 18 23 18 23 12"></polyline>
        </svg>
      );
    }
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? '#10b981' : '#ef4444';
  };

  const handleExportReport = () => {
    showToast('Đang xuất báo cáo...', 'info');
    // Mock export - replace with actual export functionality
    setTimeout(() => {
      showToast('Xuất báo cáo thành công!', 'success');
    }, 2000);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu báo cáo...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3>Không thể tải dữ liệu báo cáo</h3>
          <p>Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Báo cáo & Thống kê</h1>
          <p className={styles.subtitle}>Phân tích và theo dõi hiệu suất hệ thống</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.periodSelector}>
           
          </div>
          <button className={styles.exportButton} onClick={handleExportReport}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Xuất báo cáo
          </button>
        </div>
      </div>

      

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className={styles.metricsGrid}>
            <div className={`${styles.metricCard} ${styles.metricCard1}`}>
              <div className={styles.metricIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng người dùng</div>
                <div className={styles.metricValue}>{formatNumber(summary.users.total)}</div>
                <div className={styles.metricGrowth} style={{ color: getGrowthColor(summary.users.growth) }}>
                  {getGrowthIcon(summary.users.growth)}
                  <span>{summary.users.growth > 0 ? '+' : ''}{summary.users.growth.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.metricCard2}`}>
              <div className={styles.metricIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng bác sĩ</div>
                <div className={styles.metricValue}>{formatNumber(summary.doctors.total)}</div>
                <div className={styles.metricGrowth} style={{ color: getGrowthColor(summary.doctors.growth) }}>
                  {getGrowthIcon(summary.doctors.growth)}
                  <span>{summary.doctors.growth > 0 ? '+' : ''}{summary.doctors.growth.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.metricCard3}`}>
              <div className={styles.metricIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng lịch hẹn</div>
                <div className={styles.metricValue}>{formatNumber(summary.appointments.total)}</div>
                <div className={styles.metricGrowth} style={{ color: getGrowthColor(summary.appointments.growth) }}>
                  {getGrowthIcon(summary.appointments.growth)}
                  <span>{summary.appointments.growth > 0 ? '+' : ''}{summary.appointments.growth.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.metricCard4}`}>
              <div className={styles.metricIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng doanh thu</div>
                <div className={styles.metricValue}>{formatCurrency(summary.revenue.total)}</div>
                <div className={styles.metricGrowth} style={{ color: getGrowthColor(summary.revenue.growth) }}>
                  {getGrowthIcon(summary.revenue.growth)}
                  <span>{summary.revenue.growth > 0 ? '+' : ''}{summary.revenue.growth.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className={styles.chartsGrid}>
            {/* Top Specialties */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Chuyên khoa phổ biến</h3>
                <p>Phân bố số lượng bác sĩ theo chuyên khoa</p>
              </div>
              <div className={styles.chartContent}>
                {specializations.length > 0 ? (
                  <div className={styles.specialtyList}>
                    {specializations
                      .filter(spec => spec.doctorCount > 0)
                      .sort((a, b) => b.doctorCount - a.doctorCount)
                      .map((specialty, index) => (
                        <div key={specialty.id} className={styles.specialtyItem}>
                          <div className={styles.specialtyInfo}>
                            <span className={styles.specialtyRank}>#{index + 1}</span>
                            <span className={styles.specialtyName}>{specialty.name}</span>
                            <span className={styles.specialtyCount}>{specialty.doctorCount} bác sĩ</span>
                          </div>
                          <div className={styles.specialtyBar}>
                            <div 
                              className={styles.specialtyBarFill}
                              style={{ width: `${specialty.percentage}%` }}
                            ></div>
                          </div>
                          <span className={styles.specialtyPercentage}>{specialty.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <i className="bi bi-inbox"></i>
                    <p>Không có dữ liệu chuyên khoa</p>
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Trends */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3>Xu hướng lịch hẹn</h3>
                  <p>Biểu đồ lịch hẹn và doanh thu theo tháng</p>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className={styles.yearSelect}
                >
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
              <div className={styles.chartContent}>
                {appointmentTrends && appointmentTrends.monthly.length > 0 ? (
                  <>
                    <div className={styles.trendSummary}>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Tổng lịch hẹn:</span>
                        <span className={styles.summaryValue}>{appointmentTrends.totalAppointments}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Tổng doanh thu:</span>
                        <span className={styles.summaryValue}>{formatCurrency(appointmentTrends.totalRevenue)}</span>
                      </div>
                    </div>
                    <div className={styles.trendChart}>
                      {appointmentTrends.monthly.map((trend) => {
                        const monthName = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'][trend.month - 1];
                        const maxAppointments = Math.max(...appointmentTrends.monthly.map(t => t.appointmentCount), 1);
                        
                        return (
                          <div key={trend.month} className={styles.trendItem}>
                            <div className={styles.trendBar}>
                              <div 
                                className={styles.trendBarFill}
                                style={{ 
                                  height: `${(trend.appointmentCount / maxAppointments) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <div className={styles.trendInfo}>
                              <span className={styles.trendMonth}>{monthName}</span>
                              <span className={styles.trendAppointments}>{trend.appointmentCount} lịch hẹn</span>
                              <span className={styles.trendRevenue}>{formatCurrency(trend.totalRevenue)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <i className="bi bi-inbox"></i>
                    <p>Không có dữ liệu xu hướng lịch hẹn</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Growth */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <h3>Tăng trưởng người dùng</h3>
                  <p>Số lượng người dùng và bác sĩ mới theo tháng</p>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className={styles.yearSelect}
                >
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
              <div className={styles.chartContent}>
                {userGrowth && userGrowth.monthly.length > 0 ? (
                  <>
                    <div className={styles.trendSummary}>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Tổng người dùng mới:</span>
                        <span className={styles.summaryValue}>{userGrowth.totalNewUsers}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Tổng bác sĩ mới:</span>
                        <span className={styles.summaryValue}>{userGrowth.totalNewDoctors}</span>
                      </div>
                    </div>
                    <div className={styles.growthChart}>
                      {userGrowth.monthly.map((growth) => {
                        const monthName = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'][growth.month - 1];
                        const maxUsers = Math.max(...userGrowth.monthly.map(g => g.newUsers), 1);
                        const maxDoctors = Math.max(...userGrowth.monthly.map(g => g.newDoctors), 1);
                        
                        return (
                          <div key={growth.month} className={styles.growthItem}>
                            <div className={styles.growthBars}>
                              <div className={styles.growthBar}>
                                <div 
                                  className={styles.growthBarFill}
                                  style={{ 
                                    height: `${(growth.newUsers / maxUsers) * 100}%` 
                                  }}
                                ></div>
                              </div>
                              <div className={styles.growthBar}>
                                <div 
                                  className={styles.growthBarFill2}
                                  style={{ 
                                    height: `${(growth.newDoctors / maxDoctors) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className={styles.growthInfo}>
                              <span className={styles.growthMonth}>{monthName}</span>
                              <span className={styles.growthUsers}>{growth.newUsers} người dùng</span>
                              <span className={styles.growthDoctors}>{growth.newDoctors} bác sĩ</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <i className="bi bi-inbox"></i>
                    <p>Không có dữ liệu tăng trưởng người dùng</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Other report types would be implemented here */}
      {selectedReport !== 'overview' && (
        <div className={styles.comingSoon}>
          <div className={styles.comingSoonIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
          </div>
          <h3>Báo cáo {selectedReport} đang được phát triển</h3>
          <p>Chức năng này sẽ sớm có mặt trong phiên bản tiếp theo</p>
        </div>
      )}
    </div>
  );
}
