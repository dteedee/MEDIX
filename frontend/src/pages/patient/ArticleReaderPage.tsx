import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import './ArticleReader.css'

export default function ArticleReaderPage() {
  const [articles, setArticles] = useState<ArticleDTO[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const pageSize = 5 // 1 featured + 4 grid items per page

  const loadArticles = async (pageNum: number) => {
    setLoading(true);
    setHasMore(true); // Reset hasMore on every page load to re-evaluate
    try {
      // Fetch only published articles from the server
      const response = await articleService.list(pageNum, pageSize, { status: 'PUBLISHED' });
      
      setArticles(response.items);
      
      // If the API returns fewer items than requested, or no items, it's the last page.
      if (response.items.length < pageSize) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
      setHasMore(false); // Disable next on error
    } finally {
      setLoading(false);
    }
  }

  // Load initial articles on component mount
  useEffect(() => {
    loadArticles(page);
  }, [page])

  // Show a loading indicator only on the initial page load
  if (loading) {
    return <div className="article-reader-container">Đang tải bài viết...</div>;
  }

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <div className="article-reader-container">
      <h1 className="reader-main-title">Kiến Thức Y Khoa</h1>
      <p className="reader-main-subtitle">Khám phá các bài viết chuyên sâu về sức khỏe, dinh dưỡng và lối sống lành mạnh từ các chuyên gia hàng đầu.</p>

      <div className="article-page-chunk">
        {featuredArticle && (
          <Link to={`/articles/${featuredArticle.slug}`} className="featured-article-link">
            <div className="featured-article">
              <img src={featuredArticle.coverImageUrl || featuredArticle.thumbnailUrl || '/images/placeholder.png'} alt={featuredArticle.title} />
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
                <div className="article-card-image-wrapper">
                  <img src={article.thumbnailUrl || '/images/placeholder.png'} alt={article.title} className="article-card-image" />
                </div>
                <div className="article-card-content">
                  <span className="article-card-category">{(article.categories?.[0]?.name ?? 'Kiến thức').toUpperCase()}</span>
                  <h3 className="article-card-title">{article.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="pagination-container">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="pagination-button">
          Trang trước
        </button>
        <span className="pagination-info">Trang {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!hasMore} className="pagination-button">
          Trang sau
        </button>
      </div>
    </div>
  )
}