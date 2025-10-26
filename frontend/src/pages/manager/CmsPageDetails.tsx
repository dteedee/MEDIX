import React from 'react'
import { CmsPageDTO } from '../../types/cmspage.types'
import styles from '../../styles/manager/CmsPageDetails.module.css'

interface Props {
  page: CmsPageDTO | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function CmsPageDetails({ page, isLoading, onClose }: Props) {
  if (!page) return null

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton} title="Đóng">&times;</button>
        <h2 className={styles.title}>Chi tiết Trang</h2>
        {isLoading ? (
          <div className={styles.loading}>Đang tải chi tiết...</div>
        ) : (
          <>
            <div className={styles.metaGrid}>
              <div className={`${styles.metaItem} ${styles.fullWidthItem}`}>
                <span className={styles.label}>Tiêu đề</span>
                <p className={`${styles.value} ${styles.pageTitleValue}`}>{page.pageTitle}</p>
              </div>
              <div className={styles.metaItem}><span className={styles.label}>Đường dẫn (Slug)</span><span className={styles.value}>{page.pageSlug}</span></div>
              <div className={styles.metaItem}><span className={styles.label}>Tác giả</span><span className={styles.value}>{page.authorName}</span></div>
              <div className={styles.metaItem}><span className={styles.label}>Trạng thái</span><span className={styles.value}>{page.isPublished ? 'Đang hoạt động' : 'Nháp'}</span></div>
              <div className={styles.metaItem}><span className={styles.label}>Ngày tạo</span><span className={styles.value}>{fmtDate((page as any).createdAt)}</span></div>
              <div className={styles.metaItem}><span className={styles.label}>Cập nhật lần cuối</span><span className={styles.value}>{fmtDate((page as any).updatedAt)}</span></div>
            </div>
            <div className={styles.contentSection}>
              <h3 className={styles.contentHeader}>Nội dung trang</h3>
              <div className={styles.contentBody} dangerouslySetInnerHTML={{ __html: page.pageContent ?? '<i>Không có nội dung.</i>' }} />
            </div>
            {(page.metaTitle || page.metaDescription) && (
              <div className={styles.contentSection}>
                <h3 className={styles.contentHeader}>Cấu hình SEO</h3>
                <div className={styles.metaItem}>
                  <span className={styles.label}>Meta Title</span>
                  <span className={styles.value}>{page.metaTitle || 'Chưa có'}</span>
                </div>
                <div className={`${styles.metaItem}`} style={{ marginTop: 16 }}>
                  <span className={styles.label}>Meta Description</span>
                  <span className={styles.value}>{page.metaDescription || 'Chưa có'}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
