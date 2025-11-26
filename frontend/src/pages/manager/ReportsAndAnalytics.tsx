import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import dashboardService from '../../services/dashboardService'
import { managerDashboardService, AppointmentStats } from '../../services/managerDashboardService'
import { SpecializationDistributionDto, AppointmentTrendsDto, UserGrowthDto, ManagerDashboardSummaryDto, TopRatedDoctorDto } from '../../types/dashboard.types'
import styles from '../../styles/manager/ReportsAndAnalytics.module.css'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ReportsAndAnalytics() {
  const [summary, setSummary] = useState<ManagerDashboardSummaryDto | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [specializations, setSpecializations] = useState<SpecializationDistributionDto[]>([]);
  const [appointmentTrends, setAppointmentTrends] = useState<AppointmentTrendsDto | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthDto | null>(null);
  const [topRatedDoctors, setTopRatedDoctors] = useState<TopRatedDoctorDto[]>([]);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedReport, setSelectedReport] = useState('overview');
  const { showToast } = useToast();

  useEffect(() => {
    loadSummary();
    loadAppointmentStats();
    loadSpecializations();
    loadAppointmentTrends();  
    loadUserGrowth();
    loadTopRatedDoctors();
  }, [selectedPeriod, selectedYear]);

  useEffect(() => {
    if (summary) {
      loadPatientCount();
    }
  }, [summary]);

  const loadSpecializations = async () => {
    try {
      const data = await dashboardService.getPopularSpecializations();
   
      setSpecializations(data);
    } catch (error) {
      console.error('Error loading specializations:', error);
      showToast('Không thể tải dữ liệu chuyên khoa', 'error');
    }
  };

  const loadAppointmentTrends = async () => {
    try {
      const data = await dashboardService.getAppointmentTrends(undefined, selectedYear);
     
      setAppointmentTrends(data);
    } catch (error) {
     
      showToast('Không thể tải dữ liệu xu hướng lịch hẹn', 'error');
    }
  };

  const loadUserGrowth = async () => {
    try {
      const data = await dashboardService.getUserGrowth(selectedYear);
      
      setUserGrowth(data);
    } catch (error) {
     
      showToast('Không thể tải dữ liệu tăng trưởng người dùng', 'error');
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getSummary();
      setSummary(data);
      setLoading(false);
    } catch (error) {
      showToast('Không thể tải dữ liệu tóm tắt', 'error');
      setLoading(false);
    }
  };

  const loadAppointmentStats = async () => {
    try {
      const dashboardData = await managerDashboardService.getDashboardData();
      setAppointmentStats(dashboardData.appointmentStats);
    } catch (error) {
      console.error('Error loading appointment stats:', error);
      // Không hiển thị toast để tránh spam, vì đây là dữ liệu bổ sung
    }
  };

  const loadPatientCount = async () => {
    try {
      // Tính số bệnh nhân = tổng users - tổng bác sĩ (vì users bao gồm cả bác sĩ, admin, manager, patient)
      // Nếu có API riêng, sẽ thay thế logic này
      if (summary) {
        // Giả sử users.total bao gồm tất cả, trừ đi doctors để lấy số bệnh nhân
        // (có thể còn admin/manager nhưng số lượng nhỏ)
        const calculatedPatientCount = Math.max(0, summary.users.total - summary.doctors.total);
        setPatientCount(calculatedPatientCount);
      }
    } catch (error) {
      console.error('Error calculating patient count:', error);
    }
  };

  const loadTopRatedDoctors = async () => {
    try {
      const data = await dashboardService.getTopRatedDoctors(3);
      setTopRatedDoctors(data);
    } catch (error) {
      console.error('Error loading top rated doctors:', error);
      showToast('Không thể tải dữ liệu bác sĩ được đánh giá cao', 'error');
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
    try {
      showToast('Đang xuất báo cáo...', 'info');
      
      const currentDate = new Date().toISOString().split('T')[0];
      const dateTime = new Date().toLocaleString('vi-VN');
      
      // Tạo nội dung CSV với nhiều sections
      let csvContent = '\uFEFF'; // BOM để hỗ trợ UTF-8
      
      // Header báo cáo
      csvContent += `BÁO CÁO & THỐNG KÊ - MEDIX\n`;
      csvContent += `Ngày xuất: ${dateTime}\n`;
      csvContent += `Năm: ${selectedYear}\n`;
      csvContent += `\n`;
      
      // Section 1: Tổng quan Metrics
      csvContent += `=== TỔNG QUAN METRICS ===\n`;
      csvContent += `Chỉ số,Giá trị,Tăng trưởng (%)\n`;
      
      if (summary) {
        const patientCountValue = patientCount !== null 
          ? patientCount
          : Math.max(0, summary.users.total - summary.doctors.total);
        
        csvContent += `"Tổng bệnh nhân","${formatNumber(patientCountValue)}","${summary.users.growth > 0 ? '+' : ''}${summary.users.growth.toFixed(1)}%"\n`;
        csvContent += `"Tổng bác sĩ","${formatNumber(summary.doctors.total)}","${summary.doctors.growth > 0 ? '+' : ''}${summary.doctors.growth.toFixed(1)}%"\n`;
        csvContent += `"Tổng lịch hẹn","${formatNumber(summary.appointments.total)}","${summary.appointments.growth > 0 ? '+' : ''}${summary.appointments.growth.toFixed(1)}%"\n`;
        csvContent += `"Tổng doanh thu","${formatCurrency(summary.revenue.total)} (${summary.revenue.total.toLocaleString('vi-VN')} VND)","${summary.revenue.growth > 0 ? '+' : ''}${summary.revenue.growth.toFixed(1)}%"\n`;
      }
      
      csvContent += `\n`;
      
      // Section 2: Metrics bổ sung
      csvContent += `=== METRICS BỔ SUNG ===\n`;
      csvContent += `Chỉ số,Giá trị,Chi tiết\n`;
      
      // Tỷ lệ hoàn thành
      const completionRate = appointmentStats && appointmentStats.totalAppointments > 0 && appointmentStats.completed !== undefined
        ? (((appointmentStats.completed || 0) / appointmentStats.totalAppointments) * 100).toFixed(1)
        : '0.0';
      const completionDetail = appointmentStats && appointmentStats.completed !== undefined && appointmentStats.totalAppointments !== undefined
        ? `${(appointmentStats.completed || 0).toLocaleString('vi-VN')} / ${(appointmentStats.totalAppointments || 0).toLocaleString('vi-VN')} lịch hẹn`
        : 'Lịch hẹn đã hoàn thành';
      csvContent += `"Tỷ lệ hoàn thành","${completionRate}%","${completionDetail}"\n`;
      
      // Tỷ lệ hủy
      const cancellationRate = appointmentStats && appointmentStats.totalAppointments > 0 && appointmentStats.cancelledByPatient !== undefined && appointmentStats.cancelledByDoctor !== undefined
        ? ((((appointmentStats.cancelledByPatient || 0) + (appointmentStats.cancelledByDoctor || 0)) / appointmentStats.totalAppointments) * 100).toFixed(1)
        : '0.0';
      const cancellationDetail = appointmentStats && appointmentStats.cancelledByPatient !== undefined && appointmentStats.cancelledByDoctor !== undefined
        ? `${((appointmentStats.cancelledByPatient || 0) + (appointmentStats.cancelledByDoctor || 0)).toLocaleString('vi-VN')} lịch hẹn bị hủy`
        : 'Lịch hẹn bị hủy';
      csvContent += `"Tỷ lệ hủy","${cancellationRate}%","${cancellationDetail}"\n`;
      
      // Đánh giá trung bình
      const avgRating = topRatedDoctors.length > 0
        ? (topRatedDoctors.reduce((sum, d) => sum + d.averageRating, 0) / topRatedDoctors.length).toFixed(1)
        : '0.0';
      const totalReviews = topRatedDoctors.reduce((sum, d) => sum + d.reviewCount, 0);
      csvContent += `"Đánh giá trung bình","${avgRating}","${totalReviews} đánh giá"\n`;
      
      // Tỷ lệ đặt lại lịch
      const rescheduleRate = appointmentStats && appointmentStats.totalAppointments > 0 && appointmentStats.BeforeAppoiment !== undefined
        ? (((appointmentStats.BeforeAppoiment || 0) / appointmentStats.totalAppointments) * 100).toFixed(1)
        : '0.0';
      const rescheduleDetail = appointmentStats && appointmentStats.BeforeAppoiment !== undefined
        ? `${(appointmentStats.BeforeAppoiment || 0).toLocaleString('vi-VN')} lịch hẹn được đặt lại`
        : 'Lịch hẹn được đặt lại';
      csvContent += `"Tỷ lệ đặt lại lịch","${rescheduleRate}%","${rescheduleDetail}"\n`;
      
      csvContent += `\n`;
      
      // Section 3: Top Rated Doctors
      csvContent += `=== TOP ${topRatedDoctors.length} BÁC SĨ ĐƯỢC ĐÁNH GIÁ CAO NHẤT ===\n`;
      csvContent += `Hạng,Tên bác sĩ,Chuyên khoa,Kinh nghiệm (năm),Đánh giá trung bình,Số đánh giá,Ca đã thực hiện,Ca thành công\n`;
      
      topRatedDoctors.forEach((doctor, index) => {
        const completedAppts = doctor.completedAppointments !== undefined 
          ? doctor.completedAppointments
          : doctor.totalAppointments !== undefined
          ? doctor.totalAppointments
          : 0;
        const successfulAppts = doctor.successfulAppointments !== undefined 
          ? doctor.successfulAppointments
          : doctor.successRate !== undefined && doctor.completedAppointments !== undefined
          ? Math.round((doctor.successRate / 100) * doctor.completedAppointments)
          : 0;
        
        csvContent += `"${index + 1}","${doctor.doctorName || ''}","${doctor.specialization || ''}","${doctor.experienceYears || 0}","${doctor.formattedRating || '0.0'}","${doctor.reviewCount || 0}","${completedAppts}","${successfulAppts}"\n`;
      });
      
      csvContent += `\n`;
      
      // Section 4: Chuyên khoa phổ biến
      csvContent += `=== CHUYÊN KHOA PHỔ BIẾN ===\n`;
      csvContent += `Hạng,Tên chuyên khoa,Số lượng bác sĩ,Tỷ lệ (%)\n`;
      
      specializations
        .filter(spec => spec.doctorCount > 0)
        .sort((a, b) => b.doctorCount - a.doctorCount)
        .forEach((specialty, index) => {
          csvContent += `"${index + 1}","${specialty.name}","${specialty.doctorCount}","${specialty.percentage.toFixed(1)}"\n`;
        });
      
      csvContent += `\n`;
      
      // Section 5: Xu hướng lịch hẹn theo tháng
      if (appointmentTrends && appointmentTrends.monthly.length > 0) {
        csvContent += `=== XU HƯỚNG LỊCH HẸN THEO THÁNG (NĂM ${selectedYear}) ===\n`;
        csvContent += `Tháng,Số lịch hẹn,Doanh thu (VND)\n`;
        
        appointmentTrends.monthly.forEach(trend => {
          const monthName = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'][trend.month - 1];
          csvContent += `"${monthName}","${trend.appointmentCount}","${trend.totalRevenue.toLocaleString('vi-VN')} VND"\n`;
        });
        
        csvContent += `"Tổng cộng","${appointmentTrends.totalAppointments}","${appointmentTrends.totalRevenue.toLocaleString('vi-VN')} VND"\n`;
        csvContent += `\n`;
      }
      
      // Section 6: Tăng trưởng người dùng theo tháng
      if (userGrowth && userGrowth.monthly.length > 0) {
        csvContent += `=== TĂNG TRƯỞNG NGƯỜI DÙNG THEO THÁNG (NĂM ${selectedYear}) ===\n`;
        csvContent += `Tháng,Người dùng mới,Bác sĩ mới\n`;
        
        userGrowth.monthly.forEach(growth => {
          const monthName = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'][growth.month - 1];
          csvContent += `"${monthName}","${growth.newUsers}","${growth.newDoctors}"\n`;
        });
        
        csvContent += `"Tổng cộng","${userGrowth.totalNewUsers}","${userGrowth.totalNewDoctors}"\n`;
      }
      
      // Tạo file và download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bao-cao-thong-ke-${currentDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('Đã xuất báo cáo CSV thành công!', 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showToast('Không thể xuất báo cáo. Vui lòng thử lại.', 'error');
    }
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
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <i className="bi bi-graph-up-arrow" style={{ fontSize: '28px' }}></i>
            </div>
            <div>
              <h1 className={styles.title}>Báo cáo & Thống kê</h1>
              <p className={styles.subtitle}>Phân tích và theo dõi hiệu suất hệ thống</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className={styles.dateGlow}></div>
            </div>
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
            {/* Hàng trên: Tổng bệnh nhân, Tổng bác sĩ */}
            <div className={`${styles.metricCard} ${styles.metricCard1}`}>
              <div className={styles.metricIcon}>
                <i className="bi bi-people" style={{ fontSize: '28px' }}></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng bệnh nhân</div>
                <div className={styles.metricValue}>
                  {patientCount !== null 
                    ? formatNumber(patientCount)
                    : summary 
                    ? formatNumber(Math.max(0, summary.users.total - summary.doctors.total))
                    : '0'}
                </div>
                <div className={`${styles.metricGrowth} ${summary.users.growth < 0 ? styles.negative : ''}`}>
                  <i className={`bi bi-arrow-${summary.users.growth >= 0 ? 'up' : 'down'}`}></i>
                  <span>{summary.users.growth > 0 ? '+' : ''}{summary.users.growth.toFixed(1)}% so với tháng trước</span>
                </div>
              </div>
              <div className={styles.metricBg}>
                <i className="bi bi-people"></i>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.metricCard2}`}>
              <div className={styles.metricIcon}>
                <i className="bi bi-person-badge" style={{ fontSize: '28px' }}></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng bác sĩ</div>
                <div className={styles.metricValue}>{formatNumber(summary.doctors.total)}</div>
                <div className={`${styles.metricGrowth} ${summary.doctors.growth < 0 ? styles.negative : ''}`}>
                  <i className={`bi bi-arrow-${summary.doctors.growth >= 0 ? 'up' : 'down'}`}></i>
                  <span>{summary.doctors.growth > 0 ? '+' : ''}{summary.doctors.growth.toFixed(1)}% so với tháng trước</span>
                </div>
              </div>
              <div className={styles.metricBg}>
                <i className="bi bi-person-badge"></i>
              </div>
            </div>

            {/* Hàng dưới: Tổng lịch hẹn, Tổng doanh thu */}
            <div className={`${styles.metricCard} ${styles.metricCard3}`}>
              <div className={styles.metricIcon}>
                <i className="bi bi-calendar-check" style={{ fontSize: '28px' }}></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng lịch hẹn</div>
                <div className={styles.metricValue}>{formatNumber(summary.appointments.total)}</div>
                <div className={`${styles.metricGrowth} ${summary.appointments.growth < 0 ? styles.negative : ''}`}>
                  <i className={`bi bi-arrow-${summary.appointments.growth >= 0 ? 'up' : 'down'}`}></i>
                  <span>{summary.appointments.growth > 0 ? '+' : ''}{summary.appointments.growth.toFixed(1)}% so với tháng trước</span>
                </div>
              </div>
              <div className={styles.metricBg}>
                <i className="bi bi-calendar-check"></i>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.metricCard4}`}>
              <div className={styles.metricIcon}>
                <i className="bi bi-currency-dollar" style={{ fontSize: '28px' }}></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>Tổng doanh thu</div>
                <div className={styles.metricValue}>{formatCurrency(summary.revenue.total)}</div>
                <div className={`${styles.metricGrowth} ${summary.revenue.growth < 0 ? styles.negative : ''}`}>
                  <i className={`bi bi-arrow-${summary.revenue.growth >= 0 ? 'up' : 'down'}`}></i>
                  <span>{summary.revenue.growth > 0 ? '+' : ''}{summary.revenue.growth.toFixed(1)}% so với tháng trước</span>
                </div>
              </div>
              <div className={styles.metricBg}>
                <i className="bi bi-currency-dollar"></i>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className={styles.additionalMetricsGrid}>
            <div className={`${styles.additionalMetricCard} ${styles.additionalMetricCard1}`}>
              <div className={styles.additionalMetricIcon}>
                <i className="bi bi-check-circle" style={{ fontSize: '24px' }}></i>
              </div>
              <div className={styles.additionalMetricContent}>
                <div className={styles.additionalMetricLabel}>Tỷ lệ hoàn thành</div>
                <div className={styles.additionalMetricValue}>
                  {appointmentStats && appointmentStats.totalAppointments > 0 && appointmentStats.completed !== undefined
                    ? (((appointmentStats.completed || 0) / appointmentStats.totalAppointments) * 100).toFixed(1)
                    : summary && summary.appointments.total > 0
                    ? '0.0'
                    : '0'}%
                </div>
                <div className={styles.additionalMetricSubtext}>
                  {appointmentStats && appointmentStats.completed !== undefined && appointmentStats.totalAppointments !== undefined
                    ? `${(appointmentStats.completed || 0).toLocaleString('vi-VN')} / ${(appointmentStats.totalAppointments || 0).toLocaleString('vi-VN')} lịch hẹn`
                    : 'Lịch hẹn đã hoàn thành'}
                </div>
              </div>
            </div>

            <div className={`${styles.additionalMetricCard} ${styles.additionalMetricCard2}`}>
              <div className={styles.additionalMetricIcon}>
                <i className="bi bi-x-circle" style={{ fontSize: '24px' }}></i>
              </div>
              <div className={styles.additionalMetricContent}>
                <div className={styles.additionalMetricLabel}>Tỷ lệ hủy</div>
                <div className={styles.additionalMetricValue}>
                  {appointmentStats && appointmentStats.totalAppointments > 0 && appointmentStats.cancelledByPatient !== undefined && appointmentStats.cancelledByDoctor !== undefined
                    ? ((((appointmentStats.cancelledByPatient || 0) + (appointmentStats.cancelledByDoctor || 0)) / appointmentStats.totalAppointments) * 100).toFixed(1)
                    : summary && summary.appointments.total > 0
                    ? '0.0'
                    : '0'}%
                </div>
                <div className={styles.additionalMetricSubtext}>
                  {appointmentStats && appointmentStats.cancelledByPatient !== undefined && appointmentStats.cancelledByDoctor !== undefined
                    ? `${((appointmentStats.cancelledByPatient || 0) + (appointmentStats.cancelledByDoctor || 0)).toLocaleString('vi-VN')} lịch hẹn bị hủy`
                    : 'Lịch hẹn bị hủy'}
                </div>
              </div>
            </div>

            <div className={`${styles.additionalMetricCard} ${styles.additionalMetricCard3}`}>
              <div className={styles.additionalMetricIcon}>
                <i className="bi bi-star" style={{ fontSize: '24px' }}></i>
              </div>
              <div className={styles.additionalMetricContent}>
                <div className={styles.additionalMetricLabel}>Đánh giá trung bình</div>
                <div className={styles.additionalMetricValue}>
                  {topRatedDoctors.length > 0
                    ? (topRatedDoctors.reduce((sum, d) => sum + d.averageRating, 0) / topRatedDoctors.length).toFixed(1)
                    : '0.0'}
                </div>
                <div className={styles.additionalMetricSubtext}>
                  {topRatedDoctors.reduce((sum, d) => sum + d.reviewCount, 0)} đánh giá
                </div>
              </div>
            </div>

            <div className={`${styles.additionalMetricCard} ${styles.additionalMetricCard4}`}>
              <div className={styles.additionalMetricIcon}>
                <i className="bi bi-arrow-repeat" style={{ fontSize: '24px' }}></i>
              </div>
              <div className={styles.additionalMetricContent}>
                <div className={styles.additionalMetricLabel}>Tỷ lệ đặt lại lịch</div>
                <div className={styles.additionalMetricValue}>
                  {appointmentStats && appointmentStats.totalAppointments > 0 && appointmentStats.BeforeAppoiment !== undefined
                    ? (((appointmentStats.BeforeAppoiment || 0) / appointmentStats.totalAppointments) * 100).toFixed(1)
                    : summary && summary.appointments.total > 0
                    ? '0.0'
                    : '0'}%
                </div>
                <div className={styles.additionalMetricSubtext}>
                  {appointmentStats && appointmentStats.BeforeAppoiment !== undefined
                    ? `${(appointmentStats.BeforeAppoiment || 0).toLocaleString('vi-VN')} lịch hẹn được đặt lại`
                    : 'Lịch hẹn được đặt lại'}
                </div>
              </div>
            </div>
          </div>

          {/* Top Rated Doctors */}
          <div className={styles.topRatedSection}>
            <div className={styles.sectionHeader}>
              <h2>Top 3 Bác sĩ được đánh giá cao nhất</h2>
              <p>Những bác sĩ có điểm đánh giá trung bình cao nhất</p>
            </div>
            <div className={styles.topRatedGrid}>
              {topRatedDoctors.length > 0 ? (
                topRatedDoctors.map((doctor, index) => (
                  <div key={doctor.doctorId} className={`${styles.topRatedCard} ${styles[`rank${index + 1}`]}`}>
                    <div className={styles.laurelBadge}>
                      {/* Laurel Wreath */}
                      <svg className={styles.laurelWreath} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        {/* Left Laurel */}
                        <path d="M25,70 Q20,60 20,50 Q20,40 25,30 Q20,35 15,40 Q10,45 10,50 Q10,55 15,60 Q20,65 25,70" fill="currentColor"/>
                        <path d="M30,65 Q28,58 28,50 Q28,42 30,35 Q26,40 22,45 Q18,50 22,55 Q26,60 30,65" fill="currentColor"/>
                        <path d="M35,60 Q34,56 34,50 Q34,44 35,40 Q32,44 29,48 Q26,52 29,56 Q32,60 35,60" fill="currentColor"/>
                        
                        {/* Right Laurel */}
                        <path d="M75,70 Q80,60 80,50 Q80,40 75,30 Q80,35 85,40 Q90,45 90,50 Q90,55 85,60 Q80,65 75,70" fill="currentColor"/>
                        <path d="M70,65 Q72,58 72,50 Q72,42 70,35 Q74,40 78,45 Q82,50 78,55 Q74,60 70,65" fill="currentColor"/>
                        <path d="M65,60 Q66,56 66,50 Q66,44 65,40 Q68,44 71,48 Q74,52 71,56 Q68,60 65,60" fill="currentColor"/>
                      </svg>
                      
                      {/* Crown */}
                      <svg className={styles.crown} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                        <path d="M12 2l2 6 6-2-4 6h8l-12 8-12-8h8l-4-6 6 2z"/>
                        <rect x="3" y="18" width="18" height="3" rx="1"/>
                      </svg>
                      
                      {/* Rank Text */}
                      <div className={styles.rankText}>
                        <div className={styles.bestLabel}>BEST</div>
                        <div className={styles.rankNumber}>{index + 1}</div>
                      </div>
                    </div>
                    
                    <div className={styles.doctorAvatar}>
                      {doctor.imageUrl ? (
                        <img src={doctor.imageUrl} alt={doctor.doctorName} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.doctorInfo}>
                      <h3 className={styles.doctorName}>
                        {doctor.degree && <span className={styles.doctorDegree}>{doctor.degree}</span>}
                        {doctor.doctorName}
                      </h3>
                      <p className={styles.doctorSpecialty}>{doctor.specialization}</p>
                      {doctor.experienceYears && (
                        <p className={styles.doctorExperience}>
                          <i className="bi bi-briefcase"></i> {doctor.experienceYears} năm kinh nghiệm
                        </p>
                      )}
                    </div>
                    
                    <div className={styles.ratingInfo}>
                      <div className={styles.ratingStars}>
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={i < Math.floor(doctor.averageRating) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                      <div className={styles.ratingValue}>
                        <span className={styles.ratingScore}>{doctor.formattedRating}</span>
                        <span className={styles.ratingCount}>({doctor.reviewCount} đánh giá)</span>
                      </div>
                    </div>

                    {/* Thông tin số ca đã thực hiện và thành công - Compact design */}
                    <div className={styles.doctorStatsCompact}>
                      <div className={styles.statCompactItem}>
                        <div className={styles.statCompactIcon}>
                          <i className="bi bi-clipboard-check"></i>
                        </div>
                        <div className={styles.statCompactValue}>
                          {doctor.completedAppointments !== undefined 
                            ? doctor.completedAppointments.toLocaleString('vi-VN')
                            : doctor.totalAppointments !== undefined
                            ? doctor.totalAppointments.toLocaleString('vi-VN')
                            : '0'}
                        </div>
                        <div className={styles.statCompactLabel}>Ca đã thực hiện</div>
                      </div>
                      <div className={styles.statCompactItem}>
                        <div className={styles.statCompactIcon}>
                          <i className="bi bi-check-circle"></i>
                        </div>
                        <div className={styles.statCompactValue}>
                          {doctor.successfulAppointments !== undefined 
                            ? doctor.successfulAppointments.toLocaleString('vi-VN')
                            : doctor.successRate !== undefined && doctor.completedAppointments !== undefined
                            ? Math.round((doctor.successRate / 100) * doctor.completedAppointments).toLocaleString('vi-VN')
                            : '0'}
                        </div>
                        <div className={styles.statCompactLabel}>Ca thành công</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <i className="bi bi-inbox"></i>
                  <p>Chưa có dữ liệu đánh giá bác sĩ</p>
                </div>
              )}
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
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={appointmentTrends.monthly.map(trend => ({
                          month: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'][trend.month - 1],
                          'Lịch hẹn': trend.appointmentCount,
                          'Doanh thu': trend.totalRevenue,
                          revenueRaw: trend.totalRevenue
                        }))}
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 13, fill: '#6b7280' }}
                          stroke="#9ca3af"
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 12, fill: '#667eea' }}
                          stroke="#667eea"
                          width={50}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11, fill: '#f59e0b' }}
                          stroke="#f59e0b"
                          width={90}
                          tickFormatter={(value) => {
                            if (value >= 1000000000) {
                              return `${(value / 1000000000).toFixed(1)}B`;
                            } else if (value >= 1000000) {
                              return `${(value / 1000000).toFixed(1)}M`;
                            } else if (value >= 1000) {
                              return `${(value / 1000).toFixed(0)}K`;
                            }
                            return value.toString();
                          }}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === 'Doanh thu') {
                              return [formatCurrency(value), 'Doanh thu'];
                            }
                            return [value.toLocaleString('vi-VN'), name];
                          }}
                          labelFormatter={(label) => `Tháng ${label}`}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            padding: '12px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="Lịch hẹn"
                          fill="#667eea"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={60}
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="Doanh thu"
                          fill="#f59e0b"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart 
                        data={userGrowth.monthly.map(growth => ({
                          month: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'][growth.month - 1],
                          'Người dùng mới': growth.newUsers,  
                          'Bác sĩ mới': growth.newDoctors
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Người dùng mới" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Bác sĩ mới" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
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
