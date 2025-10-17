import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import './ArticleReader.css'

export default function ArticleReaderPage() {
  const [articles, setArticles] = useState<ArticleDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadArticles = async () => {
      try {
        // Fetch only published articles
        const response = await articleService.list(1, 50) // Fetch more to filter
        const published = response.items.filter((a: ArticleDTO) => a.statusCode === 'PUBLISHED')
        setArticles(published)
      } catch (error) {
        console.error("Failed to load articles", error)
      } finally {
        setLoading(false)
      }
    }
    loadArticles()
  }, [])

  if (loading) return <div className="article-reader-container">Đang tải...</div>

  const featuredArticle = articles[0]
  const otherArticles = articles.slice(1)

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
    </div>
  )
}