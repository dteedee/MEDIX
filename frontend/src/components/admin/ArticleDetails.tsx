import React, { useState } from 'react'
import { ArticleDTO } from '../../types/article.types'
import { articleService } from '../../services/articleService'

interface Props {
  article?: ArticleDTO
  onClose?: () => void
}

export default function ArticleDetails({ article, onClose }: Props) {
  if (!article) return null
  const [thumb, setThumb] = useState(article.thumbnailUrl ?? '')
  const fileRef = React.createRef<HTMLInputElement>()

  const onSelect = () => fileRef.current?.click()
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const url = await articleService.uploadImage(f)
      setThumb(url)
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  // --- CSS Styles (inspired by CmsPageDetails & CategoryDetails) ---
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
    maxWidth: 1100,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    position: 'relative',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '32px',
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

  const leftColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  }

  const rightColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #e5e7eb',
    paddingLeft: '32px',
  }

  const thumbContainerStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '16/9',
    background: '#f3f4f6',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    border: '1px dashed #d1d5db',
  }

  const thumbImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }

  const uploadButtonStyle: React.CSSProperties = {
    width: '100%',
    marginTop: 12,
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
  }

  const metaSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }

  const metaItemStyle: React.CSSProperties = {
    fontSize: '14px',
  }

  const metaLabelStyle: React.CSSProperties = {
    display: 'block',
    color: '#6b7280',
    fontWeight: 500,
    marginBottom: '4px',
  }

  const metaValueStyle: React.CSSProperties = {
    color: '#111827',
    lineHeight: 1.5,
  }

  const contentHeaderStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#111827',
    marginTop: 0,
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
  }

  const contentBodyStyle: React.CSSProperties = {
    lineHeight: 1.7,
    color: '#374151',
    flexGrow: 1,
    overflowY: 'auto',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={closeButtonStyle} title="Đóng">&times;</button>

        {/* Left Column */}
        <div style={leftColumnStyle}>
          <div>
            <div style={thumbContainerStyle}>
              {thumb ? <img src={thumb} alt={article.title} style={thumbImageStyle} /> : <span style={{ fontSize: 14, color: '#6b7280' }}>Chưa có ảnh</span>}
            </div>
            <button style={uploadButtonStyle} onClick={onSelect}>Thay đổi ảnh</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
          </div>

          <div style={metaSectionStyle}>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>Tiêu đề</span>
              <div style={{...metaValueStyle, fontWeight: 600, fontSize: '16px'}}>{article.title}</div>
            </div>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>Đường dẫn (Slug)</span>
              <div style={metaValueStyle}>{article.slug}</div>
            </div>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>Chuyên mục</span>
              <div style={metaValueStyle}>{(article.categories ?? []).map(c => c.name).join(', ') || 'Chưa có'}</div>
            </div>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>Tóm tắt</span>
              <div style={metaValueStyle}>{article.summary || 'Không có'}</div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={rightColumnStyle}>
          <h2 style={contentHeaderStyle}>Nội dung chi tiết</h2>
          <div style={contentBodyStyle} dangerouslySetInnerHTML={{ __html: article.content ?? '<p>Không có nội dung.</p>' }} />
        </div>
      </div>
    </div>
  )
}
