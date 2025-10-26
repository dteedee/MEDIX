import React from 'react'
import { CategoryDTO } from '../../types/category.types'
import styles from '../../styles/manager/CategoryDetails.module.css'

interface Props { category?: CategoryDTO; onClose?: () => void }

export default function CategoryDetails({ category, onClose }: Props) {
  if (!category) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton} title="Đóng">&times;</button>
        <h2 className={styles.title}>{category.name}</h2>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}><strong>Đường dẫn (Slug):</strong> {category.slug}</div>
          <div className={styles.metaItem}><strong>Danh mục cha:</strong> {category.parentName ?? 'Không có'}</div>
          <div className={styles.metaItem}>
            <strong>Trạng thái:</strong> 
            <span className={category.isActive ? styles.statusActive : styles.statusInactive}>
              {category.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </span>
          </div>
          <div className={styles.metaItem}><strong>Mô tả:</strong> {category.description || 'Không có mô tả.'}</div>
        </div>
      </div>
    </div>
  )
}
