import React, { useEffect, useState } from 'react'
import { CmsPageDTO, CreateCmsPageRequest } from '../../types/cmspage.types'
import { cmspageService } from '../../services/cmspageService'

interface Props { page?: CmsPageDTO; onSaved?: () => void; onCancel?: () => void }

export default function CmsPageForm({ page, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(page?.pageTitle ?? '')
  const [slug, setSlug] = useState(page?.pageSlug ?? '')
  const [content, setContent] = useState(page?.pageContent ?? '')
  const [metaTitle, setMetaTitle] = useState(page?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(page?.metaDescription ?? '')
  const [isPublished, setIsPublished] = useState<boolean>(page?.isPublished ?? false)
  // TODO: Replace with actual logged-in user ID from AuthContext when available
  // Use a REAL user ID from your database for development until auth is ready.
  const [authorId, setAuthorId] = useState<string>('1A2C1A65-7B00-415F-8164-4FC3C1054203') // <-- Replace with a valid user ID from your DB
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: CreateCmsPageRequest = {
        pageTitle: title.trim(),
        pageSlug: slug.trim(),
        pageContent: content.trim(),
        metaTitle,
        metaDescription,
        isPublished,
        publishedAt: isPublished ? new Date().toISOString() : undefined,
        authorId
      } as any // Cast to allow undefined for optional fields
      if (page) await cmspageService.update(page.id, payload as any)
      else await cmspageService.create(payload)
      onSaved?.()
    } finally { setSaving(false) }
  }

  // Prefill with latest when editing
  useEffect(() => {
    const load = async () => {
      if (!page?.id) return
      try {
        const full = await cmspageService.get(page.id)
        setTitle(full.pageTitle ?? '')
        setSlug(full.pageSlug ?? '')
        setContent(full.pageContent ?? '')
        setMetaTitle(full.metaTitle ?? '')
        setMetaDescription(full.metaDescription ?? '')
        setIsPublished(Boolean(full.isPublished))
        // best-effort: authorId might be present on API
        // If not, keep the hardcoded one.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiAuthorId = (full as any)?.authorId;
        if (apiAuthorId) setAuthorId(apiAuthorId);
      } catch {
        // ignore
      }
    }
    load()
  }, [page?.id])

  // Auto-generate slug from title if slug is empty
  useEffect(() => {
    if (!slug && title) {
      const generatedSlug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title]);

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <div>
        <label>Title</label><br />
        <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div>
        <label>Slug</label><br />
        <input value={slug} onChange={e => setSlug(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>Content</label><br />
        <textarea value={content} onChange={e => setContent(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>Meta title</label><br />
        <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>Meta description</label><br />
        <input value={metaDescription} onChange={e => setMetaDescription(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} /> Published
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
    </form>
  )
}
