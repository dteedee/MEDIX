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
    showToast(id ? 'Cập nhật bài viết thành công!' : 'Tạo bài viết thành công!')
    navigate('/manager/articles')
  }
  const handleCancel = () => navigate('/manager/articles')

  if (loading) return <div>Loading...</div>

  return (
    <ArticleForm article={article} onSaved={handleSave} onCancel={handleCancel} />
  )
}