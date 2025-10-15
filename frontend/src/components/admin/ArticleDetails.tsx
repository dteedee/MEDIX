import React, { useState } from 'react'
import { ArticleDTO } from '../../types/article.types'
import './ArticleDetails.css'
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
  return (
    <div className="ad-overlay">
      <div className="ad-container">
        <div className="ad-left">
          <div className="ad-thumb">
            {thumb ? <img src={thumb} alt={article.title} /> : <div className="ad-thumb-placeholder">No image</div>}
            <button className="ad-upload" onClick={onSelect}>Upload image</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
          </div>

          <div className="ad-meta">
            <div className="ad-meta-item">
              <div className="ad-meta-label">Tiêu đề</div>
              <div className="ad-meta-value title">{article.title}</div>
            </div>
            <div className="ad-meta-item">
              <div className="ad-meta-label">Đường dẫn</div>
              <div className="ad-meta-value">{article.slug}</div>
            </div>
            <div className="ad-meta-item">
              <div className="ad-meta-label">Chuyên mục</div>
              <div className="ad-meta-value">{(article.categories ?? []).map(c => c.name).join(', ') || '-'}</div>
            </div>
            <div className="ad-meta-item">
              <div className="ad-meta-label">Mô tả</div>
              <div className="ad-meta-value">{article.summary}</div>
            </div>
          </div>
        </div>

        <div className="ad-right">
          <div className="ad-right-header">
            <div>
              <strong>Nội dung</strong>
            </div>
            <div className="ad-right-controls">
              <button className="ctrl">A</button>
              <button className="ctrl">B</button>
              <button className="ctrl">I</button>
            </div>
          </div>
          <div className="ad-content" dangerouslySetInnerHTML={{ __html: article.content ?? '' }} />
        </div>

        <button className="ad-close" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
