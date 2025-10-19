import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import './ArticleReader.css'

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false);
  const [error, setError] = useState<string | null>(null)

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
  );

  const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
          // Check localStorage to see if this article was liked before
          const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
          setIsLiked(likedArticles.includes(articleData.id));
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
    if (!article) return;

    const originalLikedState = isLiked;
    const originalLikeCount = article.likeCount ?? 0;

    // Optimistic UI update
    const newLikedState = !isLiked;
    const newLikeCount = newLikedState ? originalLikeCount + 1 : Math.max(0, originalLikeCount - 1);

    setIsLiked(newLikedState);
    setArticle({ ...article, likeCount: newLikeCount });

    // Update localStorage
    const likedArticles: string[] = JSON.parse(localStorage.getItem('likedArticles') || '[]');
    if (newLikedState) {
      localStorage.setItem('likedArticles', JSON.stringify([...likedArticles, article.id]));
    } else {
      localStorage.setItem('likedArticles', JSON.stringify(likedArticles.filter(id => id !== article.id)));
    }

    try {
      // Assume an endpoint to toggle the like status.
      // This should be replaced with your actual API call.
      await fetch(`/api/HealthArticle/${article.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error("Failed to update like status:", error);
      // Revert UI on error
      setIsLiked(originalLikedState);
      setArticle({ ...article, likeCount: originalLikeCount });
    }
  };

  if (loading) return <div className="article-reader-container">Đang tải bài viết...</div>
  if (error) return <div className="article-reader-container">{error}</div>
  if (!article) return null

  return (
    <div className="article-reader-container">
      <article className="article-detail">
        <h1>{article.title}</h1>
        <div className="article-meta-container">
          <div className="article-meta">
            Đăng ngày {new Date(article.publishedAt ?? article.createdAt!).toLocaleDateString()} bởi {article.authorName ?? 'MEDIX'}
          </div>
          <div className="article-stats">
            <span className="stat-item"><ViewIcon /> {article.viewCount ?? 0}</span>
            <span className="stat-item"><HeartIcon filled={true} /> {article.likeCount ?? 0}</span>
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
      {/* Sticky Like Button at the bottom */}
      <div className="sticky-like-bar">
        <button onClick={handleLike} className={`like-button ${isLiked ? 'liked' : ''}`}>
          <HeartIcon filled={isLiked} />
          <span>{isLiked ? 'Đã thích' : 'Thích bài viết'}</span>
        </button>
      </div>
    </div>
  )
}