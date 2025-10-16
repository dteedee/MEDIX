import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import './ArticleReader.css'

export default function ArticleReaderPage() {
  const [articles, setArticles] = useState<ArticleDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10) // 1 featured + 9 grid items
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true)
      try {
        // Fetch only published articles
        const response = await articleService.list(page, pageSize, 'PUBLISHED')
        setArticles(response.items)
        setTotal(response.total ?? 0)
      } catch (error) {
        console.error("Failed to load articles", error)
      } finally {
        setLoading(false)
      }
    }
    loadArticles()
  }, [page, pageSize])

  if (loading) return <div className="article-reader-container">Đang tải...</div>

  const featuredArticle = articles[0]
  const otherArticles = articles.slice(1, pageSize)
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="article-reader-container">
      <h1 className="reader-main-title">Kiến Thức Y Khoa</h1>

      {featuredArticle && (
        <Link to={`/articles/${featuredArticle.slug}`} className="featured-article-link">
          <div className="featured-article">
            <img src={featuredArticle.coverImageUrl || featuredArticle.thumbnailUrl} alt={featuredArticle.title} />
            <div className="featured-content">
              <h2>{featuredArticle.title}</h2>
              <p>{featuredArticle.summary}</p>
            </div>
          </div>
        </Link>
      )}

      <div className="article-grid">
        {otherArticles.map(article => (
          <Link key={article.id} to={`/articles/${article.slug}`} className="article-card-link">
            <div className="article-card">
              <img src={article.thumbnailUrl || '/images/placeholder.png'} alt={article.title} />
              <h3>{article.title}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="pagination-controls">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
          Trang trước
        </button>
        <span>Trang {page} / {totalPages > 0 ? totalPages : 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
          Trang sau
        </button>
      </div>
    </div>
  )
}