import React from 'react';
import { ArticleDTO } from '../../types/article.types';

interface Props {
  article: ArticleDTO | null;
  onClose: () => void;
}

export default function ArticleDetails({ article, onClose }: Props) {
  if (!article) return null;

  // Check if we only have the ID (initial state before full data is loaded)
  const isLoading = !article.title;

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
    maxWidth: '800px',
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
          <h2 style={titleStyle}>Chi tiết bài viết</h2>
          <button onClick={onClose} style={closeButtonStyle}>&times;</button>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>Đang tải chi tiết...</div>
        ) : (
          <div style={contentGridStyle}>
            {/* Title */}
            <div style={fullWidthItem}>
              <span style={labelStyle}>Tiêu đề</span>
              <p style={{ ...valueStyle, fontSize: 16, fontWeight: 600, margin: 0 }}>{article.title}</p>
            </div>

            {/* Images */}
            {(article.thumbnailUrl || article.coverImageUrl) && (
              <div style={fullWidthItem}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {article.thumbnailUrl && (
                    <div style={{ flex: 1 }}>
                      <span style={labelStyle}>Ảnh đại diện</span>
                      <img src={article.thumbnailUrl} alt="Ảnh đại diện" style={{ width: '100%', height: 'auto', maxHeight: 250, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                    </div>
                  )}
                  {article.coverImageUrl && (
                    <div style={{ flex: 1 }}>
                      <span style={labelStyle}>Ảnh bìa</span>
                      <img src={article.coverImageUrl} alt="Ảnh bìa" style={{ width: '100%', height: 'auto', maxHeight: 250, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={fullWidthItem}>
              <span style={labelStyle}>Tóm tắt</span>
              <p style={{ ...valueStyle, margin: 0 }}>{article.summary || 'Không có'}</p>
            </div>

            {/* Slug */}
            <div style={detailItemStyle}>
              <span style={labelStyle}>Slug</span>
              <span style={valueStyle}>{article.slug || 'N/A'}</span>
            </div>

            {/* Author */}
            <div style={detailItemStyle}>
              <span style={labelStyle}>Tên tác giả</span>
              <span style={valueStyle}>{article.authorName || 'N/A'}</span>
            </div>

            {/* View & Like Counts */}
            <div style={detailItemStyle}>
              <span style={labelStyle}>Lượt xem / Lượt thích</span>
              <span style={valueStyle}>{(article as any).viewCount ?? 0} / {(article as any).likeCount ?? 0}</span>
            </div>

           
            <div style={detailItemStyle}>
              <span style={labelStyle}>Ngày tạo</span>
              <span style={valueStyle}>{fmtDate(article.createdAt)}</span>
            </div>
            <div style={detailItemStyle}>
              <span style={labelStyle}>Cập nhật lần cuối</span>
              <span style={valueStyle}>{fmtDate(article.updatedAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}