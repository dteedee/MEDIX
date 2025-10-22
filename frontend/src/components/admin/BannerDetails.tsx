import React from 'react';
import { BannerDTO } from '../../types/banner.types';
import styles from '../../styles/BannerDetails.module.css';

interface Props {
  banner: BannerDTO | null;
  onClose: () => void;
}

export default function BannerDetails({ banner, onClose }: Props) {
  if (!banner) return null;

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Chi tiết Banner</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.contentGrid}>
          <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
            <span className={styles.label}>Tiêu đề</span>
            <p className={`${styles.value} ${styles.bannerTitleValue}`}>{banner.bannerTitle}</p>
          </div>
          {banner.bannerImageUrl && (
            <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
              <span className={styles.label}>Ảnh banner</span>
              <img src={banner.bannerImageUrl} alt="Banner" className={styles.bannerImage} />
            </div>
          )}
          <div className={styles.detailItem}><span className={styles.label}>Đường dẫn (Link)</span><span className={styles.value}>{banner.bannerUrl || 'Không có'}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Thứ tự hiển thị</span><span className={styles.value}>{banner.displayOrder ?? 'Không có'}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Trạng thái</span><span className={`${styles.value} ${banner.isActive ? styles.statusActive : styles.statusInactive}`}>{banner.isActive ? 'Đang hoạt động' : 'Ngừng'}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Ngày tạo</span><span className={styles.value}>{fmtDate(banner.createdAt)}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Ngày bắt đầu</span><span className={styles.value}>{fmtDate(banner.startDate)}</span></div>
          <div className={styles.detailItem}><span className={styles.label}>Ngày kết thúc</span><span className={styles.value}>{fmtDate(banner.endDate)}</span></div>
        </div>
      </div>
    </div>
  );
}