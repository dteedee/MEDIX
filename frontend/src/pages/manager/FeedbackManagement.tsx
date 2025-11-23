import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/admin/ArticleManagement.module.css'


interface Feedback {
  id: string;
  patientName: string;
  doctorName: string;
  rating: number;
  comment: string;
  appointmentId: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  date: string;
  createdAt: string;
  status: 'Public' | 'Private' | 'pending';
  adminResponse: string | null;
}

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Feedback; direction: 'ascending' | 'descending' } | null>({ key: 'createdAt', direction: 'descending' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [filters, setFilters] = useState({
    rating: 'all',
    startDate: '',
    endDate: '',
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    const API_URL = 'http://localhost:5123/api/Review';
    setLoading(true);
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const mockFeedbacks: Feedback[] = data.map((item: any) => ({
        ...item,
        date: item.createdAt, // Using createdAt for the date field
      }));

      setTimeout(() => {
        setFeedbacks(mockFeedbacks);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      showToast('Không thể tải dữ liệu phản hồi', 'error');
      setLoading(false);
    }
  };

  const handleToggleStatus = async (feedback: Feedback) => {
    // API để đổi trạng thái là http://localhost:5123/api/Review/status
    // Sửa logic: Nếu là 'Public' thì chuyển thành 'Private', ngược lại chuyển thành 'Public'
    const newStatus = feedback.status === 'Public' ? 'Private' : 'Public';
    const API_URL = `http://localhost:5123/api/Review/status`;

    try {
      const response = await fetch(API_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        // Sửa payload: Gửi đúng `reviewId` và status viết hoa chữ cái đầu theo yêu cầu.
        body: JSON.stringify({
          reviewId: feedback.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showToast('Cập nhật trạng thái thành công!', 'success');
      loadFeedbacks(); // Tải lại danh sách phản hồi để cập nhật UI
    } catch (error) {
      console.error('Error updating feedback status:', error);
      showToast('Không thể cập nhật trạng thái', 'error');
    }
  };

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Public: { text: 'Công khai', class: styles.statusActive, icon: 'bi-check-circle-fill' },
      Private: { text: 'Riêng tư', class: styles.statusLocked, icon: 'bi-pause-circle-fill' },
      pending: { text: 'Đang chờ', class: styles.statusArchived, icon: 'bi-clock-fill' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    return (
      <span className={`${styles.statusBadge} ${config.class}`}>
        <i className={`bi ${config.icon}`}></i>
        {config.text}
      </span>
    );
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(feedback => {
      // Lọc theo đánh giá
      if (filters.rating !== 'all' && feedback.rating !== parseInt(filters.rating, 10)) {
        return false;
      }
      // Lọc theo ngày
      const feedbackDate = new Date(feedback.date);
      if (filters.startDate) {
        if (feedbackDate < new Date(filters.startDate)) {
          return false;
        }
      }
      if (filters.endDate) {
        if (feedbackDate > new Date(new Date(filters.endDate).setHours(23, 59, 59, 999))) {
          return false;
        }
      }
      return true;
    });
  }, [feedbacks, filters]);

  const sortedFeedbacks = useMemo(() => {
    let sortableItems = [...filteredFeedbacks];
    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      sortableItems.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        // Xử lý trường hợp giá trị có thể là null hoặc undefined để an toàn
        if (valA == null) return 1;
        if (valB == null) return -1;

        if (valA < valB) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredFeedbacks, sortConfig]);

  // Pagination: reset page when filters/sorting/data change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig, feedbacks]);

  const totalPages = Math.max(1, Math.ceil(sortedFeedbacks.length / itemsPerPage));

  const paginatedFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedFeedbacks.slice(start, start + itemsPerPage);
  }, [sortedFeedbacks, currentPage, itemsPerPage]);

  const requestSort = (key: keyof Feedback) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Feedback) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return <i className={`bi bi-arrow-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>;
  };

  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) {
      return 0;
    }
    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    return (totalRating / feedbacks.length).toFixed(1);
  }, [feedbacks]);


  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu phản hồi...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Phản hồi</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý phản hồi từ bệnh nhân</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-chat-dots-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng phản hồi</div>
            <div className={styles.statValue}>{feedbacks.length}</div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-chat-dots-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-star-half"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đánh giá trung bình</div>
            <div className={styles.statValue}>{averageRating} / 5</div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-star-half"></i>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm phản hồi..."
            className={styles.searchInput}
            disabled
          />
        </div>
        <button
          className={`${styles.btnFilter} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}>
          <i className="bi bi-funnel"></i>
          Bộ lọc
          {(filters.rating !== 'all' || filters.startDate || filters.endDate) && <span className={styles.filterBadge}></span>}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label><i className="bi bi-star"></i> Đánh giá</label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              >
                <option value="all">Tất cả đánh giá</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>
            <div className={styles.filterItem}>
              <label><i className="bi bi-calendar-range"></i> Từ ngày</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className={styles.filterItem}>
              <label><i className="bi bi-calendar-range-fill"></i> Đến ngày</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.filterActions}>
            <button onClick={() => {
              setFilters({
                rating: 'all',
                startDate: '',
                endDate: '',
              });
              setShowFilters(false);
            }} className={styles.btnResetFilter}>
              <i className="bi bi-arrow-counterclockwise"></i> Đặt lại
            </button>
            <button onClick={() => setShowFilters(false)} className={styles.btnApplyFilter} disabled>
              <i className="bi bi-check2"></i> Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Feedbacks Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>STT</th>
                <th onClick={() => requestSort('patientName')} className={styles.sortable}>Bệnh nhân {getSortIcon('patientName')}</th>
                <th onClick={() => requestSort('doctorName')} className={styles.sortable}>Bác sĩ {getSortIcon('doctorName')}</th>
                <th onClick={() => requestSort('rating')} className={styles.sortable}>Đánh giá {getSortIcon('rating')}</th>
                <th>Bình luận</th>
                <th onClick={() => requestSort('date')} className={styles.sortable}>Ngày {getSortIcon('date')}</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFeedbacks.map((feedback, index) => (
                <tr key={feedback.id} className={styles.tableRow}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#6b7280', textAlign: 'center' }}>{(currentPage - 1) * itemsPerPage + index + 1}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{feedback.patientName}</div>
                  </td>
                  <td>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{feedback.doctorName}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#fbbf24', fontSize: '14px' }}>{getRatingStars(feedback.rating)}</span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{feedback.rating}/5</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '250px', color: '#6b7280', lineHeight: '1.4' }}>
                      {feedback.comment.length > 50 
                        ? `${feedback.comment.substring(0, 50)}...` 
                        : feedback.comment
                      }
                    </div>
                  </td>
                  <td>{formatDate(feedback.date)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actions} style={{ flexWrap: 'wrap', gap: '8px' }}>
                      {feedback.status === 'pending' && (
                        <>
                          <button 
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              background: '#10b981',
                              color: '#fff',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                          >
                            Duyệt
                          </button>
                          <button 
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              background: '#ef4444',
                              color: '#fff',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleViewDetails(feedback)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          color: '#4a5568',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className={styles.pagination} style={{ alignItems: 'center' }}>
          <div className={styles.paginationInfo}>
            Hiển thị {sortedFeedbacks.length === 0 ? 0 : ( (currentPage - 1) * itemsPerPage + 1 )} - {Math.min(currentPage * itemsPerPage, sortedFeedbacks.length)} trên {sortedFeedbacks.length} phản hồi
          </div>
          <div className={styles.paginationControls}>
            <div className={styles.paginationButtons}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="first"
              >
                <i className="bi bi-chevron-bar-left"></i>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="prev"
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              <div className={styles.pageIndicator} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Trang</span>
                <strong>{currentPage}</strong>
                <span> / {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="next"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="last"
              >
                <i className="bi bi-chevron-bar-right"></i>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: '#6b7280' }}>Hiển thị</label>
              <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: 8, borderRadius: 8 }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      </div>

      {isDetailModalOpen && selectedFeedback && (
        <div className={styles['neo-ui-overlay']}>
          <div className={styles['neo-ui-dialog']}>

            {/* Header */}
            <div className={styles['neo-ui-header']}>
              <h3 className={styles['neo-ui-header-title']}>Chi tiết Phản hồi</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className={styles['neo-ui-close-btn']}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className={styles['neo-ui-content']}>

              {/* Thông tin chung */}
              <div className={styles['neo-ui-grid']}>
                <div className={styles['neo-ui-field']}>
                  <strong><i className="bi bi-person"></i> Bệnh nhân:</strong>
                  <span>{selectedFeedback.patientName}</span>
                </div>

                <div className={styles['neo-ui-field']}>
                  <strong><i className="bi bi-person-badge"></i> Bác sĩ:</strong>
                  <span>{selectedFeedback.doctorName}</span>
                </div>

                <div className={styles['neo-ui-field']}>
                  <strong><i className="bi bi-star-half"></i> Đánh giá:</strong>
                  <span>
                    <span className={styles['neo-ui-stars']}>
                      {getRatingStars(selectedFeedback.rating)}
                    </span>
                    ({selectedFeedback.rating}/5)
                  </span>
                </div>

                <div className={styles['neo-ui-field']}>
                  <strong><i className="bi bi-calendar-event"></i> Ngày viết:</strong>
                  <span>{formatDate(selectedFeedback.createdAt)}</span>
                </div>
              </div>

              {/* Bình luận */}
              <div className={`${styles['neo-ui-field']} ${styles['neo-ui-comment-box']}`}>
                <strong><i className="bi bi-chat-dots"></i> Bình luận:</strong>
                <p>{selectedFeedback.comment}</p>
              </div>

              <hr className={styles['neo-ui-line']} />

              {/* Section */}
              <h4 className={styles['neo-ui-section-label']}>
                <i className="bi bi-calendar-check"></i> Thông tin cuộc hẹn
              </h4>

              <div className={styles['neo-ui-field']}>
                <strong><i className="bi bi-clock"></i> Thời gian:</strong>
                <span className={styles['neo-ui-time']}>
                  {new Date(selectedFeedback.appointmentStartTime).toLocaleDateString("vi-VN")}
                  ({formatTime(selectedFeedback.appointmentStartTime)} - {formatTime(selectedFeedback.appointmentEndTime)})
                </span>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
