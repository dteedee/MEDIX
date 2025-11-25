import React, { useState, useEffect, useMemo } from 'react';
import { reviewService } from '../../services/reviewService';
import { DoctorReview } from '../../types/review.types';
import { PageLoader } from '../../components/ui';
import styles from '../../styles/manager/FeedbackManagement.module.css';
import {
  MessageSquare,
  Calendar,
  Star,
  TrendingUp,
  Filter,
  ArrowUpDown,
  Award,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Clock,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

interface DoctorAggregate {
  doctorId: string;
  doctorName: string;
  totalReviews: number;
  averageRating: number;
  latestReview: DoctorReview | null;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(dateString);
};

const getSentiment = (rating: number) => {
  if (rating >= 4) {
    return { text: 'Tích cực', icon: <ThumbsUp size={16} />, className: styles.sentimentPositive };
  }
  if (rating === 3) {
    return { text: 'Góp ý', icon: <Meh size={16} />, className: styles.sentimentNeutral };
  }
  return { text: 'Cần cải thiện', icon: <ThumbsDown size={16} />, className: styles.sentimentNegative };
};

const getAccentClass = (rating: number) => {
  if (rating >= 4) return styles.accentPositive;
  if (rating <= 2) return styles.accentNegative;
  return styles.accentNeutral;
};

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 18 }) => (
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

const RatingDistributionChart: React.FC<{ reviews: DoctorReview[] }> = ({ reviews }) => {
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
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
              ></div>
            </div>
            <span className={styles.barPercentage}>{count}</span>
          </div>
        );
      }).reverse()}
    </div>
  );
};

const DoctorHighlightCard: React.FC<{ variant: 'top' | 'low'; doctor?: DoctorAggregate | null }> = ({
  variant,
  doctor,
}) => {
  const isTop = variant === 'top';
  const label = isTop ? 'Bác sĩ được đánh giá cao nhất' : 'Bác sĩ cần cải thiện';
  return (
    <div
      className={`${styles.doctorHighlightCard} ${
        isTop ? styles.highlightPositive : styles.highlightNegative
      }`}
    >
      <div className={styles.highlightHeader}>
        <div className={styles.highlightIcon}>
          {isTop ? <Award size={22} /> : <AlertTriangle size={22} />}
        </div>
        <div>
          <p className={styles.highlightLabel}>{label}</p>
          <h3 className={styles.highlightTitle}>{doctor ? doctor.doctorName : 'Chưa có dữ liệu'}</h3>
        </div>
      </div>
      {doctor ? (
        <>
          <div className={styles.highlightStats}>
            <div>
              <span className={styles.highlightValue}>{doctor.averageRating.toFixed(1)}</span>
              <span className={styles.highlightSubtext}>Điểm trung bình</span>
            </div>
            <div>
              <span className={styles.highlightValue}>{doctor.totalReviews}</span>
              <span className={styles.highlightSubtext}>Lượt đánh giá</span>
            </div>
          </div>
          {doctor.latestReview && (
            <div className={styles.highlightRecentReview}>
              <p className={styles.highlightRecentLabel}>Nhận xét gần nhất</p>
              <p className={styles.highlightRecentText}>
                {doctor.latestReview.comment || 'Bệnh nhân không để lại bình luận.'}
              </p>
              <span className={styles.highlightRecentMeta}>
                {formatDate(doctor.latestReview.createdAt)}
              </span>
            </div>
          )}
        </>
      ) : (
        <p className={styles.highlightEmpty}>Chưa có dữ liệu để thống kê.</p>
      )}
    </div>
  );
};

const FeedbackManagement: React.FC = () => {
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const data = await reviewService.getAllReviews();
        const sorted = data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReviews(sorted);
        setError(null);
      } catch (err) {
        console.error('Error loading reviews', err);
        setError('Không thể tải danh sách phản hồi. Vui lòng thử lại.');
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
    return {
      excellent: reviews.filter(r => r.rating === 5).length,
      good: reviews.filter(r => r.rating === 4).length,
      average: reviews.filter(r => r.rating === 3).length,
      poor: reviews.filter(r => r.rating === 2).length,
      veryPoor: reviews.filter(r => r.rating === 1).length,
    };
  }, [reviews]);

  const doctorAggregates = useMemo<DoctorAggregate[]>(() => {
    const map = new Map<string, DoctorAggregate>();
    reviews.forEach(review => {
      if (!review.doctorId) {
        return;
      }
      if (!map.has(review.doctorId)) {
        map.set(review.doctorId, {
          doctorId: review.doctorId,
          doctorName: review.doctorName,
          totalReviews: 0,
          averageRating: 0,
          latestReview: null,
        });
      }
      const entry = map.get(review.doctorId)!;
      entry.totalReviews += 1;
      entry.averageRating =
        ((entry.averageRating * (entry.totalReviews - 1)) + review.rating) / entry.totalReviews;
      if (
        !entry.latestReview ||
        new Date(review.createdAt).getTime() > new Date(entry.latestReview.createdAt).getTime()
      ) {
        entry.latestReview = review;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.averageRating - a.averageRating || b.totalReviews - a.totalReviews
    );
  }, [reviews]);

  const topDoctor = doctorAggregates[0] || null;
  const lowestDoctor =
    doctorAggregates.length > 0
      ? [...doctorAggregates]
          .sort((a, b) => a.averageRating - b.averageRating || b.totalReviews - a.totalReviews)[0]
      : null;

  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews;

    if (filterRating > 0) {
      filtered = reviews.filter(r => r.rating === filterRating);
    }

    switch (sortBy) {
      case 'highest':
        return [...filtered].sort(
          (a, b) => b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'lowest':
        return [...filtered].sort(
          (a, b) => a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return [...filtered].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'newest':
      default:
        return [...filtered].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [reviews, filterRating, sortBy]);

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
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <MessageSquare size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Phản hồi từ bệnh nhân</h1>
              <p className={styles.subtitle}>
                Tổng quan tất cả đánh giá và hiệu suất bác sĩ trong hệ thống
              </p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
          <div className={styles.cardHeader}>
            <div
              className={styles.cardIcon}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <Star size={24} color="#fff" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Đánh giá trung bình</h3>
              <p className={styles.cardSubtitle}>Từ {reviews.length} phản hồi</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.ratingDisplay}>
              <span className={styles.ratingValue}>{averageRating.toFixed(1)}</span>
              <span className={styles.ratingMax}>/5.0</span>
            </div>
            <StarRating rating={Math.round(averageRating)} size={22} />
            <div className={styles.ratingTrend}>
              <TrendingUp size={16} />
              <span>Dựa trên dữ liệu mới nhất</span>
            </div>
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryCardSecondary}`}>
          <div className={styles.cardHeader}>
            <div
              className={styles.cardIcon}
              style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}
            >
              <MessageSquare size={24} color="#fff" />
            </div>
            <div className={styles.cardHeaderText}>
              <h3 className={styles.cardTitle}>Tổng số phản hồi</h3>
              <p className={styles.cardSubtitle}>Toàn bộ hệ thống</p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.reviewCountDisplay}>
              <span className={styles.reviewCountValue}>{reviews.length}</span>
              <span className={styles.reviewCountLabel}>phản hồi</span>
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

        <div className={`${styles.summaryCard} ${styles.summaryCardTertiary}`}>
          <div className={styles.cardHeader}>
            <div
              className={styles.cardIcon}
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <TrendingUp size={24} color="#fff" />
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

      <div className={styles.topDoctorsSection}>
        <DoctorHighlightCard variant="top" doctor={topDoctor} />
        <DoctorHighlightCard variant="low" doctor={lowestDoctor} />
      </div>

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
                      {star} <Star size={12} />
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
              onChange={e => setSortBy(e.target.value as SortOption)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="highest">Đánh giá cao nhất</option>
              <option value="lowest">Đánh giá thấp nhất</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.reviewList}>
        {filteredAndSortedReviews.length > 0 ? (
          filteredAndSortedReviews.map((review, index) => {
            const patientName = review.patientName || 'Ẩn danh';
            const avatarSrc =
              review.patientAvatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                patientName
              )}&background=667eea&color=fff&size=128&bold=true`;
            const sentiment = getSentiment(review.rating);
            const accentClass = getAccentClass(review.rating);
            const badgeText =
              review.rating >= 4 ? 'Được khen' : review.rating <= 2 ? 'Cần chú ý' : 'Đánh giá trung lập';

            return (
              <div
                key={review.id}
                className={styles.reviewCard}
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <div className={`${styles.reviewAccent} ${accentClass}`}></div>
                <div className={styles.reviewGlow}></div>
                <span className={styles.reviewIndex}>#{String(index + 1).padStart(2, '0')}</span>

                <div className={styles.reviewMain}>
                  <div className={styles.avatarColumn}>
                    <img
                      src={avatarSrc}
                      alt={patientName}
                      className={styles.patientAvatar}
                      onError={e => {
                        const target = e.currentTarget;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          patientName
                        )}&background=667eea&color=fff&size=128&bold=true`;
                      }}
                    />
                  </div>
                  <div className={styles.reviewContent}>
                    <div className={styles.reviewTopRow}>
                      <div className={styles.patientNameRow}>
                        <span className={styles.patientName}>{patientName}</span>
                        <span className={styles.reviewDate}>
                          {formatRelativeDate(review.createdAt)}
                        </span>
                      </div>
                      <div className={styles.doctorTag}>
                        <Stethoscope size={14} />
                        <span>{review.doctorName}</span>
                      </div>
                    </div>

                    <div className={styles.rowBadges}>
                      <span className={`${styles.sentimentBadge} ${sentiment.className}`}>
                        {sentiment.icon}
                        {sentiment.text}
                      </span>
                      <span className={styles.highlightBadge}>
                        <Sparkles size={14} />
                        {badgeText}
                      </span>
                    </div>

                    <div className={styles.ratingRow}>
                      <StarRating rating={review.rating} size={18} />
                      <span className={styles.ratingNumber}>{review.rating}/5</span>
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
                        <span>
                          Đánh giá: {formatDate(review.createdAt)} {formatTime(review.createdAt)}
                        </span>
                      </div>
                      <span className={styles.metaDivider}>|</span>
                      <div className={styles.metaItem}>
                        <Clock size={14} />
                        <span>
                          Cuộc hẹn: {formatTime(review.appointmentStartTime)} -{' '}
                          {formatDate(review.appointmentStartTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <MessageSquare size={64} />
            </div>
            <h3 className={styles.emptyStateTitle}>Chưa có phản hồi phù hợp</h3>
            <p className={styles.emptyStateText}>
              {filterRating > 0
                ? `Không tìm thấy đánh giá ${filterRating} sao nào phù hợp với tiêu chí hiện tại.`
                : 'Chưa có bệnh nhân nào để lại phản hồi trong hệ thống.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;
