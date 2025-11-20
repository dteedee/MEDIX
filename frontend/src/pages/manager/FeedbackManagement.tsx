import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/FeedbackManagement.module.css'

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
  const [filter, setFilter] = useState('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Public: { text: 'Public', class: styles.statusApproved },
      Private: { text: 'Private', class: styles.statusRejected },
      pending: { text: 'Pending', class: styles.statusPending },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`${styles.statusBadge} ${config?.class}`}>{config?.text}</span>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      appointment: { text: 'Appointment', class: styles.categoryAppointment },
      service: { text: 'Service', class: styles.categoryService },
      general: { text: 'General', class: styles.categoryGeneral }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return <span className={`${styles.categoryBadge} ${config?.class}`}>{config?.text || 'General'}</span>;
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (filter === 'all') return true;
    return feedback.status === filter;
  });

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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Phản hồi</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý phản hồi từ bệnh nhân</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.filterSelector}>
            <label>Lọc theo trạng thái:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCard1}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Tổng phản hồi</div>
            <div className={styles.summaryValue}>{feedbacks.length}</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCard2}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Trạng thái Public</div>
            <div className={styles.summaryValue}>{feedbacks.filter(f => f.status === 'Public').length}</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCard3}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Trạng thái Private</div>
            <div className={styles.summaryValue}>{feedbacks.filter(f => f.status === 'Private').length}</div>
          </div>
        </div>
      </div>

      {/* Feedbacks Table */}
      <div className={styles.tableCard}>

        <div className={styles.tableHeader}>
          <h3>Danh sách Phản hồi</h3>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Đánh giá</th>
                <th>Bình luận</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((feedback) => (
                <tr key={feedback.id}>
                  <td>
                    <div className={styles.patientCell}>
                      <span className={styles.patientName}>{feedback.patientName}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.doctorName}>{feedback.doctorName}</span>
                  </td>
                  <td>
                    <div className={styles.ratingCell}>
                      <span className={styles.ratingStars}>{getRatingStars(feedback.rating)}</span>
                      <span className={styles.ratingValue}>{feedback.rating}/5</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.commentCell}>
                      <span className={styles.commentText}>
                        {feedback.comment.length > 50 
                          ? `${feedback.comment.substring(0, 50)}...` 
                          : feedback.comment
                        }
                      </span>
                    </div>
                  </td>
                  <td>{formatDate(feedback.date)}</td>
                  <td>{getStatusBadge(feedback.status)}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      {feedback.status === 'pending' && (
                        <>
                          <button className={styles.approveButton}>
                            Duyệt
                          </button>
                          <button className={styles.rejectButton}>
                            Từ chối
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleViewDetails(feedback)}
                        className={styles.viewButton}
                      >
                        Xem chi tiết
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(feedback)}
                        className={feedback.status === 'Public' ? styles.rejectButton : styles.approveButton}
                      >
                        {feedback.status === 'Public' ? 'Chuyển sang Private' : 'Chuyển sang Public'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailModalOpen && selectedFeedback && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết Phản hồi</h3>
              <button onClick={() => setIsDetailModalOpen(false)} className={styles.closeButton}>×</button>
            </div>
            <div className={styles.modalBody}>
              {/* Thông tin chung */}
              <div className={styles.detailItem}>
                <strong>Bệnh nhân:</strong> {selectedFeedback.patientName}
              </div>
              <div className={styles.detailItem}>
                <strong>Bác sĩ:</strong> {selectedFeedback.doctorName}
              </div>
              <div className={styles.detailItem}>
                <strong>Đánh giá:</strong>
                <span className={styles.ratingStars}>{getRatingStars(selectedFeedback.rating)}</span>
                ({selectedFeedback.rating}/5)
              </div>
              <div className={styles.detailItem}>
                <strong>Bình luận:</strong> {selectedFeedback.comment}
              </div>
              <div className={styles.detailItem}>
                <strong>Ngày viết review:</strong> {formatDate(selectedFeedback.createdAt)}
              </div>
              <hr className={styles.divider} />

              {/* Thông tin cuộc hẹn */}
              <h4>Thông tin cuộc hẹn</h4>
              <div className={styles.detailItem}>
                <strong>Thời gian bắt đầu:</strong> {formatDate(selectedFeedback.appointmentStartTime)}
              </div>
              <div className={styles.detailItem}>
                <strong>Thời gian kết thúc:</strong> {formatDate(selectedFeedback.appointmentEndTime)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
