import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { articleService } from '../../services/articleService';
import { ArticleDTO } from '../../types/article.types';
import styles from '../../styles/public/ArticleDetailPage.module.css';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Không tìm thấy slug bài viết.');
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await articleService.getBySlug(slug);
        if (data) {
          // Check if the article is published. The backend should already handle this,
          // but this is an extra layer of protection on the client.
          if (data.statusCode !== 'PUBLISHED') {
            setError('Bài viết này không được công khai hoặc không tồn tại.');
            return;
          }
          setArticle(data);
        } else {
          setError('Không tìm thấy bài viết.');
        }
      } catch (err) {
        console.error('Failed to fetch article:', err);
        setError('Đã xảy ra lỗi khi tải bài viết.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A';

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={`${styles.container} ${styles.stateContainer}`}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải bài viết...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.page}>
        <div className={`${styles.container} ${styles.stateContainer}`}>
          <div className={styles.errorIcon}>&#x26A0;</div>
          <h2>Lỗi</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className={styles.backButton} style={{ marginTop: '20px' }}>
            &larr; Quay lại
          </button>
        </div>
      </div>
    );
  }
  
  if (!article) {
    return <div className={styles.container}><h2>Không tìm thấy bài viết</h2></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          &larr; Quay lại
        </button>
        <header className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.metaInfo}>
            <span>Tác giả: {article.authorName || 'N/A'}</span>
            <span>|</span>
            <span>Ngày đăng: {fmtDate(article.publishedAt ?? article.createdAt)}</span>
          </p>
        </header>
        {article.coverImageUrl && <img src={article.coverImageUrl} alt={article.title} className={styles.coverImage} />}
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: article.content || '' }}></div>
      </div>
    </div>
  );
}