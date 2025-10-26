import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import styles from '../../styles/ArticleListPage.module.css'

export default function ArticleListPage() {
  const [articles, setArticles] = useState<ArticleDTO[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const pageSize = 5

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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.h1}>Bài viết sức khỏe</h1>
          <p className={styles.pHeader}>Khám phá các bài viết chuyên sâu về sức khỏe, dinh dưỡng và lối sống lành mạnh từ các chuyên gia hàng đầu.</p>
        </header>

        <div className={styles.grid}>
          {articles.map(article => (
            <Link to={`/articles/${article.slug}`} key={article.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                {article.thumbnailUrl && <img src={article.thumbnailUrl} alt={article.title} className={styles.image} />}
              </div>
              <div className={styles.content}>
                <span className={styles.category}>{(article.categories?.[0]?.name ?? 'Kiến thức').toUpperCase()}</span>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.summary}>{article.summary}</p>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <button onClick={handleLoadMore} disabled={loading} className={styles.loadMoreButton}>
              {loading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}