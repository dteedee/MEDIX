import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'

export default function ArticleListPage() {
  const [articles, setArticles] = useState<ArticleDTO[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const pageSize = 9 // 3x3 grid

  const loadArticles = async (pageNum: number) => {
    if (loading) return
    setLoading(true)
    try {
      const response = await articleService.list(pageNum, pageSize)
      // Filter for published articles only
      const publishedArticles = response.items.filter(a => a.statusCode === 'PUBLISHED')

      setArticles(prev => pageNum === 1 ? publishedArticles : [...prev, ...publishedArticles])
      if (response.items.length < pageSize) {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load articles:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles(1)
  }, [])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadArticles(nextPage)
  }

  // --- Inline CSS Styles ---
  const pageStyle: React.CSSProperties = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#fff',
    color: '#333',
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  }

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '48px',
  }

  const h1Style: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 16px 0',
  }

  const pHeaderStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    color: '#6b7280',
    maxWidth: '600px',
    margin: '0 auto',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    textDecoration: 'none',
    color: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  }

  const cardHoverStyle: React.CSSProperties = {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  }

  const imageWrapperStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '16 / 9',
    backgroundColor: '#f3f4f6',
  }

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }

  const contentStyle: React.CSSProperties = {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  }

  const categoryStyle: React.CSSProperties = {
    color: '#2563eb',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '8px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '12px',
    flexGrow: 1,
  }

  const summaryStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#4b5563',
    lineHeight: 1.6,
  }

  const loadMoreContainerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '48px',
  }

  const loadMoreButtonStyle: React.CSSProperties = {
    padding: '12px 28px',
    backgroundColor: '#2563eb',
    color: '#fff',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '1rem',
    opacity: loading ? 0.7 : 1,
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={h1Style}>Bài viết sức khỏe</h1>
          <p style={pHeaderStyle}>Khám phá các bài viết chuyên sâu về sức khỏe, dinh dưỡng và lối sống lành mạnh từ các chuyên gia hàng đầu.</p>
        </header>

        <div style={gridStyle}>
          {articles.map(article => (
            <Link to={`/articles/${article.slug}`} key={article.id} style={cardStyle}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHoverStyle)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: cardStyle.boxShadow })}
            >
              <div style={imageWrapperStyle}>
                {article.thumbnailUrl && <img src={article.thumbnailUrl} alt={article.title} style={imageStyle} />}
              </div>
              <div style={contentStyle}>
                <span style={categoryStyle}>{(article.categories?.[0]?.name ?? 'Kiến thức').toUpperCase()}</span>
                <h3 style={titleStyle}>{article.title}</h3>
                <p style={summaryStyle}>{article.summary}</p>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div style={loadMoreContainerStyle}>
            <button onClick={handleLoadMore} disabled={loading} style={loadMoreButtonStyle}>
              {loading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}