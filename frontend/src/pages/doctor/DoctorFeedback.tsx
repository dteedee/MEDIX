import React, { useState, useEffect, useMemo } from 'react';
import { reviewService } from '../../services/reviewService';
import { DoctorReview } from '../../types/review.types';
import { PageLoader, LoadingSpinner } from '../../components/ui';
import styles from '../../styles/doctor/DoctorFeedback.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
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

const RatingDistributionChart: React.FC<{ reviews: DoctorReview[] }> = ({ reviews }) => {
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // [1 star, 2 stars, ..., 5 stars]
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        counts[review.rating - 1]++;
      }
    });
    return counts;
  }, [reviews]);

  const totalReviews = reviews.length;
  if (totalReviews === 0) return null;

  return (
    <div className={styles.ratingDistribution}>
      {distribution.map((count, index) => {
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        const starCount = index + 1;
        return (
          <div key={index} className={styles.barRow}>
            <span className={styles.barLabel}>{starCount} sao</span>
            <div className={styles.barContainer}>
              <div className={styles.bar} style={{ width: `${percentage}%` }}></div>
            </div>
            <span className={styles.barPercentage}>{percentage.toFixed(0)}%</span>
          </div>
        );
      }).reverse()}
    </div>
  );
};

const DoctorFeedback: React.FC = () => {
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [filterRating, setFilterRating] = useState(0); // 0 for all
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const data = await reviewService.getReviewsForCurrentDoctor();
        // Lọc chỉ những review có status là 'Public'
        const publicReviews = data.filter(review => review.status === 'Public');
        // Sắp xếp các đánh giá mới nhất lên đầu
        setReviews(publicReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
    if (reviews.length === 0) return '0.0';
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews;

    if (filterRating > 0) {
      filtered = reviews.filter(r => r.rating === filterRating);
    }

    switch (sortBy) {
      case 'highest':
        return [...filtered].sort((a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'lowest':
        return [...filtered].sort((a, b) => a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'newest':
      default:
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [reviews, filterRating, sortBy]);

  const getSentiment = (rating: number) => {
    if (rating >= 4) {
      return { text: 'Tích cực', icon: <ThumbsUp size={14} />, className: styles.sentimentPositive };
    }
    if (rating === 3) {
      return { text: 'Góp ý', icon: <Meh size={14} />, className: styles.sentimentNeutral };
    }
    return { text: 'Cần cải thiện', icon: <ThumbsDown size={14} />, className: styles.sentimentNegative };
  };

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
        <h1>Bảng điều khiển Phản hồi</h1>
        <p>Phân tích và quản lý đánh giá từ bệnh nhân cho bác sĩ <strong>{user?.fullName}</strong>.</p>
      </div>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardLarge}`}>
          <h3>Tổng quan đánh giá</h3>
          <div className={styles.overviewStats}>
            <div className={styles.overviewItem}>
              <span className={styles.overviewValue}>{averageRating}</span>
              <StarRating rating={parseFloat(averageRating)} />
              <span className={styles.overviewLabel}>Đánh giá trung bình</span>
            </div>
            <div className={styles.overviewItem}>
              <span className={styles.overviewValue}>{reviews.length}</span>
              <div className={styles.overviewIcon}><MessageSquare /></div>
              <span className={styles.overviewLabel}>Tổng số lượt</span>
            </div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <h3>Phân bổ đánh giá</h3>
          <RatingDistributionChart reviews={reviews} />
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <span className={styles.toolbarLabel}>Lọc theo:</span>
          <div className={styles.filterButtons}>
            {[0, 5, 4, 3, 2, 1].map(star => (
              <button
                key={star}
                className={`${styles.filterButton} ${filterRating === star ? styles.active : ''}`}
                onClick={() => setFilterRating(star)}
              >
                {star === 0 ? 'Tất cả' : <>{star} <Star size={14} /></>}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.sortGroup}>
          <span className={styles.toolbarLabel}>Sắp xếp:</span>
          <select className={styles.sortDropdown} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>

      <div className={styles.reviewList}>
        {filteredAndSortedReviews.length > 0 ? (
          filteredAndSortedReviews.map(review => {
            const sentiment = getSentiment(review.rating);
            return (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.appointmentTimeHeader}>
                  <span>
                    Lịch hẹn: {new Date(review.appointmentStartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(review.appointmentEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    Ngày: {new Date(review.appointmentStartTime).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className={styles.reviewHeader}>
                  <div className={styles.patientInfo}>
                    <img src={`https://ui-avatars.com/api/?name=${review.patientName.replace(/\s/g, "+")}&background=random`} alt={review.patientName} className={styles.patientAvatar} />
                    <span className={styles.patientName}>{review.patientName}</span>
                  </div>
                  <div className={styles.reviewMeta}>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <div className={styles.reviewBody}>
                  <div className={` ${sentiment.className}`}>
                    {sentiment.icon} {sentiment.text}
                  </div>
                  {review.comment ? (
                    <p className={styles.comment}>{review.comment}</p>
                  ) : (
                    <p className={styles.noComment}>Bệnh nhân không để lại bình luận.</p>
                  )}
                </div>
                {review.adminResponse && (
                  <div className={styles.adminResponse}>
                    <h4 className={styles.responseTitle}>Phản hồi của Admin</h4>
                    <p>{review.adminResponse}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-chat-dots"></i>
            <p>Không tìm thấy phản hồi nào phù hợp với tiêu chí.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFeedback;
