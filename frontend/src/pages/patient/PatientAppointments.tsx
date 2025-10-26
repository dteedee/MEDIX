import React, { useState, useEffect } from 'react';
import styles from '../../styles/patient/PatientAppointments.module.css';

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
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    specialty: 'all',
    dateRange: 'all',
    doctor: ''
  });

  // Mock data
  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      doctorName: 'Vũ Nam Anh',
      doctorTitle: 'Giáo sư',
      specialty: 'Xương khớp',
      date: '2025-01-15',
      time: '14:00',
      status: 'upcoming',
      room: 'Phòng 201',
      fee: 500000,
      avatar: 'https://ui-avatars.com/api/?name=Vu+Nam+Anh&background=667eea&color=fff'
    },
    {
      id: '2',
      doctorName: 'Phạm Xuân Ẩn',
      doctorTitle: 'Tiến sĩ',
      specialty: 'Tim mạch',
      date: '2025-01-10',
      time: '09:30',
      status: 'completed',
      room: 'Phòng 105',
      fee: 600000,
      avatar: 'https://ui-avatars.com/api/?name=Pham+Xuan+An&background=48bb78&color=fff',
      rating: 5,
      review: 'Bác sĩ rất tận tâm và chuyên nghiệp',
      emrId: 'EMR001'
    },
    {
      id: '3',
      doctorName: 'Hoàng Nam Thuận',
      doctorTitle: 'Thạc sĩ',
      specialty: 'Thần kinh',
      date: '2025-01-05',
      time: '16:00',
      status: 'cancelled',
      room: 'Phòng 302',
      fee: 450000,
      avatar: 'https://ui-avatars.com/api/?name=Hoang+Nam+Thuan&background=f56565&color=fff'
    }
  ]);

  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>(appointments);

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

  const confirmCancel = () => {
    // Handle cancel logic here
    console.log('Cancelling appointment:', selectedAppointment?.id);
    setShowCancelDialog(false);
    setSelectedAppointment(null);
  };

  const handleRateDoctor = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRatingModal(true);
  };

  const handleViewEMR = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowEMRModal(true);
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
            <div key={appointment.id} className={styles.appointmentCard}>
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

              <div className={styles.appointmentActions}>
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
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn hủy lịch khám với <strong>{selectedAppointment?.doctorName}</strong>?</p>
              <div className={styles.refundInfo}>
                <i className="bi bi-info-circle"></i>
                <span>Bạn sẽ được hoàn lại 80% phí khám bệnh: <strong>{formatCurrency((selectedAppointment?.fee || 0) * 0.8)}</strong></span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelModalBtn}
                onClick={() => setShowCancelDialog(false)}
              >
                Không hủy
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={confirmCancel}
              >
                Xác nhận hủy
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
    </div>
  );
};
