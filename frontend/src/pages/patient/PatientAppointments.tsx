import React, { useState, useEffect, useMemo } from 'react';
import styles from '../../styles/patient/PatientAppointments.module.css';
import { appointmentService } from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import { reviewService } from '../../services/reviewService';
import { DoctorProfileDto } from '../../types/doctor.types';
import { apiClient } from '../../lib/apiClient';

interface Appointment {
  id: string;
  doctorName: string;
  doctorTitle?: string;
  specialty?: string;
  date: string;
  time: string;
  room?: string;
  fee: number;
  avatar?: string;
  rating?: number;
  review?: string;
  emrId?: string;
  doctorID?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  statusCode: string;
  statusDisplayName?: string;
  paymentStatusCode?: string;
  totalAmount?: number;
  medicalInfo?: string;
  patientReview?: string;
  patientRating?: string;
}

interface FilterOptions {
  status: string;
  timeRange: string;
  search: string;
}

export const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showEMRModal, setShowEMRModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ message: string; refundAmount?: number } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    timeRange: 'all',
    search: ''
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctorProfiles, setDoctorProfiles] = useState<Map<string, DoctorProfileDto>>(new Map());
  const [loadingDoctors, setLoadingDoctors] = useState<Set<string>>(new Set());
  const [refundPercentage, setRefundPercentage] = useState(80);

  const statusDisplayNameMap: Record<string, string> = {
    'BeforeAppoiment': 'Trước giờ khám',
    'CancelledByDoctor': 'Bác sĩ hủy',
    'CancelledByPatient': 'Bệnh nhân hủy',
    'Completed': 'Hoàn thành',
    'Confirmed': 'Đã xác nhận',
    'MissedByDoctor': 'Bác sĩ vắng mặt',
    'MissedByPatient': 'Bệnh nhân vắng mặt',
    'NoShow': 'Không đến',
    'OnProgressing': 'Đang khám',
    'PendingConfirmation': 'Chờ xác nhận',
  };

  const calculateRefundAmount = (appointment: Appointment | null) => {
    if (!appointment) return 0;
    const total = appointment.totalAmount ?? appointment.fee ?? 0;
    return Math.round(total * (refundPercentage / 100));
  };
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isViewingExistingReview, setIsViewingExistingReview] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentService.getPatientAppointments();
      
      const transformedData: Appointment[] = data.map(apt => {
        const startDate = new Date(apt.appointmentStartTime);
        
        const year = startDate.getFullYear();
        const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
        const day = startDate.getDate().toString().padStart(2, '0');
        const datePart = `${year}-${month}-${day}`;
        
        return {
          id: apt.id,
          doctorName: apt.doctorName,
          doctorTitle: '',
          specialty: '',
          date: datePart, // Sử dụng ngày đã được tính toán đúng
          time: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
          room: '',
          fee: apt.consultationFee,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName)}&background=667eea&color=fff`,
          doctorID: apt.doctorID,
          appointmentStartTime: apt.appointmentStartTime,
          appointmentEndTime: apt.appointmentEndTime,
          statusCode: apt.statusCode,
          statusDisplayName: apt.statusDisplayName,
          paymentStatusCode: apt.paymentStatusCode,
          totalAmount: apt.totalAmount,
          medicalInfo: apt.medicalInfo,
          patientReview: apt.patientReview,
          patientRating: apt.patientRating,
        };
      });
      
      setAppointments(transformedData);
      setFilteredAppointments(transformedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    const fetchRefundSetting = async () => {
      try {
        const response = await apiClient.get('/SystemConfiguration/APPOINTMENT_PATIENT_CANCEL_REFUND_PERCENT');
        const rawValue = parseFloat(response.data?.configValue ?? '0.8');
        if (Number.isFinite(rawValue)) {
          const normalized = rawValue <= 1 ? rawValue * 100 : rawValue;
          setRefundPercentage(Math.min(100, Math.max(0, Math.round(normalized))));
        }
      } catch (error) {
      }
    };

    fetchRefundSetting();
  }, []);

  useEffect(() => {
    const loadDoctorProfiles = async () => {
      const uniqueDoctorIds = Array.from(
        new Set(appointments.filter(apt => apt.doctorID).map(apt => apt.doctorID!))
      );

      for (const doctorID of uniqueDoctorIds) {
        if (doctorProfiles.has(doctorID) || loadingDoctors.has(doctorID)) {
          continue;
        }

        try {
          setLoadingDoctors(prev => new Set(prev).add(doctorID));
          const profile = await doctorService.getDoctorProfile(doctorID);
          setDoctorProfiles(prev => {
            const newMap = new Map(prev);
            newMap.set(doctorID, profile);
            return newMap;
          });
        } catch (err) {
        } finally {
          setLoadingDoctors(prev => {
            const newSet = new Set(prev);
            newSet.delete(doctorID);
            return newSet;
          });
        }
      }
    };

    if (appointments.length > 0) {
      loadDoctorProfiles();
    }
  }, [appointments]);

  const appointmentsWithDoctorInfo = useMemo(() => {
    return appointments.map(apt => {
      if (!apt.doctorID) return apt;
      
      const profile = doctorProfiles.get(apt.doctorID);
      if (!profile) return apt;

      return {
        ...apt,
        avatar: profile.avatarUrl || apt.avatar,
        specialty: profile.specialization || apt.specialty,
        doctorTitle: profile.education || apt.doctorTitle,
      };
    });
  }, [appointments, doctorProfiles]);

  const stats = {
    total: appointmentsWithDoctorInfo.length,
    upcoming: appointmentsWithDoctorInfo.filter(apt => 
      apt.statusCode !== 'Completed' && 
      apt.statusCode !== 'CancelledByPatient' && 
      apt.statusCode !== 'CancelledByDoctor' && 
      apt.statusCode !== 'MissedByDoctor' && 
      apt.statusCode !== 'NoShow'
    ).length,
    completed: appointmentsWithDoctorInfo.filter(apt => apt.statusCode === 'Completed').length,
    cancelled: appointmentsWithDoctorInfo.filter(apt => 
      apt.statusCode === 'CancelledByPatient' || 
      apt.statusCode === 'CancelledByDoctor' || 
      apt.statusCode === 'MissedByDoctor' || 
      apt.statusCode === 'NoShow'
    ).length
  };

  useEffect(() => {
    let filtered = [...appointmentsWithDoctorInfo];

    if (filters.status !== 'all') {
      if (filters.status === 'upcoming') {
        filtered = filtered.filter(apt => 
          apt.statusCode !== 'Completed' && 
          apt.statusCode !== 'CancelledByPatient' && 
          apt.statusCode !== 'CancelledByDoctor' && 
          apt.statusCode !== 'MissedByDoctor' && 
          apt.statusCode !== 'NoShow'
        );
      } else if (filters.status === 'completed') {
        filtered = filtered.filter(apt => apt.statusCode === 'Completed');
      } else if (filters.status === 'cancelled') {
        filtered = filtered.filter(apt => 
          apt.statusCode === 'CancelledByPatient' || 
          apt.statusCode === 'CancelledByDoctor' || 
          apt.statusCode === 'MissedByDoctor' || 
          apt.statusCode === 'NoShow'
        );
      }
    }

    if (filters.search) {
      filtered = filtered.filter(apt => 
        apt.doctorName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (apt.specialty && apt.specialty.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    if (dateFrom || dateTo) {
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        if (dateFrom && dateTo) {
          const fromDate = new Date(dateFrom);
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // Include entire end date
          return aptDate >= fromDate && aptDate <= toDate;
        } else if (dateFrom) {
          const fromDate = new Date(dateFrom);
          return aptDate >= fromDate;
        } else if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          return aptDate <= toDate;
        }
        return true;
      });
    } else if (filters.timeRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        if (filters.timeRange === 'today') {
          return aptDate.toDateString() === now.toDateString();
        } else if (filters.timeRange === 'week') {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return aptDate >= now && aptDate <= weekFromNow;
        } else if (filters.timeRange === 'month') {
          return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredAppointments(filtered);
  }, [filters, appointmentsWithDoctorInfo, dateFrom, dateTo]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setIsCancelling(true);
      const result = await appointmentService.cancelPatientAppointment(selectedAppointment.id);

      setAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, statusCode: 'CancelledByPatient' }
            : apt
        )
      );

      setShowCancelDialog(false);
      setSelectedAppointment(null);
      setCancelResult({
        message: result.message || 'Hủy lịch hẹn thành công!',
        refundAmount: result.refundAmount
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedAppointment || rating === 0) return;

    try {
      setIsSubmittingReview(true);
      
      const reviewDto = {
        appointmentId: selectedAppointment.id,
        rating: rating,
        comment: reviewComment.trim() || undefined
      };

      await reviewService.createReview(reviewDto);

      setShowRatingModal(false);
      setRating(0);
      setHoverRating(0);
      setReviewComment('');

      alert('Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được gửi thành công.');
      
      await loadAppointments();
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.title ||
                          'Không thể gửi đánh giá. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const startFormatted = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    if (endTime) {
      const end = new Date(endTime);
      const endFormatted = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${startFormatted} - ${endFormatted}`;
    }
    
    return startFormatted;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusConfig = (statusCode: string) => {
    const config: Record<string, { label: string; icon: string; color: string }> = {
      'OnProgressing': { 
        label: statusDisplayNameMap[statusCode] || 'Đang khám', 
        icon: 'bi-arrow-repeat',
        color: '#f59e0b'
      },
      'BeforeAppoiment': { 
        label: statusDisplayNameMap[statusCode] || 'Trước giờ khám', 
        icon: 'bi-calendar-check',
        color: '#3b82f6'
      },
      'Completed': { 
        label: statusDisplayNameMap[statusCode] || 'Hoàn thành', 
        icon: 'bi-check-circle-fill',
        color: '#10b981'
      },
      'CancelledByPatient': { 
        label: statusDisplayNameMap[statusCode] || 'Bệnh nhân hủy', 
        icon: 'bi-x-circle',
        color: '#ef4444'
      },
      'CancelledByDoctor': { 
        label: statusDisplayNameMap[statusCode] || 'Bác sĩ hủy', 
        icon: 'bi-x-circle',
        color: '#ef4444'
      },
      'MissedByPatient': { 
        label: statusDisplayNameMap[statusCode] || 'Bệnh nhân vắng mặt', 
        icon: 'bi-exclamation-circle',
        color: '#f59e0b'
      },
      'MissedByDoctor': { 
        label: statusDisplayNameMap[statusCode] || 'Bác sĩ vắng mặt', 
        icon: 'bi-exclamation-circle',
        color: '#f59e0b'
      },
      'NoShow': { 
        label: statusDisplayNameMap[statusCode] || 'Không đến', 
        icon: 'bi-question-circle',
        color: '#6b7280'
      },
      'PendingConfirmation': { 
        label: statusDisplayNameMap[statusCode] || 'Chờ xác nhận', 
        icon: 'bi-clock-history',
        color: '#8b5cf6'
      },
      'Confirmed': { 
        label: statusDisplayNameMap[statusCode] || 'Đã xác nhận', 
        icon: 'bi-check2-circle',
        color: '#10b981'
      }
    };

    return config[statusCode] || { 
      label: statusCode, 
      icon: 'bi-info-circle',
      color: '#6b7280'
    };
  };

  const getPaymentStatusLabel = (statusCode?: string): string => {
    if (!statusCode) return 'Chưa thanh toán';

    const statusMap: { [key: string]: string } = {
      'Paid': 'Đã thanh toán',
      'Unpaid': 'Chưa thanh toán',
      'Pending': 'Đang chờ thanh toán',
      'Failed': 'Thanh toán thất bại',
      'Refunded': 'Đã hoàn tiền',
      'Cancelled': 'Đã hủy'
    };
    
    return statusMap[statusCode] || statusCode;
  };

  const getPaymentStatusIcon = (statusCode?: string): string => {
    if (!statusCode) return 'bi-x-circle';
    
    const iconMap: { [key: string]: string } = {
      'Paid': 'bi-check-circle-fill',
      'Unpaid': 'bi-x-circle',
      'Pending': 'bi-clock-history',
      'Failed': 'bi-exclamation-triangle-fill',
      'Refunded': 'bi-arrow-counterclockwise',
      'Cancelled': 'bi-x-circle-fill'
    };
    
    return iconMap[statusCode] || 'bi-info-circle';
  };

  if (loading) {
  return (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <p>Đang tải lịch hẹn của bạn...</p>
        </div>
          </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          <h3>Có lỗi xảy ra</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>
            <i className="bi bi-arrow-clockwise"></i>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>
                <i className="bi bi-calendar-check"></i>
              Lịch hẹn của tôi
            </h1>
            <p className={styles.pageSubtitle}>
              Quản lý và theo dõi các cuộc hẹn khám bệnh
            </p>
              </div>
          <div className={styles.headerActions}>
            <div className={styles.viewToggle}>
              <button 
                className={`${styles.viewBtn} ${activeView === 'grid' ? styles.active : ''}`}
                onClick={() => setActiveView('grid')}
              >
                <i className="bi bi-grid-3x3-gap-fill"></i>
              </button>
              <button 
                className={`${styles.viewBtn} ${activeView === 'list' ? styles.active : ''}`}
                onClick={() => setActiveView('list')}
              >
                <i className="bi bi-list-ul"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard} onClick={() => setFilters({...filters, status: 'all'})}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <i className="bi bi-calendar3"></i>
          </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Tổng số</span>
          </div>
        </div>

          <div className={styles.statCard} onClick={() => setFilters({...filters, status: 'upcoming'})}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <i className="bi bi-clock-history"></i>
          </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.upcoming}</span>
              <span className={styles.statLabel}>Sắp tới</span>
          </div>
        </div>

          <div className={styles.statCard} onClick={() => setFilters({...filters, status: 'completed'})}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <i className="bi bi-check-circle-fill"></i>
          </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.completed}</span>
              <span className={styles.statLabel}>Hoàn thành</span>
            </div>
          </div>

          <div className={styles.statCard} onClick={() => setFilters({...filters, status: 'cancelled'})}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <i className="bi bi-x-circle-fill"></i>
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.cancelled}</span>
              <span className={styles.statLabel}>Đã hủy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={styles.searchFilterSection}>
        <div className={styles.searchBox}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>

        <button 
          className={`${styles.filterToggleBtn} ${showFilterPanel ? styles.active : ''}`}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
        >
          <i className="bi bi-funnel"></i>
          Bộ lọc
        </button>
      </div>

      {/* Advanced Filter Panel */}
      {showFilterPanel && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-toggle-on"></i>
                Trạng thái
              </label>
              <select 
                value={filters.status} 
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-event"></i>
                Từ ngày
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-check"></i>
                Đến ngày
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button 
              className={styles.resetFilterBtn}
              onClick={() => {
                setFilters({ status: 'all', timeRange: 'all', search: '' });
                setDateFrom('');
                setDateTo('');
              }}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              Đặt lại bộ lọc
            </button>
            <button 
              className={styles.applyFilterBtn}
              onClick={() => setShowFilterPanel(false)}
            >
              <i className="bi bi-check2"></i>
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="bi bi-calendar-x"></i>
          </div>
          <h3>Không tìm thấy lịch hẹn</h3>
          <p>Hãy thử thay đổi bộ lọc hoặc tạo lịch hẹn mới</p>
          </div>
        ) : (
        <div className={activeView === 'grid' ? styles.appointmentsGrid : styles.appointmentsList}>
          {filteredAppointments.map((appointment) => {
            const appointmentWithInfo = appointmentsWithDoctorInfo.find(apt => apt.id === appointment.id) || appointment;
            const statusConfig = getStatusConfig(appointmentWithInfo.statusCode || '');
            
            return (
            <div 
                key={appointmentWithInfo.id} 
              className={styles.appointmentCard}
                onClick={() => {
                  setSelectedAppointment(appointmentWithInfo);
                  setShowDetailModal(true);
                }}
            >
                <div className={styles.cardHeader}>
                  <div className={styles.statusBadge} style={{ background: statusConfig.color }}>
                    <i className={statusConfig.icon}></i>
                    <span>{statusConfig.label}</span>
                  </div>
                  {appointmentWithInfo.paymentStatusCode === 'Paid' && (
                    <div className={styles.paidBadge}>
                      <i className="bi bi-check-circle-fill"></i>
                      {getPaymentStatusLabel(appointmentWithInfo.paymentStatusCode)}
                  </div>
                  )}
              </div>

                <div className={styles.cardBody}>
                  <div className={styles.doctorSection}>
                    <div className={styles.doctorAvatar}>
                      <img src={appointmentWithInfo.avatar} alt={appointmentWithInfo.doctorName} />
                      <div className={styles.avatarBadge}>
                        <i className="bi bi-patch-check-fill"></i>
                </div>
                </div>
                    <div className={styles.doctorInfo}>
                      <h3>{appointmentWithInfo.doctorName}</h3>
                      <div className={styles.doctorMeta}>
                        {appointmentWithInfo.doctorTitle && (
                          <span className={styles.doctorTitle}>
                            <i className="bi bi-mortarboard-fill"></i>
                            {appointmentWithInfo.doctorTitle}
                          </span>
                )}
                        {appointmentWithInfo.specialty && (
                          <span className={styles.specialty}>
                            <i className="bi bi-heart-pulse-fill"></i>
                            {appointmentWithInfo.specialty}
                          </span>
                )}
              </div>
            </div>
      </div>

                  <div className={styles.appointmentInfo}>
                    <div className={styles.infoRow}>
                    <i className="bi bi-calendar3"></i>
                      <span>{formatDate(appointmentWithInfo.date)}</span>
                  </div>
                    <div className={styles.infoRow}>
                    <i className="bi bi-clock"></i>
                <span>
                        {appointmentWithInfo.appointmentStartTime && appointmentWithInfo.appointmentEndTime
                          ? formatTimeRange(appointmentWithInfo.appointmentStartTime, appointmentWithInfo.appointmentEndTime)
                          : appointmentWithInfo.time}
                </span>
              </div>
                    <div className={styles.infoRow}>
                      <i className="bi bi-credit-card"></i>
                      <span className={styles.fee}>{formatCurrency(appointmentWithInfo.totalAmount || appointmentWithInfo.fee)}</span>
              </div>
            </div>
            </div>

                <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                  {appointmentWithInfo.statusCode === 'BeforeAppoiment' && (
                    <div className={styles.footerActions}>
              <button 
                        className={styles.viewInfoBtn}
                        onClick={() => {
                          setSelectedAppointment(appointmentWithInfo);
                          setShowDetailModal(true);
                        }}
              >
                        <i className="bi bi-info-circle"></i>
                        Thông tin
              </button>
              <button 
                        className={styles.cancelBtn}
                        onClick={() => {
                          setSelectedAppointment(appointmentWithInfo);
                          setShowCancelDialog(true);
                        }}
              >
                        <i className="bi bi-x-circle"></i>
                        Hủy lịch
              </button>
        </div>
      )}
                  {appointmentWithInfo.statusCode === 'Completed' && (
                    <div className={styles.footerActions}>
              <button 
                        className={styles.emrBtn}
                        onClick={() => {
                          setSelectedAppointment(appointmentWithInfo);
                          setShowEMRModal(true);
                        }}
              >
                        <i className="bi bi-file-text"></i>
                        Xem EMR
              </button>
              <button 
                        className={styles.rateBtn}
                        onClick={() => {
                          setSelectedAppointment(appointmentWithInfo);
                          if (appointmentWithInfo.patientRating && appointmentWithInfo.patientReview) {
                            setRating(parseInt(appointmentWithInfo.patientRating) || 0);
                            setReviewComment(appointmentWithInfo.patientReview || '');
                            setIsViewingExistingReview(true);
                          } else {
                            setRating(0);
                            setReviewComment('');
                            setIsViewingExistingReview(false);
                          }
                          setShowRatingModal(true);
                        }}
              >
                        <i className={`bi ${appointmentWithInfo.patientRating && appointmentWithInfo.patientReview ? 'bi-eye' : 'bi-star'}`}></i>
                        {appointmentWithInfo.patientRating && appointmentWithInfo.patientReview ? 'Xem đánh giá' : 'Đánh giá'}
              </button>
            </div>
                  )}
          </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setShowDetailModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            
            <div className={styles.modalHeader}>
              <div className={styles.modalDoctorInfo}>
                <div className={styles.modalAvatarWrapper}>
                    <img src={selectedAppointment.avatar} alt={selectedAppointment.doctorName} />
                  <div className={styles.modalAvatarBadge}>
                    <i className="bi bi-patch-check-fill"></i>
                  </div>
                </div>
                <div className={styles.modalDoctorDetails}>
                  <h2 className={styles.modalDoctorName}>{selectedAppointment.doctorName}</h2>
                  <div className={styles.modalDoctorMeta}>
                    {selectedAppointment.doctorTitle && (
                      <span className={styles.modalDoctorTitle}>
                        <i className="bi bi-mortarboard-fill"></i>
                        {selectedAppointment.doctorTitle}
                      </span>
                    )}
                    {selectedAppointment.specialty && (
                      <span className={styles.modalSpecialty}>
                        <i className="bi bi-heart-pulse-fill"></i>
                        {selectedAppointment.specialty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.modalStatus} style={{ background: getStatusConfig(selectedAppointment.statusCode || '').color }}>
                <i className={getStatusConfig(selectedAppointment.statusCode || '').icon}></i>
                {getStatusConfig(selectedAppointment.statusCode || '').label}
                </div>
              </div>

            <div className={styles.modalBody}>
              <div className={styles.detailSection}>    
                <h4 className={styles.sectionTitle}>
                  <i className="bi bi-calendar-event"></i>
                  Thông tin lịch hẹn
                </h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailCard}>
                    <div className={styles.detailCardLabel}>NGÀY KHÁM</div>
                    <div className={styles.detailCardValue}>{formatDate(selectedAppointment.date)}</div>
                    </div>
                  <div className={styles.detailCard}>
                    <div className={styles.detailCardLabel}>GIỜ KHÁM</div>
                    <div className={styles.detailCardValue}>
                      {selectedAppointment.appointmentStartTime && selectedAppointment.appointmentEndTime
                        ? formatTimeRange(selectedAppointment.appointmentStartTime, selectedAppointment.appointmentEndTime)
                        : selectedAppointment.time}
                  </div>
                    </div>
                  {selectedAppointment.room && (
                    <div className={styles.detailCard}>
                      <div className={styles.detailCardLabel}>PHÒNG KHÁM</div>
                      <div className={styles.detailCardValue}>{selectedAppointment.room}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>
                  <i className="bi bi-credit-card"></i>
                  Thông tin thanh toán
                </h4>
                <div className={styles.paymentDetails}>
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentLabel}>Phí khám bệnh</span>
                    <span className={styles.paymentAmount}>{formatCurrency(selectedAppointment.fee)}</span>
                  </div>
                  {selectedAppointment.totalAmount && selectedAppointment.totalAmount !== selectedAppointment.fee && (
                    <>
                      <div className={styles.paymentRow}>
                        <span className={styles.paymentLabel}>Phí nền tảng</span>
                        <span className={styles.paymentAmount}>{formatCurrency(selectedAppointment.totalAmount - selectedAppointment.fee)}</span>
                      </div>
                      <div className={styles.paymentDivider}></div>
                      <div className={styles.paymentRow}>
                        <span className={styles.totalLabel}>Tổng cộng</span>
                        <span className={styles.totalValue}>{formatCurrency(selectedAppointment.totalAmount)}</span>
                      </div>
                    </>
                  )}
                  {selectedAppointment.paymentStatusCode && (
                    <div className={`${styles.paymentStatus} ${styles[`paymentStatus${selectedAppointment.paymentStatusCode}`] || ''}`}>
                      <i className={`bi ${getPaymentStatusIcon(selectedAppointment.paymentStatusCode)}`}></i>
                      <span>Trạng thái: {getPaymentStatusLabel(selectedAppointment.paymentStatusCode)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              {selectedAppointment.statusCode === 'BeforeAppoiment' && (
                <button 
                  className={styles.modalCancelBtn}
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowCancelDialog(true);
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                  Hủy lịch hẹn
                </button>
              )}
              {selectedAppointment.statusCode === 'Completed' && (
                <button 
                  className={styles.modalEmrBtn}
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowEMRModal(true);
                  }}
                >
                  <i className="bi bi-file-text"></i>
                  Xem hồ sơ bệnh án
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => !isCancelling && setShowCancelDialog(false)}>
          <div className={styles.cancelModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cancelModalHeader}>
              <div className={styles.cancelIcon}>
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h3>Xác nhận hủy lịch hẹn</h3>
              <p>Bạn có chắc chắn muốn hủy lịch hẹn này?</p>
            </div>

            <div className={styles.cancelModalBody}>
              <div className={styles.appointmentSummary}>
                <div className={styles.summaryRow}>
                  <span>Bác sĩ</span>
                  <strong>{selectedAppointment.doctorName}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Ngày giờ</span>
                  <strong>{formatDate(selectedAppointment.date)} - {selectedAppointment.time}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Phí khám</span>
                  <strong>{formatCurrency(selectedAppointment.totalAmount || selectedAppointment.fee)}</strong>
                </div>
              </div>

              {selectedAppointment.paymentStatusCode === 'Paid' && (
                <div className={styles.refundNotice}>
                  <i className="bi bi-info-circle-fill"></i>
                  <div>
                    <strong>Hoàn tiền</strong>
                    <p>
                      Bạn sẽ được hoàn lại {formatCurrency(calculateRefundAmount(selectedAppointment))}
                      {` (${refundPercentage}% tổng phí)`} – Phí hủy: {100 - refundPercentage}%.
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.warningNotice}>
                <i className="bi bi-exclamation-circle"></i>
                <span>Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ khám</span>
              </div>
            </div>

            <div className={styles.cancelModalFooter}>
            <button 
                className={styles.keepBtn}
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
            >
                Giữ lịch hẹn
            </button>
              <button 
                className={styles.confirmCancelBtn}
                onClick={handleCancelAppointment}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <span className={styles.btnSpinner}></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg"></i>
                    Xác nhận hủy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && cancelResult && (
        <div className={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIcon}>
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h3>Hủy lịch thành công!</h3>
            <p className={styles.successMessage}>
              {cancelResult.message || 'Lịch hẹn đã được hủy và tiền đã được hoàn lại thành công'}
            </p>

            {cancelResult.refundAmount && cancelResult.refundAmount > 0 && (
              <div className={styles.refundAmount}>
                <div className={styles.refundLabel}>SỐ TIỀN HOÀN LẠI</div>
                <div className={styles.refundValue}>{formatCurrency(cancelResult.refundAmount)}</div>
              </div>
            )}

            <button className={styles.successBtn} onClick={() => setShowSuccessModal(false)}>
              <i className="bi bi-check-lg"></i>
              Đồng ý
            </button>
          </div>
        </div>
      )}

      {/* EMR Modal */}
      {showEMRModal && selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => setShowEMRModal(false)}>
          <div className={styles.emrModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setShowEMRModal(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
            
            <div className={styles.emrHeader}>
              <i className="bi bi-file-text"></i>
              <h3>Hồ sơ bệnh án điện tử</h3>
                </div>

            <div className={styles.emrBody}>
              <div className={styles.emrSection}>
                <h4>Thông tin cuộc khám</h4>
                <p><strong>Bác sĩ:</strong> {selectedAppointment.doctorName}</p>
                <p><strong>Ngày khám:</strong> {formatDate(selectedAppointment.date)}</p>
                <p><strong>Chẩn đoán:</strong> Viêm khớp gối</p>
                <p><strong>Điều trị:</strong> Vật lý trị liệu, thuốc giảm đau</p>
                <p><strong>Ghi chú:</strong> Bệnh nhân cần tái khám sau 2 tuần</p>
              </div>
            </div>

            <div className={styles.emrFooter}>
              <button className={styles.downloadBtn}>
                <i className="bi bi-download"></i>
                Tải xuống PDF
              </button>
            </div>
                </div>
              </div>
            )}

      {/* Rating Modal */}
      {showRatingModal && selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => {
          setShowRatingModal(false);
          setRating(0);
          setHoverRating(0);
          setReviewComment('');
          setIsViewingExistingReview(false);
        }}>
          <div className={styles.ratingModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => {
              setShowRatingModal(false);
              setRating(0);
              setHoverRating(0);
              setReviewComment('');
              setIsViewingExistingReview(false);
            }}>
              <i className="bi bi-x-lg"></i>
            </button>
            
            <div className={styles.ratingHeader}>
              <h3>{isViewingExistingReview ? 'Đánh giá của bạn' : 'Đánh giá bác sĩ'}</h3>
              <p>
                {isViewingExistingReview 
                  ? `Đánh giá của bạn cho ${selectedAppointment.doctorName}`
                  : `Chia sẻ trải nghiệm của bạn với ${selectedAppointment.doctorName}`
                }
              </p>
            </div>

            <div className={styles.ratingBody}>
              <div className={styles.starsSection}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star} 
                    className={`bi ${star <= (hoverRating || rating) ? 'bi-star-fill' : 'bi-star'}`}
                    onClick={() => !isViewingExistingReview && setRating(star)}
                    onMouseEnter={() => !isViewingExistingReview && setHoverRating(star)}
                    onMouseLeave={() => !isViewingExistingReview && setHoverRating(0)}
                    style={{ 
                      color: star <= (hoverRating || rating) ? '#f59e0b' : '#cbd5e0',
                      cursor: isViewingExistingReview ? 'default' : 'pointer'
                    }}
                  ></i>
                ))}
              </div>
              <div className={styles.ratingDisplay}>
                {rating > 0 ? (
                  <p>
                    {isViewingExistingReview ? 'Bạn đã đánh giá: ' : 'Bạn đã chọn: '}
                    <strong>{rating}</strong> {rating === 1 ? 'sao' : 'sao'}
                    {rating === 5 && ' ⭐ Tuyệt vời!'}
                    {rating === 4 && ' 👍 Rất tốt!'}
                    {rating === 3 && ' 😊 Tốt'}
                    {rating === 2 && ' 😐 Trung bình'}
                    {rating === 1 && ' 😞 Cần cải thiện'}
                  </p>
                ) : (
                  !isViewingExistingReview && <p className={styles.ratingHint}>Nhấp vào sao để đánh giá</p>
                )}
              </div>
              <textarea 
                placeholder="Nhận xét về bác sĩ..."
                className={styles.reviewTextarea}
                value={reviewComment}
                onChange={(e) => !isViewingExistingReview && setReviewComment(e.target.value)}
                readOnly={isViewingExistingReview}
                style={{ 
                  cursor: isViewingExistingReview ? 'default' : 'text',
                  backgroundColor: isViewingExistingReview ? '#f8fafc' : 'white'
                }}
              ></textarea>
            </div>

            {!isViewingExistingReview && (
              <div className={styles.ratingFooter}>
                <button 
                  className={styles.submitRatingBtn}
                  disabled={rating === 0 || isSubmittingReview}
                  onClick={handleSubmitReview}
                  style={{ 
                    opacity: (rating === 0 || isSubmittingReview) ? 0.5 : 1, 
                    cursor: (rating === 0 || isSubmittingReview) ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {isSubmittingReview ? (
                    <>
                      <span className={styles.btnSpinner}></span>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send"></i>
                      Gửi đánh giá
                    </>
                  )}
                </button>
              </div>
            )}

            {isViewingExistingReview && (
              <div className={styles.ratingFooter}>
                <div className={styles.viewOnlyNotice}>
                  <i className="bi bi-info-circle"></i>
                  <span>Đánh giá đã được gửi và không thể chỉnh sửa</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};