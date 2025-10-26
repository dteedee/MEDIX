import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/FeedbackManagement.module.css'

interface Feedback {
  id: string;
  patientName: string;
  doctorName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  category: 'appointment' | 'service' | 'general';
}

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadFeedbacks();
  }, [filter]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockFeedbacks: Feedback[] = [
        {
          id: '1',
          patientName: 'Nguyễn Văn A',
          doctorName: 'Phạm Quỳnh Anh',
          rating: 5,
          comment: 'Bác sĩ rất tận tâm và chuyên nghiệp. Tôi rất hài lòng với dịch vụ.',
          date: '2024-01-15T10:30:00Z',
          status: 'approved',
          category: 'appointment'
        },
        {
          id: '2',
          patientName: 'Trần Thị B',
          doctorName: 'Lê Thu Hằng',
          rating: 4,
          comment: 'Dịch vụ tốt nhưng cần cải thiện thời gian chờ đợi.',
          date: '2024-01-14T14:20:00Z',
          status: 'pending',
          category: 'service'
        }
      ];

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Chờ duyệt', class: styles.statusPending },
      approved: { text: 'Đã duyệt', class: styles.statusApproved },
      rejected: { text: 'Đã từ chối', class: styles.statusRejected }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`${styles.statusBadge} ${config.class}`}>{config.text}</span>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      appointment: { text: 'Lịch hẹn', class: styles.categoryAppointment },
      service: { text: 'Dịch vụ', class: styles.categoryService },
      general: { text: 'Chung', class: styles.categoryGeneral }
    };
    
    const config = categoryConfig[category as keyof typeof categoryConfig];
    return <span className={`${styles.categoryBadge} ${config.class}`}>{config.text}</span>;
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
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Chờ duyệt</div>
            <div className={styles.summaryValue}>{feedbacks.filter(f => f.status === 'pending').length}</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCard3}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Đã duyệt</div>
            <div className={styles.summaryValue}>{feedbacks.filter(f => f.status === 'approved').length}</div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCard4}`}>
          <div className={styles.summaryIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Đã từ chối</div>
            <div className={styles.summaryValue}>{feedbacks.filter(f => f.status === 'rejected').length}</div>
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
                <th>Loại</th>
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
                  <td>{getCategoryBadge(feedback.category)}</td>
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
                      <button className={styles.viewButton}>
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
