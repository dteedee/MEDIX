import React, { useState, useEffect, useMemo } from 'react';
import { reviewService } from '../../services/reviewService';
import { DoctorReview } from '../../types/review.types';
import { PageLoader, LoadingSpinner } from '../../components/ui';
import styles from '../../styles/doctor/DoctorFeedback.module.css';
import { useAuth } from '../../contexts/AuthContext';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Meh, Calendar, Clock, TrendingUp, Filter, ArrowUpDown } from 'lucide-react';

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 18 }) => {
  return (
    <div className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`bi bi-star-fill ${i < rating ? styles.starFilled : styles.starEmpty}`}
          style={{ fontSize: `${size}px` }}
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
            <div className={styles.barLabelGroup}>
              <span className={styles.barLabel}>{starCount}</span>
              <Star size={14} className={styles.barStarIcon} />
            </div>
            <div className={styles.barContainer}>
              <div 
                className={styles.bar} 
                style={{ width: `${percentage}%` }}
                data-percentage={percentage.toFixed(0)}
              ></div>
            </div>
            <span className={styles.barPercentage}>{count}</span>
          </div>
        );
      }).reverse()}
    </div>
  );
};

const normalizeAdminResponse = (response?: string | null) => {
  if (!response) return null;
  const trimmed = response.trim();
  if (/^thanks for your feedback!?$/i.test(trimmed)) {
    return 'Cảm ơn bạn đã chia sẻ phản hồi với MEDIX!';
  }
  return response;
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
        // Chỉ giữ các đánh giá đã xuất bản (bao gồm mọi biến thể chữ hoa/thường)
        const publicReviews = data.filter(review => {
          const status = review.status?.toUpperCase();
          return status === 'PUBLIC' || status === 'PUBLISHED' || status === 'APPROVED';
        });
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
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const ratingStats = useMemo(() => {
    const stats = {
      excellent: reviews.filter(r => r.rating === 5).length,
      good: reviews.filter(r => r.rating === 4).length,
      average: reviews.filter(r => r.rating === 3).length,
      poor: reviews.filter(r => r.rating === 2).length,
      veryPoor: reviews.filter(r => r.rating === 1).length,
    };
    return stats;
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
      return { text: 'Tích cực', icon: <ThumbsUp size={16} />, className: styles.sentimentPositive };
    }
    if (rating === 3) {
      return { text: 'Góp ý', icon: <Meh size={16} />, className: styles.sentimentNeutral };
    }
    return { text: 'Cần cải thiện', icon: <ThumbsDown size={16} />, className: styles.sentimentNegative };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hôm nay';
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return formatDate(dateString);
    }
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
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <MessageSquare size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Phản hồi từ bệnh nhân</h1>
              <p className={styles.subtitle}>Xem và quản lý đánh giá từ bệnh nhân của bạn</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>{new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className={styles.summaryGrid}>
        {/* Average Rating Card */}
        <div className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Star size={24} fill="white" color="white" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Đánh giá trung bình</h3>
              <p className={styles.cardSubtitle}>Từ {reviews.length} đánh giá</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.ratingDisplay}>
              <span className={styles.ratingValue}>{averageRating.toFixed(1)}</span>
              <span className={styles.ratingMax}>/5.0</span>
            </div>
            <StarRating rating={Math.round(averageRating)} size={24} />
            <div className={styles.ratingTrend}>
              <TrendingUp size={16} />
              <span>Dựa trên {reviews.length} đánh giá</span>
            </div>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className={`${styles.summaryCard} ${styles.summaryCardSecondary}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
              <MessageSquare size={24} fill="white" color="white" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Tổng số đánh giá</h3>
              <p className={styles.cardSubtitle}>Tất cả phản hồi</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.reviewCountDisplay}>
              <span className={styles.reviewCountValue}>{reviews.length}</span>
              <span className={styles.reviewCountLabel}>đánh giá</span>
            </div>
            <div className={styles.reviewBreakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Xuất sắc (5⭐)</span>
                <span className={styles.breakdownValue}>{ratingStats.excellent}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownLabel}>Tốt (4⭐)</span>
                <span className={styles.breakdownValue}>{ratingStats.good}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Distribution Card */}
        <div className={`${styles.summaryCard} ${styles.summaryCardTertiary}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <TrendingUp size={24} fill="white" color="white" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Phân bổ đánh giá</h3>
              <p className={styles.cardSubtitle}>Chi tiết theo sao</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <RatingDistributionChart reviews={reviews} />
          </div>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.filterGroup}>
            <Filter size={18} className={styles.toolbarIcon} />
            <span className={styles.toolbarLabel}>Lọc theo:</span>
            <div className={styles.filterButtons}>
              {[0, 5, 4, 3, 2, 1].map(star => (
                <button
                  key={star}
                  className={`${styles.filterButton} ${filterRating === star ? styles.active : ''}`}
                  onClick={() => setFilterRating(star)}
                >
                  {star === 0 ? (
                    <>Tất cả</>
                  ) : (
                    <>
                      {star} <Star size={14} fill={filterRating === star ? 'currentColor' : 'none'} />
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.sortGroup}>
            <ArrowUpDown size={18} className={styles.toolbarIcon} />
            <span className={styles.toolbarLabel}>Sắp xếp:</span>
            <select 
              className={styles.sortDropdown} 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Đánh giá cao nhất</option>
              <option value="lowest">Đánh giá thấp nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className={styles.reviewList}>
        {filteredAndSortedReviews.length > 0 ? (
          filteredAndSortedReviews.map((review, index) => {
            const localizedAdminResponse = normalizeAdminResponse(review.adminResponse);
            const patientName = review.patientName || 'Ẩn danh';
            const avatarSrc = review.patientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=667eea&color=fff&size=128&bold=true`;
            return (
            <div 
              key={review.id} 
              className={styles.reviewCard}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={styles.reviewMain}>
                <div className={styles.avatarColumn}>
                  <img 
                    src={avatarSrc} 
                    alt={patientName} 
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=667eea&color=fff&size=128&bold=true`;
                    }}
                    className={styles.patientAvatar} 
                  />
                </div>
                <div className={styles.reviewContent}>
                  <div className={styles.reviewTopRow}>
                    <div>
                      <div className={styles.patientNameRow}>
                        <span className={styles.patientName}>{patientName}</span>
                        <span className={styles.reviewDate}>{formatDateTime(review.createdAt)}</span>
                      </div>
                      <div className={styles.ratingRow}>
                        <StarRating rating={review.rating} size={18} />
                        <span className={styles.ratingNumber}>{review.rating}/5</span>
                      </div>
                    </div>
                  </div>

                  {review.comment ? (
                    <p className={styles.comment}>{review.comment}</p>
                  ) : (
                    <p className={styles.noComment}>
                      <i className="bi bi-info-circle"></i>
                      Bệnh nhân không để lại bình luận.
                    </p>
                  )}

                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                      <Calendar size={14} />
                      <span>Đánh giá: {formatDate(review.createdAt)} {formatTime(review.createdAt)}</span>
                    </div>
                    <span className={styles.metaDivider}>|</span>
                    <div className={styles.metaItem}>
                      <Clock size={14} />
                      <span>Cuộc hẹn: {formatTime(review.appointmentStartTime)} - {formatDate(review.appointmentStartTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {localizedAdminResponse && (
                <div className={styles.adminResponseBlock}>
                  <span className={styles.adminLabel}>Phản hồi từ MEDIX</span>
                  <p className={styles.responseText}>{localizedAdminResponse}</p>
                </div>
              )}
            </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <MessageSquare size={64} />
            </div>
            <h3 className={styles.emptyStateTitle}>Chưa có phản hồi nào</h3>
            <p className={styles.emptyStateText}>
              {filterRating > 0 
                ? `Không tìm thấy đánh giá ${filterRating} sao nào phù hợp với tiêu chí.`
                : 'Chưa có bệnh nhân nào để lại đánh giá cho bạn.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFeedback;
