import React from 'react';
import { ArticleDTO } from '../../types/article.types';
import styles from '../../styles/ArticleDetails.module.css';

interface Props {
  article: ArticleDTO | null;
  onClose: () => void;
}

export default function ArticleDetails({ article, onClose }: Props) {
  if (!article) return null;

  // Check if we only have the ID (initial state before full data is loaded)
  const isLoading = !article.title;

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Chi tiết bài viết</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Đang tải chi tiết...</div>
        ) : (
          <div className={styles.contentGrid}>
            {/* Title */}
            <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
              <span className={styles.label}>Tiêu đề</span>
              <p className={`${styles.value} ${styles.titleValue}`}>{article.title}</p>
            </div>

            {/* Images */}
            {(article.thumbnailUrl || article.coverImageUrl) && (
              <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
                <div className={styles.imagesContainer}>
                  {article.thumbnailUrl && (
                    <div className={styles.imageWrapper}>
                      <span className={styles.label}>Ảnh đại diện</span>
                      <img src={article.thumbnailUrl} alt="Ảnh đại diện" className={styles.image} />
                    </div>
                  )}
                  {article.coverImageUrl && (
                    <div className={styles.imageWrapper}>
                      <span className={styles.label}>Ảnh bìa</span>
                      <img src={article.coverImageUrl} alt="Ảnh bìa" className={styles.image} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
              <span className={styles.label}>Tóm tắt</span>
              <p className={`${styles.value} ${styles.summaryValue}`}>{article.summary || 'Không có'}</p>
            </div>

            {/* Slug */}
            <div className={styles.detailItem}>
              <span className={styles.label}>Slug</span>
              <span className={styles.value}>{article.slug || 'N/A'}</span>
            </div>

            {/* Author */}
            <div className={styles.detailItem}>
              <span className={styles.label}>Tên tác giả</span>
              <span className={styles.value}>{article.authorName || 'N/A'}</span>
            </div>

            {/* View & Like Counts */}
            <div className={styles.detailItem}>
              <span className={styles.label}>Lượt xem / Lượt thích</span>
              <span className={styles.value}>{(article as any).viewCount ?? 0} / {(article as any).likeCount ?? 0}</span>
            </div>

           
            <div className={styles.detailItem}>
              <span className={styles.label}>Ngày tạo</span>
              <span className={styles.value}>{fmtDate(article.createdAt)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Cập nhật lần cuối</span>
              <span className={styles.value}>{fmtDate(article.updatedAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}