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