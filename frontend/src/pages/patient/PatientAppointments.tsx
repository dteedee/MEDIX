import React, { useState, useEffect } from 'react';
import styles from '../../styles/patient/PatientAppointments.module.css';
import { appointmentService } from '../../services/appointmentService';
import { Appointment as AppointmentDto } from '../../types/appointment.types';

interface Appointment {
  id: string;
  doctorName: string;
  doctorTitle: string;
  specialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  room: string;
  fee: number;
  avatar?: string;
  rating?: number;
  review?: string;
  emrId?: string;
  // Thêm các field từ API
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
  specialty: string;
  dateRange: string;
  doctor: string;
}

export const PatientAppointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showEMRModal, setShowEMRModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    specialty: 'all',
    dateRange: 'all',
    doctor: ''
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  // Load appointments from API
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await appointmentService.getPatientAppointments();
        
        // Transform API data to UI format
        const transformedData: Appointment[] = data.map(apt => {
          const startDate = new Date(apt.appointmentStartTime);
          const endDate = new Date(apt.appointmentEndTime);
          
          // Map statusCode to UI status
          // Status codes từ backend:
          // - Confirmed: Đã xác nhận (upcoming)
          // - OnProgressing: Đang xử lý thanh toán (upcoming)
          // - Completed: Đã hoàn thành
          // - CancelledByPatient: Bệnh nhân hủy
          // - CancelledByDoctor: Bác sĩ hủy
          // - NoShow: Không đến khám
          let status: 'upcoming' | 'completed' | 'cancelled' = 'upcoming';
          
          if (apt.statusCode === 'Completed') {
            status = 'completed';
          } else if (
            apt.statusCode === 'CancelledByPatient' || 
            apt.statusCode === 'CancelledByDoctor' || 
            apt.statusCode === 'NoShow'
          ) {
            status = 'cancelled';
          } else if (apt.statusCode === 'Confirmed' || apt.statusCode === 'OnProgressing') {
            status = 'upcoming';
          }
          
          return {
            id: apt.id,
            doctorName: apt.doctorName,
            doctorTitle: '', // Backend chưa có field này
            specialty: '', // Backend chưa có field này
            date: startDate.toISOString().split('T')[0],
            time: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
            status,
            room: '', // Backend chưa có field này
            fee: apt.consultationFee,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName)}&background=667eea&color=fff`,
            // API fields
            appointmentStartTime: apt.appointmentStartTime,
            appointmentEndTime: apt.appointmentEndTime,
            statusCode: apt.statusCode,
            statusDisplayName: apt.statusDisplayName,
            paymentStatusCode: apt.paymentStatusCode,
            totalAmount: apt.totalAmount,
          };
        });
        
        setAppointments(transformedData);
        setFilteredAppointments(transformedData);
      } catch (err: any) {
        console.error('Error loading appointments:', err);
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

  useEffect(() => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // Specialty filter
    if (filters.specialty !== 'all') {
      filtered = filtered.filter(apt => apt.specialty === filters.specialty);
    }

    setFilteredAppointments(filtered);
  }, [searchTerm, filters, appointments]);

  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;

    try {
      setIsCancelling(true);
      
      // Call API to cancel appointment (without reason)
      const result = await appointmentService.cancelPatientAppointment(
        selectedAppointment.id
      );

      // Update local state to reflect cancellation
      setAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, status: 'cancelled' as const, statusCode: 'CancelledByPatient' }
            : apt
        )
      );

      // Close dialog and reset
      setShowCancelDialog(false);
      setSelectedAppointment(null);

      // Show success message (you can use toast notification here)
      alert(result.message || 'Hủy lịch hẹn thành công!');
      
      // If refund was processed, show refund amount
      if (result.refundAmount) {
        alert(`Số tiền hoàn lại: ${formatCurrency(result.refundAmount)}`);
      }

    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      const errorMessage = error.response?.data?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRateDoctor = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRatingModal(true);
  };

  const handleViewEMR = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEMRModal(true);
  };

  const handleViewDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { text: 'Sắp diễn ra', class: styles.statusUpcoming },
      completed: { text: 'Đã hoàn thành', class: styles.statusCompleted },
      cancelled: { text: 'Đã hủy', class: styles.statusCancelled }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`${styles.statusBadge} ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Lịch hẹn khám bệnh</h1>
          <p>Quản lý và theo dõi các cuộc hẹn khám bệnh của bạn</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <i className="bi bi-calendar3"></i>
            <span>{new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải danh sách lịch hẹn...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.errorContainer}>
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Statistics Cards */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCard1}`}>
              <div className={styles.statIcon}>
                <i className="bi bi-calendar-check"></i>
              </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số cuộc hẹn</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-clock"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Sắp diễn ra</div>
            <div className={styles.statValue}>{stats.upcoming}</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-check-circle"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đã hoàn thành</div>
            <div className={styles.statValue}>{stats.completed}</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-x-circle"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đã hủy</div>
            <div className={styles.statValue}>{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchFilterSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bác sĩ hoặc chuyên khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className={styles.filterBtn}
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          >
            <i className="bi bi-funnel"></i>
            Bộ lọc nâng cao
            <i className={`bi bi-chevron-${showAdvancedFilter ? 'up' : 'down'}`}></i>
          </button>
        </div>

        {showAdvancedFilter && (
          <div className={styles.advancedFilter}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>Trạng thái</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">Tất cả</option>
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Chuyên khoa</label>
                <select 
                  value={filters.specialty} 
                  onChange={(e) => setFilters({...filters, specialty: e.target.value})}
                >
                  <option value="all">Tất cả</option>
                  <option value="Xương khớp">Xương khớp</option>
                  <option value="Tim mạch">Tim mạch</option>
                  <option value="Thần kinh">Thần kinh</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Khoảng thời gian</label>
                <select 
                  value={filters.dateRange} 
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                >
                  <option value="all">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Tên bác sĩ</label>
                <input
                  type="text"
                  placeholder="Nhập tên bác sĩ..."
                  value={filters.doctor}
                  onChange={(e) => setFilters({...filters, doctor: e.target.value})}
                />
              </div>
            </div>

            <div className={styles.filterActions}>
              <button 
                className={styles.clearBtn}
                onClick={() => setFilters({status: 'all', specialty: 'all', dateRange: 'all', doctor: ''})}
              >
                Xóa bộ lọc
              </button>
              <button 
                className={styles.applyBtn}
                onClick={() => setShowAdvancedFilter(false)}
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className={styles.appointmentsList}>
        {filteredAppointments.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="bi bi-calendar-x"></i>
            <h3>Không tìm thấy cuộc hẹn nào</h3>
            <p>Hãy thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className={styles.appointmentCard}
              onClick={() => handleViewDetail(appointment)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.appointmentHeader}>
                <div className={styles.doctorInfo}>
                  <div className={styles.doctorAvatar}>
                    <img src={appointment.avatar} alt={appointment.doctorName} />
                  </div>
                  <div className={styles.doctorDetails}>
                    <h3>{appointment.doctorName}</h3>
                    <p>{appointment.doctorTitle}</p>
                    <span className={styles.specialty}>{appointment.specialty}</span>
                  </div>
                </div>
                {getStatusBadge(appointment.status)}
              </div>

              <div className={styles.appointmentDetails}>
                <div className={styles.detailItem}>
                  <i className="bi bi-calendar3"></i>
                  <span>{formatDate(appointment.date)}</span>
                </div>
                <div className={styles.detailItem}>
                  <i className="bi bi-clock"></i>
                  <span>{appointment.time}</span>
                </div>
                <div className={styles.detailItem}>
                  <i className="bi bi-geo-alt"></i>
                  <span>{appointment.room}</span>
                </div>
                <div className={styles.detailItem}>
                  <i className="bi bi-currency-dollar"></i>
                  <span>{formatCurrency(appointment.fee)}</span>
                </div>
              </div>

              <div className={styles.appointmentActions} onClick={(e) => e.stopPropagation()}>
                {appointment.status === 'upcoming' && (
                  <button 
                    className={styles.cancelBtn}
                    onClick={() => handleCancelAppointment(appointment)}
                  >
                    <i className="bi bi-x-circle"></i>
                    Hủy lịch khám
                  </button>
                )}
                
                {appointment.status === 'completed' && (
                  <>
                    <button 
                      className={styles.rateBtn}
                      onClick={() => handleRateDoctor(appointment)}
                    >
                      <i className="bi bi-star"></i>
                      Đánh giá
                    </button>
                    <button 
                      className={styles.emrBtn}
                      onClick={() => handleViewEMR(appointment)}
                    >
                      <i className="bi bi-file-text"></i>
                      Xem EMR
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận hủy lịch khám</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.cancelInfo}>
                <p>Bạn có chắc chắn muốn hủy lịch khám với <strong>{selectedAppointment?.doctorName}</strong>?</p>
                <div className={styles.appointmentSummary}>
                  <div className={styles.summaryItem}>
                    <i className="bi bi-calendar3"></i>
                    <span>{formatDate(selectedAppointment?.date || '')}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <i className="bi bi-clock"></i>
                    <span>{selectedAppointment?.time}</span>
                  </div>
                </div>
              </div>

              <div className={styles.refundInfo}>
                <i className="bi bi-info-circle"></i>
                <span>
                  {selectedAppointment?.paymentStatusCode === 'Paid' 
                    ? `Số tiền ${formatCurrency(Math.round((selectedAppointment?.totalAmount || selectedAppointment?.fee || 0) * 0.8))} (80% của ${formatCurrency(selectedAppointment?.totalAmount || selectedAppointment?.fee || 0)}) sẽ được hoàn lại vào ví của bạn.`
                    : 'Lịch hẹn sẽ được hủy miễn phí.'
                  }
                </span>
              </div>

              <div className={styles.warningInfo}>
                <i className="bi bi-exclamation-triangle"></i>
                <span>Lưu ý: Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ khám.</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelModalBtn}
                onClick={() => setShowCancelDialog(false)}
                disabled={isCancelling}
              >
                Không hủy
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={confirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận hủy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Đánh giá bác sĩ</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowRatingModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Đánh giá cho bác sĩ <strong>{selectedAppointment?.doctorName}</strong></p>
              <div className={styles.ratingSection}>
                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i key={star} className="bi bi-star"></i>
                  ))}
                </div>
                <textarea 
                  placeholder="Nhận xét về bác sĩ..."
                  className={styles.reviewTextarea}
                ></textarea>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelModalBtn}
                onClick={() => setShowRatingModal(false)}
              >
                Hủy
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={() => setShowRatingModal(false)}
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMR Modal */}
      {showEMRModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Hồ sơ bệnh án điện tử (EMR)</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowEMRModal(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.emrContent}>
                <h4>Thông tin cuộc khám</h4>
                <p><strong>Bác sĩ:</strong> {selectedAppointment?.doctorName}</p>
                <p><strong>Ngày khám:</strong> {selectedAppointment?.date}</p>
                <p><strong>Chẩn đoán:</strong> Viêm khớp gối</p>
                <p><strong>Điều trị:</strong> Vật lý trị liệu, thuốc giảm đau</p>
                <p><strong>Ghi chú:</strong> Bệnh nhân cần tái khám sau 2 tuần</p>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelModalBtn}
                onClick={() => setShowEMRModal(false)}
              >
                Đóng
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={() => setShowEMRModal(false)}
              >
                Tải xuống PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <i className="bi bi-clipboard2-pulse"></i>
                Chi tiết lịch hẹn
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowDetailModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Doctor Info Section */}
              <div className={styles.detailSection}>
                <h4>
                  <i className="bi bi-person-circle"></i>
                  Thông tin bác sĩ
                </h4>
                <div className={styles.doctorInfoDetail}>
                  <div className={styles.doctorAvatarLarge}>
                    <img src={selectedAppointment.avatar} alt={selectedAppointment.doctorName} />
                  </div>
                  <div className={styles.doctorTextInfo}>
                    <h5>{selectedAppointment.doctorName}</h5>
                    <p className={styles.doctorTitle}>{selectedAppointment.doctorTitle}</p>
                    {selectedAppointment.specialty && (
                      <span className={styles.specialtyBadge}>
                        <i className="bi bi-star"></i>
                        {selectedAppointment.specialty}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment Info Section */}
              <div className={styles.detailSection}>
                <h4>
                  <i className="bi bi-calendar-check"></i>
                  Thông tin lịch hẹn
                </h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <i className="bi bi-calendar3"></i>
                      Ngày khám
                    </div>
                    <div className={styles.infoValue}>{formatDate(selectedAppointment.date)}</div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <i className="bi bi-clock"></i>
                      Giờ khám
                    </div>
                    <div className={styles.infoValue}>{selectedAppointment.time}</div>
                  </div>
                  
                  {selectedAppointment.room && (
                    <div className={styles.infoItem}>
                      <div className={styles.infoLabel}>
                        <i className="bi bi-geo-alt"></i>
                        Phòng khám
                      </div>
                      <div className={styles.infoValue}>{selectedAppointment.room}</div>
                    </div>
                  )}
                  
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>
                      <i className="bi bi-info-circle"></i>
                      Trạng thái
                    </div>
                    <div className={styles.infoValue}>
                      {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info Section */}
              <div className={styles.detailSection}>
                <h4>
                  <i className="bi bi-credit-card"></i>
                  Thông tin thanh toán
                </h4>
                <div className={styles.paymentInfo}>
                  <div className={styles.paymentRow}>
                    <span>Phí khám:</span>
                    <span className={styles.amount}>{formatCurrency(selectedAppointment.fee)}</span>
                  </div>
                  {selectedAppointment.totalAmount && selectedAppointment.totalAmount !== selectedAppointment.fee && (
                    <>
                      <div className={styles.paymentRow}>
                        <span>Phí nền tảng:</span>
                        <span className={styles.amount}>
                          {formatCurrency((selectedAppointment.totalAmount || 0) - selectedAppointment.fee)}
                        </span>
                      </div>
                      <div className={styles.paymentDivider}></div>
                      <div className={styles.paymentRow}>
                        <span className={styles.totalLabel}>Tổng cộng:</span>
                        <span className={styles.totalAmount}>{formatCurrency(selectedAppointment.totalAmount)}</span>
                      </div>
                    </>
                  )}
                  {selectedAppointment.paymentStatusCode && (
                    <div className={styles.paymentStatus}>
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Trạng thái: {selectedAppointment.paymentStatusCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Info Section (if available) */}
              {selectedAppointment.medicalInfo && (
                <div className={styles.detailSection}>
                  <h4>
                    <i className="bi bi-file-text"></i>
                    Thông tin y tế
                  </h4>
                  <div className={styles.medicalNote}>
                    {selectedAppointment.medicalInfo}
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelModalBtn}
                onClick={() => setShowDetailModal(false)}
              >
                <i className="bi bi-x-circle"></i>
                Đóng
              </button>
              {selectedAppointment.status === 'upcoming' && (
                <button 
                  className={styles.confirmBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailModal(false);
                    handleCancelAppointment(selectedAppointment);
                  }}
                >
                  <i className="bi bi-x-octagon"></i>
                  Hủy lịch hẹn
                </button>
              )}
              {selectedAppointment.status === 'completed' && (
                <button 
                  className={styles.confirmBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailModal(false);
                    handleViewEMR(selectedAppointment);
                  }}
                >
                  <i className="bi bi-file-text"></i>
                  Xem EMR
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
