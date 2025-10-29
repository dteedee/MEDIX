import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import { apiClient } from '../../lib/apiClient'
import '../../styles/ArticleDetailPage.css'

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const effectRan = useRef(false)
  const navigate = useNavigate()

  const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )

  const LikeIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
         viewBox="0 0 24 24"
         fill={filled ? "red" : "none"}
         stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  )

  // Lấy dữ liệu bài viết
  useEffect(() => {
    if (!slug) return

    // Chỉ chạy logic fetch trong lần render thứ hai của StrictMode ở development
    if (process.env.NODE_ENV === 'development' && !effectRan.current) {
      effectRan.current = true
      return
    }

    const abortController = new AbortController()
    const signal = abortController.signal

    const fetchArticleData = async () => {
      try { // API call đã bao gồm việc tăng view count
        const articleData = await articleService.getBySlug(slug)
        if (articleData) {
          if (articleData.isLocked) {
            setError('Article not available.')
            return
          }
          setArticle(articleData)
          setLikeCount(articleData.likeCount ?? 0)

          // [FE-ONLY] Kiểm tra trạng thái like từ localStorage
          const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]') as string[];
          if (articleData.id && likedArticles.includes(articleData.id)) {
            setIsLiked(true);
          } else {
            setIsLiked(false);
          }
        } else {
          setError('Article not found.')
        }
      } catch (err) {
        if (!signal.aborted) {
          setError('Failed to load article.')
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }
    fetchArticleData()

    return () => {
      abortController.abort()
      // Reset ref khi component unmount hoặc slug thay đổi
      if (process.env.NODE_ENV === 'development') {
        effectRan.current = false
      }
    }
  }, [slug])

  // ✅ Sửa lỗi 401 và dùng apiClient
  const handleLike = async () => {
    if (!article || !article.id || isLiking) return

    const token = apiClient.getToken()
    if (!token) {
      alert("Bạn cần đăng nhập để thích bài viết.")
      navigate("/login")
      return
    }

    setIsLiking(true)

    const originalIsLiked = isLiked
    const originalLikeCount = likeCount
    const newIsLiked = !originalIsLiked
    const newLikeCount = newIsLiked ? originalLikeCount + 1 : originalLikeCount - 1

    // Optimistic UI
    setIsLiked(newIsLiked)
    setLikeCount(newLikeCount)

    try {
      const method = newIsLiked ? 'post' : 'delete'
      const url = `/HealthArticle/${article.id}/like`

      const response = await apiClient[method]<ArticleDTO>(url)

      if (response.status === 200) {
        const updated = response.data
        setLikeCount(updated.likeCount ?? newLikeCount)

        // [FE-ONLY] Cập nhật localStorage
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]') as string[];
        if (newIsLiked) {
          if (!likedArticles.includes(article.id)) {
            likedArticles.push(article.id);
          }
        } else {
          const index = likedArticles.indexOf(article.id);
          if (index > -1) {
            likedArticles.splice(index, 1);
          }
        }
        localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
      } else {
        console.error("Failed to like the article:", response.status)
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
      }
    } catch (err: any) {
      console.error("Error liking the article:", err)
      if (err.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        apiClient.clearTokens()
        navigate("/login")
      } else {
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
      }
    } finally {
      setIsLiking(false)
    }
  }

  if (loading) return <div className="article-reader-container">Đang tải bài viết...</div>
  if (error) return <div className="article-reader-container">{error}</div>
  if (!article) return null

  return (
    <div className="article-reader-container">
      <button onClick={() => navigate('/app/articles')} className="back-button">
        &larr; Quay lại danh sách
      </button>

      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="separator">/</span>
        <span className="current-page">{article.title}</span>
      </div>

      <article className="article-detail">
        <h1>{article.title}</h1>
        <div className="article-meta-container">
          <div className="article-meta">
            Đăng ngày {new Date(article.publishedAt ?? article.createdAt!).toLocaleDateString()} bởi {article.authorName ?? 'MEDIX'}
          </div>
          <div className="article-stats">
            <button onClick={handleLike} disabled={isLiking} className={`like-button ${isLiked ? 'liked' : ''}`}>
              <LikeIcon filled={isLiked} />
              <span className="like-count">{likeCount}</span>
            </button>
            <span className="stat-item"><ViewIcon /> {article.viewCount ?? 0}</span>
          </div>
        </div>
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
