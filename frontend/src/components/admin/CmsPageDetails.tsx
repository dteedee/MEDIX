import React from 'react'
import { CmsPageDTO } from '../../types/cmspage.types'

interface Props { page?: CmsPageDTO; onClose?: () => void }

export default function CmsPageDetails({ page, onClose }: Props) {
  if (!page) return null

  // --- CSS Styles ---
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
    maxWidth: 800,
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    fontSize: '14px',
  }

  const metaItemStyle: React.CSSProperties = {
    color: '#4b5563',
  }

  const contentSectionStyle: React.CSSProperties = {
    marginTop: '24px',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '24px',
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
        <h2 style={titleStyle}>{page.pageTitle}</h2>
        <div style={metaGridStyle}>
          <div style={metaItemStyle}><strong>Đường dẫn:</strong> {page.pageSlug}</div>
          <div style={metaItemStyle}><strong>Tác giả:</strong> {page.authorName}</div>
          <div style={metaItemStyle}><strong>Trạng thái:</strong> {page.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</div>
        </div>
        <div style={contentSectionStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1rem', fontWeight: 600, color: '#374151' }}>Nội dung trang</h3>
          <div style={{ lineHeight: 1.6, color: '#374151' }} dangerouslySetInnerHTML={{ __html: page.pageContent ?? '' }} />
        </div>
        {(page.metaTitle || page.metaDescription) && (
          <div style={contentSectionStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1rem', fontWeight: 600, color: '#374151' }}>Cấu hình SEO</h3>
            <div style={metaItemStyle}><strong>Meta Title:</strong> {page.metaTitle || 'Chưa có'}</div>
            <div style={{ ...metaItemStyle, marginTop: 8 }}><strong>Meta Description:</strong> {page.metaDescription || 'Chưa có'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
