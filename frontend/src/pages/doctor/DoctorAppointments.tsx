
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/doctor/DoctorAppointments.module.css';
import Swal from 'sweetalert2';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment.types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface AppointmentDisplay {
  id: string;
  patientName: string;
  date: string;
  time: string;
  fee: number;
  avatar?: string;
  patientID?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  statusCode: string;
  statusDisplayName?: string;
  paymentStatusCode?: string;
  totalAmount?: number;
  medicalInfo?: string;
}

interface FilterOptions {
  status: string;
  timeRange: string;
  search: string;
}

const DoctorAppointments: React.FC = () => {
  const navigate = useNavigate();
  const { user, isBanned } = useAuth();
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentDisplay[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDisplay | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEMRModal, setShowEMRModal] = useState(false);
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);
  const [isCompletingAppointment, setIsCompletingAppointment] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    timeRange: 'all',
    search: ''
  });
  const [highlightAppointmentIds, setHighlightAppointmentIds] = useState<string[]>([]);
  const highlightRefs = useRef<Record<string, HTMLDivElement | null>>({});
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
  const showBannedPopup = () => {
    if (user) {
      const startDate = (user as any)?.startDateBanned ? new Date((user as any).startDateBanned).toLocaleDateString('vi-VN') : '';
      const endDate = (user as any)?.endDateBanned ? new Date((user as any).endDateBanned).toLocaleDateString('vi-VN') : '';
      
      Swal.fire({
        title: 'Tài khoản bị tạm khóa',
        html: `Chức năng xem chi tiết hồ sơ bệnh án của bạn đã bị tạm khóa từ <b>${startDate}</b> đến <b>${endDate}</b>.<br/>Mọi thắc mắc vui lòng liên hệ quản trị viên.`,
        icon: 'warning',
        confirmButtonText: 'Đã hiểu'
      });
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    setIsCompletingAppointment(true);
    try {
      await appointmentService.completeAppointment(selectedAppointment.id);
      showToast('Hoàn thành ca khám thành công!', 'success');
      setShowConfirmCompleteModal(false);
      setShowDetailModal(false);
      
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const data = await appointmentService.getMyAppointmentsByDateRange(startDateStr, endDateStr);
      
      const transformedData: AppointmentDisplay[] = data.map(apt => {
        const startDate = new Date(apt.appointmentStartTime);

        const year = startDate.getFullYear();
        const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
        const day = startDate.getDate().toString().padStart(2, '0');
        const datePart = `${year}-${month}-${day}`;
        
        const hours = startDate.getHours().toString().padStart(2, '0');
        const minutes = startDate.getMinutes().toString().padStart(2, '0');
        
        return {
          id: apt.id,
          patientName: apt.patientName,
          date: datePart,
          time: `${hours}:${minutes}`,
          fee: apt.consultationFee,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=667eea&color=fff`,
          patientID: apt.patientID,
          appointmentStartTime: apt.appointmentStartTime,
          appointmentEndTime: apt.appointmentEndTime,
          statusCode: apt.statusCode,
          statusDisplayName: apt.statusDisplayName,
          paymentStatusCode: apt.paymentStatusCode,
          totalAmount: apt.totalAmount,
          medicalInfo: apt.medicalInfo,
        };
      });
      
      setAppointments(transformedData);
      setFilteredAppointments(transformedData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data || 'Không thể hoàn thành ca khám';
      showToast(errorMessage, 'error');
    } finally {
      setIsCompletingAppointment(false);
    }
  };

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const data = await appointmentService.getMyAppointmentsByDateRange(startDateStr, endDateStr);

        
        const transformedData: AppointmentDisplay[] = data.map(apt => {
          const startDate = new Date(apt.appointmentStartTime);
          
          const year = startDate.getFullYear();
          const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
          const day = startDate.getDate().toString().padStart(2, '0');
          const datePart = `${year}-${month}-${day}`;
          
          const hours = startDate.getHours().toString().padStart(2, '0');
          const minutes = startDate.getMinutes().toString().padStart(2, '0');
          
          return {
            id: apt.id,
            patientName: apt.patientName,
            date: datePart,
            time: `${hours}:${minutes}`,
            fee: apt.consultationFee,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=667eea&color=fff`,
            patientID: apt.patientID,
            appointmentStartTime: apt.appointmentStartTime,
            appointmentEndTime: apt.appointmentEndTime,
            statusCode: apt.statusCode,
            statusDisplayName: apt.statusDisplayName,
            paymentStatusCode: apt.paymentStatusCode,
            totalAmount: apt.totalAmount,
            medicalInfo: apt.medicalInfo,
          };
        });
        
        setAppointments(transformedData);
        setFilteredAppointments(transformedData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách lịch hẹn');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();

    // Nhận trạng thái từ trang lịch làm việc để highlight cuộc hẹn cụ thể
    const navState = (window.history.state && (window.history.state as any).usr) || null;
    if (navState?.highlightAppointmentIds) {
      setHighlightAppointmentIds(navState.highlightAppointmentIds as string[]);
    }
  }, []);

  // Sau khi đã có danh sách highlight và dữ liệu render, cuộn cuộc hẹn đầu tiên vào giữa màn hình
  useEffect(() => {
    if (!highlightAppointmentIds.length) return;
    const firstId = highlightAppointmentIds[0];
    const el = highlightRefs.current[firstId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightAppointmentIds, filteredAppointments]);

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(apt => 
      apt.statusCode !== 'Completed' && 
      apt.statusCode !== 'CancelledByPatient' && 
      apt.statusCode !== 'CancelledByDoctor' && 
      apt.statusCode !== 'MissedByDoctor' && 
      apt.statusCode !== 'MissedByPatient' && 
      apt.statusCode !== 'NoShow' &&
      apt.statusCode !== 'OnProgressing'
    ).length,
    completed: appointments.filter(apt => apt.statusCode === 'Completed').length,
    cancelled: appointments.filter(apt => 
      apt.statusCode === 'CancelledByPatient' || 
      apt.statusCode === 'CancelledByDoctor' || 
      apt.statusCode === 'MissedByDoctor' || 
      apt.statusCode === 'MissedByPatient' || 
      apt.statusCode === 'NoShow'
    ).length
  };

  useEffect(() => {
    let filtered = [...appointments];

    if (filters.status !== 'all') {
      if (filters.status === 'upcoming') {
        filtered = filtered.filter(apt => 
          apt.statusCode !== 'Completed' && 
          apt.statusCode !== 'CancelledByPatient' && 
          apt.statusCode !== 'CancelledByDoctor' && 
          apt.statusCode !== 'MissedByDoctor' && 
          apt.statusCode !== 'MissedByPatient' && 
          apt.statusCode !== 'NoShow' &&
          apt.statusCode !== 'OnProgressing'
        );
      } else if (filters.status === 'completed') {
        filtered = filtered.filter(apt => apt.statusCode === 'Completed');
      } else if (filters.status === 'cancelled') {
        filtered = filtered.filter(apt => 
          apt.statusCode === 'CancelledByPatient' || 
          apt.statusCode === 'CancelledByDoctor' || 
          apt.statusCode === 'MissedByDoctor' || 
          apt.statusCode === 'MissedByPatient' || 
          apt.statusCode === 'NoShow'
        );
      }
    }

    if (filters.search) {
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        if (filters.timeRange === 'today') {
          return aptDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
        } else if (filters.timeRange === 'week') {
          now.setHours(0, 0, 0, 0);
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return aptDate >= now && aptDate <= weekFromNow;
        } else if (filters.timeRange === 'month') {
          return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    filtered.sort((a, b) => {
      const getSortPriority = (apt: AppointmentDisplay) => {
        if (apt.statusCode === 'OnProgressing') return 1; 
        if (apt.statusCode === 'BeforeAppoiment' || apt.statusCode === 'PendingConfirmation' || apt.statusCode === 'Confirmed') return 2; // Agendado/Pendente
        if (apt.statusCode === 'Completed') return 3; 
        if (apt.statusCode === 'CancelledByPatient' || apt.statusCode === 'CancelledByDoctor') return 4; // Cancelado
        if (apt.statusCode === 'MissedByPatient' || apt.statusCode === 'MissedByDoctor' || apt.statusCode === 'NoShow') return 5; // Faltou
        return 6; 
      };
    
      const priorityA = getSortPriority(a);
      const priorityB = getSortPriority(b);
    
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
    
      const timeA = a.appointmentStartTime ? new Date(a.appointmentStartTime).getTime() : 0;
      const timeB = b.appointmentStartTime ? new Date(b.appointmentStartTime).getTime() : 0;
      
      return timeA - timeB; 
    });
    
    setFilteredAppointments(filtered);
  }, [filters, appointments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  
  const convertToUTC = (isoString: string): Date => {
   
    return new Date(isoString);
  };

  const formatTimeRange = (startTime?: string, endTime?: string) => {
    if (!startTime) return '';

    const extractTimeFromISO = (isoString: string): string => {
      const date = new Date(isoString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const startFormatted = extractTimeFromISO(startTime);

    if (endTime) {
      const endFormatted = extractTimeFromISO(endTime);
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

  const formatCurrencyCompact = (value: number): string => {
    const amount = value || 0;
    const abs = Math.abs(amount);

    if (abs >= 1_000_000_000) {
      const compact = amount / 1_000_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}B VND`;
    }

    if (abs >= 1_000_000) {
      const compact = amount / 1_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}M VND`;
    }

    if (abs >= 1_000) {
      const compact = amount / 1_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}K VND`;
    }

    return `${amount.toLocaleString('vi-VN')} VND`;
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
            <p>Đang tải lịch hẹn...</p>
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
              Quản lý và theo dõi các cuộc hẹn khám bệnh với bệnh nhân
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

      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm bệnh nhân..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>

        <div className={styles.filterButtons}>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select 
            value={filters.timeRange} 
            onChange={(e) => setFilters({...filters, timeRange: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="bi bi-calendar-x"></i>
          </div>
          <h3>Không tìm thấy lịch hẹn</h3>
          <p>Hãy thử thay đổi bộ lọc</p>
        </div>
      ) : (
        <div className={activeView === 'grid' ? styles.appointmentsGrid : styles.appointmentsList}>
          {filteredAppointments.map((appointment) => {
            const statusConfig = getStatusConfig(appointment.statusCode);
            
            return (
              <div 
                key={appointment.id} 
                ref={el => { highlightRefs.current[appointment.id] = el; }}
                className={`${styles.appointmentCard} ${highlightAppointmentIds.includes(appointment.id) ? styles.highlightCard : ''}`}
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowDetailModal(true);
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.statusBadge} style={{ background: statusConfig.color }}>
                    <i className={statusConfig.icon}></i>
                    <span>{statusDisplayNameMap[appointment.statusCode] || appointment.statusDisplayName || appointment.statusCode}</span>
                  </div>
                  {appointment.paymentStatusCode === 'Paid' && (
                    <div className={styles.paidBadge}>
                      <i className="bi bi-check-circle-fill"></i>
                      {getPaymentStatusLabel(appointment.paymentStatusCode)}
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.patientSection}>
                    <div className={styles.patientAvatar}>
                      <img 
                        src={appointment.avatar} 
                        alt={appointment.patientName}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientName)}&background=667eea&color=fff`;
                        }}
                      />
                      <div className={styles.avatarBadge}>
                        <i className="bi bi-person-fill"></i>
                      </div>
                    </div>
                    <div className={styles.patientInfo}>
                      <h3>{appointment.patientName}</h3>
                      <div className={styles.patientMeta}>
                        <span className={styles.patientLabel}>
                          <i className="bi bi-person-heart"></i>
                          Bệnh nhân
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.appointmentInfo}>
                    <div className={styles.infoRow}>
                      <i className="bi bi-calendar3"></i>
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <i className="bi bi-clock"></i>
                      <span>
                        {appointment.appointmentStartTime && appointment.appointmentEndTime
                          ? formatTimeRange(appointment.appointmentStartTime, appointment.appointmentEndTime)
                          : appointment.time}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <i className="bi bi-credit-card"></i>
                      <span className={styles.fee}>{formatCurrencyCompact(appointment.totalAmount || appointment.fee)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                  {appointment.statusCode !== 'CancelledByPatient' && 
                   appointment.statusCode !== 'CancelledByDoctor' && 
                   appointment.statusCode !== 'MissedByDoctor' && 
                   appointment.statusCode !== 'MissedByPatient' && 
                   appointment.statusCode !== 'NoShow' && (
                    <div className={styles.footerActions}>
                      <button 
                        className={styles.emrBtn}
                        onClick={() => {
                          if (isBanned) {
                            showBannedPopup();
                          } else {
                            navigate(`/app/doctor/medical-records/${appointment.id}`);
                          }
                        }}
                      >
                        <i className="bi bi-file-text"></i>
                        Xem EMR
                      </button>
                      {appointment.statusCode === 'BeforeAppoiment' && (
                        <button 
                          className={styles.completeBtn}
                          onClick={async () => {
                            const now = new Date();
                            const startTime = appointment.appointmentStartTime ? new Date(appointment.appointmentStartTime) : null;
                            const endTime = appointment.appointmentEndTime ? new Date(appointment.appointmentEndTime) : null;
                            if (
                              appointment.statusCode === 'BeforeAppoiment' &&
                              startTime && endTime &&
                              now >= startTime && now <= endTime
                            ) {
                              try {
                                await appointmentService.updateStatus(appointment.id, 'OnProgressing');
                                showToast('Đã bắt đầu ca khám!', 'success');
                                const reloadNow = new Date();
                                const reloadStartDate = new Date(reloadNow.getFullYear(), reloadNow.getMonth() - 3, 1);
                                const reloadEndDate = new Date(reloadNow.getFullYear(), reloadNow.getMonth() + 3, 0);
                                const reloadStartDateStr = reloadStartDate.toISOString().split('T')[0];
                                const reloadEndDateStr = reloadEndDate.toISOString().split('T')[0];
                                const data = await appointmentService.getMyAppointmentsByDateRange(reloadStartDateStr, reloadEndDateStr);
                                const transformedData = data.map(apt => {
                                  const startDate = new Date(apt.appointmentStartTime);
                                  const vietnamTime = new Date(startDate.getTime() + (7 * 60 * 60 * 1000));
                                  const year = vietnamTime.getUTCFullYear();
                                  const month = (vietnamTime.getUTCMonth() + 1).toString().padStart(2, '0');
                                  const day = vietnamTime.getUTCDate().toString().padStart(2, '0');
                                  const datePart = `${year}-${month}-${day}`;
                                  const hours = vietnamTime.getUTCHours().toString().padStart(2, '0');
                                  const minutes = vietnamTime.getUTCMinutes().toString().padStart(2, '0');
                                  return {
                                    id: apt.id,
                                    patientName: apt.patientName,
                                    date: datePart,
                                    time: `${hours}:${minutes}`,
                                    fee: apt.consultationFee,
                                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName)}&background=667eea&color=fff`,
                                    patientID: apt.patientID,
                                    appointmentStartTime: apt.appointmentStartTime,
                                    appointmentEndTime: apt.appointmentEndTime,
                                    statusCode: apt.statusCode,
                                    statusDisplayName: apt.statusCode === 'OnProgressing' ? 'Đang khám' : apt.statusDisplayName,
                                    paymentStatusCode: apt.paymentStatusCode,
                                    totalAmount: apt.totalAmount,
                                    medicalInfo: apt.medicalInfo,
                                  };
                                });
                                setAppointments(transformedData);
                              } catch (error) {
                                showToast('Có lỗi xảy ra!', 'error');
                              }
                            } else {
                              showToast('Chỉ được bắt đầu ca khám trong khung giờ đã đặt!', 'warning');
                            }
                          }}
                        >
                          <i className="bi bi-play-circle"></i>
                          Bắt đầu ca khám
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
            );
          })}
        </div>
      )}

      {showDetailModal && selectedAppointment && (() => {
        const statusConfig = getStatusConfig(selectedAppointment.statusCode);
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.patientName)}&background=667eea&color=fff`;

        const formatDetailDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        };

        return (
          <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
            <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeModalBtn} onClick={() => setShowDetailModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            
              <div className={styles.modalHeader}>
                <div className={styles.modalPatientInfo}>
                  <div className={styles.modalAvatarWrapper}>
                    <img 
                      src={avatarUrl} 
                      alt={selectedAppointment.patientName}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.patientName)}&background=667eea&color=fff`;
                      }}
                    />
                    <div className={styles.modalAvatarBadge}>
                      <i className="bi bi-person-fill"></i>
                    </div>
                  </div>
                  <div className={styles.modalPatientDetails}>
                    <h2 className={styles.modalPatientName}>{selectedAppointment.patientName}</h2>
                    <div className={styles.modalPatientMeta}>
                      <span className={styles.modalPatientLabel}>
                        <i className="bi bi-person-heart"></i>
                        Bệnh nhân
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.modalStatus} style={{ background: statusConfig.color }}>
                  <i className={statusConfig.icon}></i>
                  {statusConfig.label}
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
                      <div className={styles.detailCardValue}>{formatDetailDate(selectedAppointment.appointmentStartTime || selectedAppointment.date)}</div>
                    </div>
                    <div className={styles.detailCard}>
                      <div className={styles.detailCardLabel}>GIỜ KHÁM</div>
                      <div className={styles.detailCardValue}>
                        {selectedAppointment.appointmentStartTime && selectedAppointment.appointmentEndTime
                          ? formatTimeRange(selectedAppointment.appointmentStartTime, selectedAppointment.appointmentEndTime)
                          : selectedAppointment.time}
                      </div>
                    </div>
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
                      <span className={styles.paymentAmount}>{formatCurrencyCompact(selectedAppointment.fee)}</span>
                    </div>
                    {selectedAppointment.totalAmount && selectedAppointment.totalAmount !== selectedAppointment.fee && (
                      <>
                        <div className={styles.paymentRow}>
                          <span className={styles.paymentLabel}>Phí nền tảng</span>
                          <span className={styles.paymentAmount}>{formatCurrencyCompact(selectedAppointment.totalAmount - selectedAppointment.fee)}</span>
                        </div>
                        <div className={styles.paymentDivider}></div>
                        <div className={styles.paymentRow}>
                          <span className={styles.totalLabel}>Tổng cộng</span>
                          <span className={styles.totalValue}>{formatCurrencyCompact(selectedAppointment.totalAmount)}</span>
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
                {selectedAppointment.statusCode !== 'CancelledByPatient' && 
                 selectedAppointment.statusCode !== 'CancelledByDoctor' && 
                 selectedAppointment.statusCode !== 'MissedByDoctor' && 
                 selectedAppointment.statusCode !== 'MissedByPatient' && 
                 selectedAppointment.statusCode !== 'NoShow' && (
                  <>
                    <button 
                      className={styles.modalEmrBtn}
                      onClick={() => {
                        if (isBanned) {
                          showBannedPopup();
                        } else {
                          setShowDetailModal(false);
                          navigate(`/app/doctor/medical-records/${selectedAppointment.id}`);
                        }
                      }}
                    >
                      <i className="bi bi-file-text"></i>
                      Xem EMR
                    </button>
               
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showConfirmCompleteModal && selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => !isCompletingAppointment && setShowConfirmCompleteModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <i className="bi bi-check-circle"></i>
            </div>
            <h3>Xác nhận hoàn thành ca khám</h3>
            <p>Bạn có chắc chắn muốn kết thúc ca khám cho bệnh nhân <strong>{selectedAppointment.patientName}</strong>?</p>
            <div className={styles.confirmInfo}>
              <div className={styles.infoRow}>
                <i className="bi bi-calendar3"></i>
                <span>{formatDate(selectedAppointment.date)}</span>
              </div>
              <div className={styles.infoRow}>
                <i className="bi bi-clock"></i>
                <span>
                  {selectedAppointment.appointmentStartTime && selectedAppointment.appointmentEndTime
                    ? formatTimeRange(selectedAppointment.appointmentStartTime, selectedAppointment.appointmentEndTime)
                    : selectedAppointment.time}
                </span>
              </div>
            </div>
            <div className={styles.confirmActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => setShowConfirmCompleteModal(false)}
                disabled={isCompletingAppointment}
              >
                Hủy
              </button>
              <button 
                className={styles.confirmCompleteBtn}
                onClick={handleCompleteAppointment}
                disabled={isCompletingAppointment}
              >
                {isCompletingAppointment ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
