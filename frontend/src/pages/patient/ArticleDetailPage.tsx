import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import '../../styles/ArticleDetailPage.css'

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false); // State to prevent multiple clicks
  const navigate = useNavigate();

  const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
  );

  const LikeIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
         fill={filled ? "red" : "none"} 
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );

  // This effect handles view counting once per session
  useEffect(() => {
    if (!slug) return

    const viewedArticles = JSON.parse(localStorage.getItem('viewedArticles') || '[]');
    const hasViewed = viewedArticles.includes(slug);

    if (!hasViewed) {
      // Use fetch to call the view increment endpoint and handle session storage on success
      fetch(`/api/HealthArticle/${slug}/view`, { method: 'POST' })
        .then(response => {
          if (response.ok) {
            localStorage.setItem('viewedArticles', JSON.stringify([...viewedArticles, slug]));
          }
        })
        .catch((err: any) => console.error("Failed to increment view count:", err));
    }
  }, [slug]);

  // This effect fetches the article data
  useEffect(() => {
    if (!slug) return;
    const fetchArticleData = async () => {
      try {
        const articleData = await articleService.getBySlug(slug);
        if (articleData) {
          setArticle(articleData);
          setLikeCount(articleData.likeCount ?? 0);
          // Check if article has been liked from localStorage
          const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
          if (likedArticles.includes(slug)) {
            setIsLiked(true);
          }
        } else {
          setError('Article not found.')
        }
      } catch (err: any) {
        setError('Failed to load article.')
      } finally {
        setLoading(false)
      }
    }
    fetchArticleData();
  }, [slug]);

  const handleLike = async () => {
    if (!article || !article.id || !slug || isLiking) return;

    setIsLiking(true);

    // Optimistic UI Update
    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;

    const newIsLiked = !originalIsLiked;
    const newLikeCount = newIsLiked ? originalLikeCount + 1 : originalLikeCount - 1;

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      const method = newIsLiked ? 'POST' : 'DELETE';
      const response = await fetch(`/api/HealthArticle/${article.id}/like`, { method });

      if (response.ok) {
        const updatedArticle: ArticleDTO = await response.json();
        // Sync with server state to ensure consistency
        setLikeCount(updatedArticle.likeCount ?? newLikeCount);

        // Update localStorage
        const likedArticles: string[] = JSON.parse(localStorage.getItem('likedArticles') || '[]');
        if (newIsLiked) {
          localStorage.setItem('likedArticles', JSON.stringify([...new Set([...likedArticles, slug])]));
        } else {
          localStorage.setItem('likedArticles', JSON.stringify(likedArticles.filter(s => s !== slug)));
        }
      } else {
        console.error("Failed to like the article. Status:", response.status);
        // Revert UI on failure
        setIsLiked(originalIsLiked);
        setLikeCount(originalLikeCount);
      }
    } catch (err) {
      console.error("Error liking the article:", err);
      // Revert UI on error
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
    } finally {
      setIsLiking(false); // Re-enable the button
    }
  };

  if (loading) return <div className="article-reader-container">Đang tải bài viết...</div>
  if (error) return <div className="article-reader-container">{error}</div>
  if (!article) return null

  return (
    <div className="article-reader-container">
       <button onClick={() => navigate(-1)} className="back-button">
        &larr; Quay lại danh sách
      </button>

      <div className="breadcrumb">
        <Link to="/app/patient">Trang chủ</Link>
        <span className="separator">/</span>
        <Link to="/app/articles">Kiến thức y khoa</Link>
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