import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import './ArticleReader.css'

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const loadArticle = async () => {
      try {
        const articleData = await articleService.getBySlug(slug); // This will now work
        if (articleData) {
          setArticle(articleData);
        } else {
          setError('Article not found.')
        }
      } catch (err) {
        setError('Failed to load article.')
      } finally {
        setLoading(false)
      }
    }
    loadArticle()
  }, [slug])

  if (loading) return <div className="article-reader-container">Đang tải bài viết...</div>
  if (error) return <div className="article-reader-container">{error}</div>
  if (!article) return null

  return (
    <div className="article-reader-container">
      <article className="article-detail">
        <h1>{article.title}</h1>
        <div className="article-meta">Đăng ngày {new Date(article.publishedAt ?? article.createdAt!).toLocaleDateString()} bởi {article.authorName ?? 'MEDIX'}</div>
        {(article.coverImageUrl || article.thumbnailUrl) && (
          <img
            src={article.coverImageUrl || article.thumbnailUrl}
            alt={article.title}
            className="article-cover-image"
          />
        )}
        <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content ?? '' }} />
      </article>
    </div>
  )
}