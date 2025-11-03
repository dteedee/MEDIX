import React, { useState, useEffect, useMemo } from 'react';
import { reviewService } from '../../services/reviewService';
import { DoctorReview } from '../../types/review.types';
import { PageLoader } from '../../components/ui';
import styles from '../../styles/doctor/DoctorFeedback.module.css';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`bi bi-star-fill ${i < rating ? styles.starFilled : styles.starEmpty}`}
        ></i>
      ))}
    </div>
  );
};

const DoctorFeedback: React.FC = () => {
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const data = await reviewService.getReviewsForCurrentDoctor();
        // Sắp xếp các đánh giá mới nhất lên đầu
        setReviews(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setError(null);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Không thể tải danh sách phản hồi. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <i className="bi bi-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Phản hồi từ bệnh nhân</h1>
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{reviews.length}</span>
            <span className={styles.summaryLabel}>Tổng số đánh giá</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{averageRating} <i className={`bi bi-star-fill ${styles.starFilled}`}></i></span>
            <span className={styles.summaryLabel}>Đánh giá trung bình</span>
          </div>
        </div>
      </div>

      <div className={styles.reviewList}>
        {reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.patientInfo}>
                  <div className={styles.patientAvatar}>
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <span className={styles.patientName}>{review.patientName}</span>
                </div>
                <div className={styles.reviewMeta}>
                  <StarRating rating={review.rating} />
                  <span className={styles.reviewDate}>
                    {new Date(review.appointmentStartTime).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </span>
                  <span className={styles.reviewTime}>
                    <i className="bi bi-clock"></i>
                    {new Date(review.appointmentStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(review.appointmentEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className={styles.reviewBody}>
                {review.comment ? (
                  <p className={styles.comment}>{review.comment}</p>
                ) : (
                  <p className={styles.noComment}>Bệnh nhân không để lại bình luận.</p>
                )}
              </div>
              {review.adminResponse && (
                <div className={styles.adminResponse}>
                  <h4 className={styles.responseTitle}>Phản hồi của Admin</h4>
                  <p className={styles.responseText}>{review.adminResponse}</p>
                </div>
              )}
              {/* <div className={styles.reviewFooter}>
                <button className={styles.replyButton}>
                  <i className="bi bi-reply-fill"></i> Phản hồi
                </button>
              </div> */}
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-chat-dots"></i>
            <p>Chưa có phản hồi nào từ bệnh nhân.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFeedback;
