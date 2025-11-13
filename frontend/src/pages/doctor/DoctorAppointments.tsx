import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/doctor/DoctorAppointments.module.css';
import { appointmentService } from '../../services/appointmentService';
import { Appointment } from '../../types/appointment.types';

interface AppointmentDisplay {
  id: string;
  patientName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  fee: number;
  avatar?: string;
  patientID?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  statusCode?: string;
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
  const [appointments, setAppointments] = useState<AppointmentDisplay[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDisplay | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEMRModal, setShowEMRModal] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    timeRange: 'all',
    search: ''
  });

  // Load appointments from API
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get appointments for the last 3 months and next 3 months
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const data = await appointmentService.getMyAppointmentsByDateRange(startDateStr, endDateStr);

        
        const transformedData: AppointmentDisplay[] = data.map(apt => {
          const startDate = new Date(apt.appointmentStartTime);
          
          const now = new Date();
          let status: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';

          if (apt.statusCode === 'Completed') {
            status = 'completed';
          } else if (
            apt.statusCode === 'CancelledByPatient' || 
            apt.statusCode === 'CancelledByDoctor' || 
            apt.statusCode === 'NoShow'
          ) {
            status = 'cancelled';
          } else if (startDate <= now) {
            // Nếu lịch hẹn đã qua mà chưa hoàn thành/hủy, coi như đã hoàn thành
            status = 'completed';
          }
          
          return {
            id: apt.id,
            patientName: apt.patientName,
            date: startDate.toISOString().split('T')[0],
            time: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
            status,
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
  }, []);

  // Statistics
  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(apt => apt.status === 'upcoming').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length
  };

  // Filter appointments
  useEffect(() => {
    let filtered = [...appointments];

    if (filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    if (filters.search) {
      filtered = filtered.filter(apt => 
        apt.patientName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();

      // Ensure that only future appointments are displayed
      filtered = filtered.filter(apt => apt.appointmentStartTime && new Date(apt.appointmentStartTime) >= now);


      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.date);
        if (filters.timeRange === 'today') {
          return aptDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
        } else if (filters.timeRange === 'week') {
          // Set 'now' to the beginning of today for a consistent comparison
          now.setHours(0, 0, 0, 0);
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return aptDate >= now && aptDate <= weekFromNow;
        } else if (filters.timeRange === 'month') {
          return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  const getAppointmentStatus = (apt: AppointmentDisplay): 'upcoming' | 'completed' | 'cancelled' => {
    if (apt.statusCode === 'Completed') {
      return 'completed';
    } else if (
      apt.statusCode === 'CancelledByPatient' || 
      apt.statusCode === 'CancelledByDoctor' || 
      apt.statusCode === 'NoShow'
    ) {
      return 'cancelled';
    }
    return 'upcoming';
  };

  const getStatusConfig = (status: string, startTime?: string, endTime?: string) => {
  const currentTime = new Date();
  const appointmentStartTime = startTime ? new Date(startTime) : null;
  const appointmentEndTime = endTime ? new Date(endTime) : null;

  // ✅ 1. Trạng thái cố định
  if (status === 'completed') {
    return { 
      label: 'Hoàn thành', 
      icon: 'bi-check-circle-fill',
      color: '#10b981'
    };
  }
  
  if (status === 'cancelled') {
    return { 
      label: 'Đã hủy', 
      icon: 'bi-x-circle-fill',
      color: '#ef4444'
    };
  }

  // ✅ 2. Xác định trạng thái theo thời gian
  if (appointmentStartTime && appointmentEndTime) {
    if (currentTime >= appointmentStartTime && currentTime <= appointmentEndTime) {
      return { 
        label: 'Đang diễn ra', 
        icon: 'bi-clock-history',
        color: '#3b82f6'
      };
    } else if (currentTime < appointmentStartTime) {
      return { 
        label: 'Sắp diễn ra', 
        icon: 'bi-clock-history',
        color: '#f59e0b'
      };
    } else if (currentTime > appointmentEndTime) {
      // ✅ Lịch đã qua => coi như "Hoàn thành"
      return { 
        label: 'Hoàn thành', 
        icon: 'bi-check-circle-fill',
        color: '#10b981'
      };
    }
  }

  // ✅ 3. Mặc định nếu không rõ
  return { 
    label: 'Hoàn thành', 
    icon: 'bi-check-circle-fill',
    color: '#10b981'
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

      {/* Filters Section */}
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

      {/* Appointments List */}
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
            const appointmentStatus = getAppointmentStatus(appointment);
            const statusConfig = getStatusConfig(
              appointmentStatus,
              appointment.appointmentStartTime,
              appointment.appointmentEndTime
            );
            
            return (
              <div 
                key={appointment.id} 
                className={styles.appointmentCard}
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowDetailModal(true);
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.statusBadge} style={{ background: statusConfig.color }}>
                    <i className={statusConfig.icon}></i>
                    <span>{statusConfig.label}</span>
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
                      <span className={styles.fee}>{formatCurrency(appointment.totalAmount || appointment.fee)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                  {appointment.status === 'upcoming' && (
                    <div className={styles.footerActions}>
                      <button 
                        className={styles.viewInfoBtn}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailModal(true);
                        }}
                      >
                        <i className="bi bi-info-circle"></i>
                        Thông tin
                      </button>
                    </div>
                  )}
                  {appointment.status === 'completed' && (
                    <div className={styles.footerActions}>
                      <button 
                        className={styles.emrBtn}
                        onClick={() => {
                          navigate(`/app/doctor/medical-records/${appointment.id}`);
                        }}
                      >
                        <i className="bi bi-file-text"></i>
                        Xem EMR
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
      {showDetailModal && selectedAppointment && (() => {
        const appointmentStatus = getAppointmentStatus(selectedAppointment);
        const statusConfig = getStatusConfig(
          appointmentStatus,
          selectedAppointment.appointmentStartTime,
          selectedAppointment.appointmentEndTime
        );
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
                {selectedAppointment.status === 'completed' && (
                  <button 
                    className={styles.modalEmrBtn}
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate(`/app/doctor/medical-records/${selectedAppointment.id}`);
                    }}
                  >
                    <i className="bi bi-file-text"></i>
                    Xem hồ sơ bệnh án
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DoctorAppointments;
