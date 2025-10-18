import React from 'react';
import { BannerDTO } from '../../types/banner.types';

interface Props {
  banner: BannerDTO | null;
  onClose: () => void;
}

export default function BannerDetails({ banner, onClose }: Props) {
  if (!banner) return null;

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleString('vi-VN') : 'Chưa có';

  // --- Styles ---
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    padding: '24px 28px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 16,
    marginBottom: 24,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#111827',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: '#6b7280',
  };

  const contentGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px 28px',
  };

  const detailItemStyle: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.6,
  };

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

  const fullWidthItem: React.CSSProperties = {
    ...detailItemStyle,
    gridColumn: '1 / -1',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Chi tiết Banner</h2>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>
        <div style={contentGridStyle}>
          <div style={fullWidthItem}>
            <span style={labelStyle}>Tiêu đề</span>
            <p style={{ ...valueStyle, fontSize: 16, fontWeight: 600, margin: 0 }}>{banner.title}</p>
          </div>
          {banner.imageUrl && (
            <div style={fullWidthItem}>
              <span style={labelStyle}>Ảnh banner</span>
              <img src={banner.imageUrl} alt="Banner" style={{ width: '100%', height: 'auto', maxHeight: 300, borderRadius: 8, objectFit: 'contain', border: '1px solid #e5e7eb', marginTop: 4 }} />
            </div>
          )}
          <div style={detailItemStyle}><span style={labelStyle}>Đường dẫn (Link)</span><span style={valueStyle}>{banner.link || 'Không có'}</span></div>
          <div style={detailItemStyle}><span style={labelStyle}>Thứ tự hiển thị</span><span style={valueStyle}>{banner.order ?? 'Không có'}</span></div>
          <div style={detailItemStyle}><span style={labelStyle}>Trạng thái</span><span style={valueStyle}>{banner.isActive ? 'Đang hoạt động' : 'Ngừng'}</span></div>
          <div style={detailItemStyle}><span style={labelStyle}>Ngày tạo</span><span style={valueStyle}>{fmtDate(banner.createdAt)}</span></div>
          <div style={detailItemStyle}><span style={labelStyle}>Ngày bắt đầu</span><span style={valueStyle}>{fmtDate((banner as any).startDate)}</span></div>
          <div style={detailItemStyle}><span style={labelStyle}>Ngày kết thúc</span><span style={valueStyle}>{fmtDate((banner as any).endDate)}</span></div>
        </div>
      </div>
    </div>
  );
}