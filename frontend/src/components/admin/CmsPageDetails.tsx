import React from 'react'
import { CmsPageDTO } from '../../types/cmspage.types'

interface Props { page?: CmsPageDTO; onClose?: () => void }

export default function CmsPageDetails({ page, onClose }: Props) {
  if (!page) return null
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 20, maxWidth: 800, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
        <h2>{page.pageTitle}</h2>
        <div><strong>Slug:</strong> {page.pageSlug}</div>
        <div><strong>Author:</strong> {page.authorName}</div>
        <div><strong>Published:</strong> {page.isPublished ? 'Yes' : 'No'}</div>
        <div style={{ marginTop: 8 }}><strong>Content</strong><div dangerouslySetInnerHTML={{ __html: page.pageContent ?? '' }} /></div>
        <div style={{ marginTop: 8 }}><strong>Meta:</strong> {page.metaTitle} — {page.metaDescription}</div>
        <div style={{ marginTop: 12 }}><button onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}
