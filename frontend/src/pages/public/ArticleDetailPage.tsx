import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../../styles/public/ArticleDetailPage.css';
import homeStyles from '../../styles/public/home.module.css';
import { articleService } from '../../services/articleService';
import { categoryService } from '../../services/categoryService';
import type { ArticleDTO } from '../../types/article.types';
import type { CategoryDTO } from '../../types/category.types';

function formatViDate(input?: string | null): string {
  if (!input) return '';
  const d = new Date(input);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getReadingTime(content?: string | null): string {
  if (!content) return '1 phút đọc';
  const WORDS_PER_MINUTE = 200;
  const plainText = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plainText ? plainText.split(' ').length : 0;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} phút đọc`;
}

function getCategoryIcon(name?: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('cấp cứu') || lower.includes('khẩn')) return 'bi-activity';
  if (lower.includes('tim') || lower.includes('mạch') || lower.includes('huyết')) return 'bi-heart-pulse';
  if (lower.includes('nhi') || lower.includes('trẻ')) return 'bi-emoji-smile';
  if (lower.includes('dinh dưỡng') || lower.includes('ăn')) return 'bi-basket';
  if (lower.includes('tiêm') || lower.includes('vaccine')) return 'bi-shield-plus';
  if (lower.includes('sức khỏe') || lower.includes('health')) return 'bi-heart-fill';
  return 'bi-bookmark-heart';
}

// Add scroll-to-top utility
function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleDTO | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [recent, setRecent] = useState<ArticleDTO[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{ [catId: string]: number }>({});
  const [totalValid, setTotalValid] = useState(0);
  const [validArticles, setValidArticles] = useState<ArticleDTO[]>([]);

  const [likeBusy, setLikeBusy] = useState(false);
  const [liked, setLiked] = useState(false);

  // load categories + article + recent
  useEffect(() => {
    (async () => {
      if (!slug) {
        setError('Không tìm thấy slug bài viết');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [catRes, articleRes] = await Promise.all([
          categoryService.list(1, 9999),
          articleService.getBySlug(slug)
        ]);
        setCategories(catRes.items || []);
        if (!articleRes) {
          setError('Không tìm thấy bài viết');
          setArticle(null);
          return;
        }
        // chỉ cho phép xem bài đã publish
        if (!articleRes.statusCode || String(articleRes.statusCode).toLowerCase() !== 'published') {
          setError('Bài viết này không được công khai hoặc không tồn tại.');
          setArticle(null);
          return;
        }
        setArticle(articleRes);
        // init liked từ localStorage
        try {
          const key = `medix-liked-${articleRes.id}`;
          setLiked(localStorage.getItem(key) === '1');
        } catch {}
        // lấy bài viết mới (client-side lọc khác slug)
        const { items } = await articleService.list(1, 20);
        const filtered = (items || [])
          .filter(a => a.slug !== articleRes.slug)
          .sort((a, b) => {
            const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return tb - ta;
          })
          .slice(0, 6);
        setRecent(filtered);
        // tăng view (best-effort)
        if (articleRes.id) {
          articleService.incrementView(articleRes.id).catch(() => {});
        }
      } catch (e) {
        console.error(e);
        setError('Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await articleService.list(1, 9999);
        // Chỉ lấy bài published, có category hợp lệ
        const valid = items.filter(
          a => String(a.statusCode).toLowerCase() === 'published' && Array.isArray(a.categoryIds) && a.categoryIds.length > 0
        );
        setValidArticles(valid);
        setTotalValid(valid.length);
        // Tính count từng cat
        const counts: { [catId: string]: number } = {};
        for(const a of valid) {
          (a.categoryIds || []).forEach(cid => { counts[cid] = (counts[cid] || 0) + 1; });
        }
        setCategoryCounts(counts);
        // Recent chỉ lấy từ valid, khác slug và cùng category với bài hiện tại
        setRecent(
          valid.filter(a =>
            a.slug !== article?.slug &&
            a.categoryIds?.some((catId: string) => article?.categoryIds?.includes(catId))
          )
            .sort((a, b) => {
              const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
              const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
              return tb - ta;
            })
            .slice(0, 6)
        );
      } catch {
        setValidArticles([]); setCategoryCounts({}); setTotalValid(0);
      }
    })();
  }, [categories, article]);

  const handleLike = async () => {
    if (!article || likeBusy) return;
    setLikeBusy(true);
    const prevLiked = liked;
    const prevCount = article.likeCount || 0;
    // tối ưu UI
    setLiked(!prevLiked);
    setArticle({ ...article, likeCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1 });
    try {
      await articleService.toggleLike(article.id);
      try { localStorage.setItem(`medix-liked-${article.id}`, !prevLiked ? '1' : '0'); } catch {}
    } catch (e) {
      // revert nếu lỗi
      setLiked(prevLiked);
      setArticle({ ...article, likeCount: prevCount });
    } finally {
      setLikeBusy(false);
    }
  };

  const readingTime = useMemo(() => getReadingTime(article?.content), [article?.content]);

  if (loading) {
    return (
      <div className="adp-page">
        <div className="adp-container">
          <main className="adp-main">
            <div className="adp-loading">
              <div className="adp-spinner" />
              <p>Đang tải bài viết...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adp-page">
        <div className="adp-container">
          <main className="adp-main">
            <div className="adp-error">
              <i className="bi bi-exclamation-triangle-fill" />
              <h3>{error}</h3>
              <button className="adp-like" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left" /> Quay lại
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="adp-page">
      {/* Navigation giống trang danh sách */}
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li>
            <a onClick={() => { scrollToTop(); navigate('/'); }} className={`${homeStyles["nav-link"]} ${window.location.pathname === '/' ? homeStyles["active"] : ''}`}>
              Trang chủ
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a onClick={() => { scrollToTop(); navigate('/ai-chat'); }} className={`${homeStyles["nav-link"]} ${window.location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}>
              AI chẩn đoán
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a onClick={() => { scrollToTop(); navigate('/specialties'); }} className={`${homeStyles["nav-link"]} ${window.location.pathname === '/specialties' ? homeStyles["active"] : ''}`}>
              Chuyên khoa
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a onClick={() => { scrollToTop(); navigate('/doctors'); }} className={`${homeStyles["nav-link"]} ${window.location.pathname === '/doctors' ? homeStyles["active"] : ''}`}>
              Bác sĩ
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a onClick={() => { scrollToTop(); navigate('/articles'); }} className={`${homeStyles["nav-link"]} ${window.location.pathname.startsWith('/articles') ? homeStyles["active"] : ''}`}>
              Bài viết sức khỏe
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a onClick={() => { scrollToTop(); navigate('/about'); }} className={`${homeStyles["nav-link"]} ${window.location.pathname === '/about' ? homeStyles["active"] : ''}`}>
              Về chúng tôi
            </a>
          </li>
        </ul>
      </nav>

      {/* Breadcrumb */}
      <div className="adp-breadcrumb" aria-label="breadcrumb">
        <button className="crumb" onClick={() => { scrollToTop(); navigate('/'); }}>Trang chủ</button>
        <span className="sep">/</span>
        <button className="crumb" onClick={() => { scrollToTop(); navigate('/articles'); }}>Bài viết sức khỏe</button>
        <span className="sep">/</span>
        <span className="crumb current" title={article?.title || ''}>{article?.title || ''}</span>
      </div>

      <div className="adp-container">
        {/* Sidebar */}
        <aside className="adp-sidebar">
          <div className="adp-card">
            <div className="title"><i className="bi bi-folder2-open" /> Danh mục</div>
            <ul className="adp-category-list">
              <li>
                <button
                  className={`adp-category-item${!article?.categoryIds?.length ? ' active' : ''}`}
                  onClick={() => { scrollToTop(); navigate('/articles'); }}
                >
                  <span className="category-icon"><i className="bi bi-grid-3x3-gap-fill" /></span>
                  <span>Tất cả</span>
                  <span className="category-badge">{totalValid}</span>
                </button>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <button
                    className={`adp-category-item${article?.categoryIds?.includes(c.id) ? ' active' : ''}`}
                    onClick={() => { scrollToTop(); navigate(`/articles?cat=${c.id}`); }}
                  >
                    <span className="category-icon"><i className={`bi ${getCategoryIcon(c.name)}`} /></span>
                    <span>{c.name}</span>
                    <span className="category-badge">{categoryCounts[c.id] || 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="adp-card">
            <div className="title"><i className="bi bi-stars" /> Bài viết mới</div>
            <div className="adp-recent-list">
              {recent.map(r => (
                <button
                  key={r.id}
                  className="adp-recent-item"
                  onClick={() => { scrollToTop(); navigate(`/articles/${r.slug}`); }}
                  style={{ border: 'none', background: 'transparent', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <img className="adp-recent-thumb" src={r.thumbnailUrl || r.coverImageUrl || '/images/medix-logo.png'} alt={r.title} />
                  <div>
                    <div className="adp-recent-title">{r.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatViDate(r.publishedAt)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="adp-main">
          {/* Hero */}
          <section className="adp-hero">
            <div className="adp-hero-media">
              <img src={article.coverImageUrl || article.thumbnailUrl || '/images/medix-logo.png'} alt={article.title} />
            </div>
            <div className="adp-hero-content">
              <h1 className="adp-title">{article.title}</h1>
              <div className="adp-meta">
                <span><i className="bi bi-person-circle" /> {article.authorName || 'Tác giả ẩn danh'}</span>
                <span><i className="bi bi-calendar3" /> {formatViDate(article.publishedAt || article.createdAt)}</span>
                <span><i className="bi bi-clock" /> {readingTime}</span>
              </div>
            </div>
          </section>

          {/* Toolbar: like + stats */}
          <div className="adp-toolbar">
            <div className="adp-stats">
              <span><i className="bi bi-eye" /> {article.viewCount ?? 0} lượt xem</span>
              <span><i className="bi bi-chat-left-text" /> {Math.max(0, Math.floor((article.likeCount || 0) / 3))} bình luận</span>
            </div>
            <button className={`adp-like ${liked ? 'liked' : ''}`} onClick={handleLike} disabled={likeBusy} aria-label="Thích bài viết">
              <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`} />
              <span>{article.likeCount ?? 0}</span>
            </button>
          </div>

          {/* Content */}
          <article className="adp-content">
            {article.summary && (
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 0 }}>{article.summary}</p>
            )}
            <div className="article-html" dangerouslySetInnerHTML={{ __html: article.content || '' }} />
          </article>
        </main>
      </div>
    </div>
  );
}