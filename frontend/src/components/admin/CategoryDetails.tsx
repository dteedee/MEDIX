import React from 'react'
import { CategoryDTO } from '../../types/category.types'

interface Props { category?: CategoryDTO; onClose?: () => void }

export default function CategoryDetails({ category, onClose }: Props) {
  if (!category) return null

  // --- CSS Styles (inspired by CmsPageDetails) ---
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    zIndex: 1000,
  }

  const containerStyle: React.CSSProperties = {
    background: '#fff',
    padding: '28px',
    borderRadius: 12,
    maxWidth: 600,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    position: 'relative',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#111827',
    marginTop: 0,
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
  }

  const metaGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    fontSize: '14px',
  }

  const metaItemStyle: React.CSSProperties = {
    color: '#4b5563',
    lineHeight: 1.6,
  }

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#9ca3af',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={closeButtonStyle} title="Đóng">&times;</button>
        <h2 style={titleStyle}>{category.name}</h2>
        <div style={metaGridStyle}>
          <div style={metaItemStyle}><strong>Đường dẫn (Slug):</strong> {category.slug}</div>
          <div style={metaItemStyle}><strong>Danh mục cha:</strong> {category.parentName ?? 'Không có'}</div>
          <div style={metaItemStyle}><strong>Trạng thái:</strong> {category.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</div>
          <div style={metaItemStyle}><strong>Mô tả:</strong> {category.description || 'Không có mô tả.'}</div>
        </div>
      </div>
    </div>
  )
}
