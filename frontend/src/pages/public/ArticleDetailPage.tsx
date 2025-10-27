import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleService } from '../../services/articleService';
import { ArticleDTO } from '../../types/article.types';

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
          // Check if article is locked
          if (data.isLocked) {
            setError('Bài viết không khả dụng.');
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

  // --- Inline CSS Styles ---
  const pageStyle: React.CSSProperties = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#fff',
    color: '#333',
    lineHeight: 1.7,
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 20px',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '32px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.2,
    margin: '0 0 16px 0',
  };

  const metaInfoStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#6b7280',
  };

  const coverImageStyle: React.CSSProperties = {
    width: '100%',
    maxHeight: '450px',
    objectFit: 'cover',
    borderRadius: '12px',
    marginBottom: '32px',
  };

  const contentStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    whiteSpace: 'pre-wrap', // To respect newlines and spacing
  };

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  };

  if (loading) return <div style={containerStyle}>Đang tải bài viết...</div>;
  if (error) return <div style={containerStyle}><h2>Lỗi</h2><p>{error}</p></div>;
  if (!article) return <div style={containerStyle}><h2>Không tìm thấy bài viết</h2></div>;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <button onClick={() => navigate(-1)} style={backButtonStyle}>
          &larr; Quay lại
        </button>
        <header style={headerStyle}>
          <h1 style={titleStyle}>{article.title}</h1>
          <p style={metaInfoStyle}>Tác giả: {article.authorName || 'N/A'} | Ngày đăng: {fmtDate(article.publishedAt ?? article.createdAt)}</p>
        </header>
        {article.coverImageUrl && <img src={article.coverImageUrl} alt={article.title} style={coverImageStyle} />}
        <div style={contentStyle} dangerouslySetInnerHTML={{ __html: article.content || '' }}></div>
      </div>
    </div>
  );
}