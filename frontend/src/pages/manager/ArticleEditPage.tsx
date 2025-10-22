import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ArticleForm from '../../components/admin/ArticleForm'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import { useToast } from '../../contexts/ToastContext'

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<ArticleDTO | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    if (id) {
      articleService.get(id)
        .then(setArticle)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id])

  const handleSave = () => {
    navigate('/manager/articles')
  }
  const handleCancel = () => navigate('/manager/articles')

  if (loading) return <div>Loading...</div>

  const title = id ? 'Chỉnh sửa Bài viết' : 'Tạo Bài viết mới'

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{title}</h1>
      </div>
      <ArticleForm article={article} onSaved={handleSave} onCancel={handleCancel} />
    </div>
  )
}