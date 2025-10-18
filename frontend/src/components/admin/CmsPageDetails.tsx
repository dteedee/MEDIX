import React from 'react'
import { CmsPageDTO } from '../../types/cmspage.types'

interface Props {
  page: CmsPageDTO | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function CmsPageDetails({ page, isLoading, onClose }: Props) {
  if (!page) return null

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';

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
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
    fontSize: '14px',
  }

  const metaItemStyle: React.CSSProperties = {
    color: '#4b5563',
    lineHeight: 1.6,
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#6b7280',
    fontWeight: 500,
    marginBottom: 4,
  };

  const valueStyle: React.CSSProperties = {
    color: '#1f2937',
    wordBreak: 'break-word',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={closeButtonStyle} title="Đóng">&times;</button>
        <h2 style={titleStyle}>Chi tiết Trang</h2>
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>Đang tải chi tiết...</div>
        ) : (
          <>
            <div style={metaGridStyle}>
              <div style={{ ...metaItemStyle, gridColumn: '1 / -1' }}><span style={labelStyle}>Tiêu đề</span><p style={{ ...valueStyle, fontSize: 16, fontWeight: 600, margin: 0 }}>{page.pageTitle}</p></div>
              <div style={metaItemStyle}><span style={labelStyle}>Đường dẫn (Slug)</span><span style={valueStyle}>{page.pageSlug}</span></div>
              <div style={metaItemStyle}><span style={labelStyle}>Tác giả</span><span style={valueStyle}>{page.authorName}</span></div>
              <div style={metaItemStyle}><span style={labelStyle}>Trạng thái</span><span style={valueStyle}>{page.isPublished ? 'Đang hoạt động' : 'Nháp'}</span></div>
              <div style={metaItemStyle}><span style={labelStyle}>Ngày tạo</span><span style={valueStyle}>{fmtDate((page as any).createdAt)}</span></div>
              <div style={metaItemStyle}><span style={labelStyle}>Cập nhật lần cuối</span><span style={valueStyle}>{fmtDate((page as any).updatedAt)}</span></div>
            </div>
            <div style={contentSectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1rem', fontWeight: 600, color: '#374151' }}>Nội dung trang</h3>
              <div style={{ lineHeight: 1.6, color: '#374151', border: '1px solid #e5e7eb', padding: '12px 16px', borderRadius: 8, background: '#f9fafb' }} dangerouslySetInnerHTML={{ __html: page.pageContent ?? '<i>Không có nội dung.</i>' }} />
            </div>
            {(page.metaTitle || page.metaDescription) && (
              <div style={contentSectionStyle}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '1rem', fontWeight: 600, color: '#374151' }}>Cấu hình SEO</h3>
                <div style={metaItemStyle}><span style={labelStyle}>Meta Title</span><span style={valueStyle}>{page.metaTitle || 'Chưa có'}</span></div>
                <div style={{ ...metaItemStyle, marginTop: 16 }}><span style={labelStyle}>Meta Description</span><span style={valueStyle}>{page.metaDescription || 'Chưa có'}</span></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
