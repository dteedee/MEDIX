import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/public/ArticleReaderPage.css';
import homeStyles from '../../styles/public/home.module.css';
import { articleService } from '../../services/articleService';
import { categoryService } from '../../services/categoryService';
import type { ArticleDTO } from '../../types/article.types';
import type { CategoryDTO } from '../../types/category.types';
import Pagination from '../../components/layout/Pagination';

// Utility: format date in Vietnamese
function formatViDate(input?: string | null): string {
  if (!input) return '';
  const d = new Date(input);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Utility: Get reading time estimate
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

export default function ArticleReaderPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Map category name -> icon class
  const getCategoryIcon = (name?: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('cấp cứu') || lower.includes('khẩn')) return 'bi-activity';
    if (lower.includes('tim') || lower.includes('mạch') || lower.includes('huyết')) return 'bi-heart-pulse';
    if (lower.includes('nhi') || lower.includes('trẻ')) return 'bi-emoji-smile';
    if (lower.includes('dinh dưỡng') || lower.includes('ăn')) return 'bi-basket';
    if (lower.includes('tiêm') || lower.includes('vaccine')) return 'bi-shield-plus';
    if (lower.includes('sức khỏe') || lower.includes('health')) return 'bi-heart-fill';
    return 'bi-bookmark-heart';
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const { items } = await categoryService.list(1, 9999);
        setCategories(items);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    })();
  }, []);

  // Fetch articles
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { items, total } = await articleService.list(page, pageSize, {
          keyword: debounced || undefined,
        });

        let filtered = selectedCategoryId === 'all'
          ? items
          : items.filter(a => (a.categoryIds || []).includes(String(selectedCategoryId)));

        // Sort by date: newest first
        filtered = filtered.sort((a, b) => {
          const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return tb - ta;
        });

        setArticles(filtered);
        setTotal(filtered.length);
      } catch (err) {
        console.error('Failed to load articles', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, debounced, selectedCategoryId]);

  const pagedArticles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return articles.slice(start, start + pageSize);
  }, [articles, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const featured: ArticleDTO | undefined = useMemo(() => {
    if (debounced) return undefined;
    return articles[0];
  }, [debounced, articles]);

  const rest = useMemo(() => {
    if (featured && page === 1 && pagedArticles.length) {
      const [first, ...others] = pagedArticles;
      return first.id === featured.id ? others : pagedArticles;
    }
    return pagedArticles;
  }, [pagedArticles, featured, page]);

  const handleSelectCategory = (id: string | 'all') => {
    setSelectedCategoryId(id);
    setPage(1);
  };

  return (
    <div className="article-reader-page">
      {/* Navigation */}
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li>
            <a
              onClick={() => navigate('/')}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/' ? homeStyles["active"] : ''}`}
            >
              Trang chủ
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/ai-chat')}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}
            >
              AI chẩn đoán
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/specialties')}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/specialties' ? homeStyles["active"] : ''}`}
            >
              Chuyên khoa
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/doctors')}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/doctors' ? homeStyles["active"] : ''}`}
            >
              Bác sĩ
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/articles')}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/articles' ? homeStyles["active"] : ''}`}
            >
              Bài viết sức khỏe
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => navigate('/about')}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/about' ? homeStyles["active"] : ''}`}
            >
              Về chúng tôi
            </a>
          </li>
        </ul>
      </nav>

      <div className="arp-container">
        {/* Sidebar */}
        <aside className="arp-sidebar">
          <div className="sidebar-card category-card">
            <div className="sidebar-title">
              <i className="bi bi-folder2-open"></i>
              Danh mục
            </div>
            <ul className="category-list">
              <li>
                <button
                  className={`category-item ${selectedCategoryId === 'all' ? 'active' : ''}`}
                  onClick={() => handleSelectCategory('all')}
                >
                  <span className="category-icon"><i className="bi bi-grid-3x3-gap-fill"></i></span>
                  <span>Tất cả</span>
                  <span className="category-badge">{articles.length}</span>
                </button>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <button
                    className={`category-item ${selectedCategoryId === c.id ? 'active' : ''}`}
                    onClick={() => handleSelectCategory(c.id)}
                  >
                    <span className="category-icon"><i className={`bi ${getCategoryIcon(c.name)}`}></i></span>
                    <span>{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* View mode toggle */}
          <div className="sidebar-card view-mode-card">
            <div className="sidebar-title">
              <i className="bi bi-layout-three-columns"></i>
              Chế độ xem
            </div>
            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <i className="bi bi-grid-3x3-gap-fill"></i>
                Lưới
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <i className="bi bi-list-ul"></i>
                Danh sách
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="arp-main">
          {/* Header with search */}
          <div className="page-header">
            <div className="header-search">
              <div className="search-box">
                <i className="bi bi-search search-icon"></i>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm bài viết sức khỏe..."
                />
                {search && (
                  <button className="clear-btn" onClick={() => setSearch('')} aria-label="Xoá tìm kiếm">
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="stats-bar">
              <div className="stat-item">
                <i className="bi bi-file-earmark-text-fill"></i>
                <span>{total} bài viết</span>
              </div>
              {selectedCategoryId !== 'all' && (
                <div className="stat-item active-filter">
                  <i className="bi bi-funnel-fill"></i>
                  <span>Đang lọc</span>
                </div>
              )}
            </div>
          </div>

          {/* Featured */}
          {featured && (
            <Link to={`/articles/${featured.slug}`} className="featured-card">
              <div className="featured-badge">
                <i className="bi bi-star-fill"></i>
                Nổi bật
              </div>
              <div className="featured-image">
                <img src={featured.coverImageUrl || featured.thumbnailUrl || '/images/medix-logo.png'} alt={featured.title} />
                <div className="featured-overlay"></div>
              </div>
              <div className="featured-content">
                <div className="featured-tags">
                  <span className="tag">
                    <i className="bi bi-bookmark-fill"></i>
                    Sức khỏe
                  </span>
                </div>
                <h2 className="featured-title">{featured.title}</h2>
                {featured.summary && <p className="featured-summary">{featured.summary}</p>}
                <div className="featured-meta">
                  <div className="meta-item">
                    <i className="bi bi-calendar3"></i>
                    <span>{formatViDate(featured.publishedAt)}</span>
                  </div>
                  <div className="meta-item">
                    <i className="bi bi-clock"></i>
                    <span>{getReadingTime(featured.content)}</span>
                  </div>
                  <span className="read-more">
                    Đọc ngay
                    <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Articles section */}
          <div className="section-header">
            <h3 className="section-title">Bài viết mới nhất</h3>
            <div className="section-count">{rest.length} bài viết</div>
          </div>

          <section className={`card-container ${viewMode}`}>
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải bài viết...</p>
              </div>
            )}
            {!loading && rest.length === 0 && (
              <div className="empty-state">
                <i className="bi bi-inbox"></i>
                <h3>Không tìm thấy bài viết</h3>
                <p>Thử thay đổi từ khóa hoặc danh mục khác</p>
              </div>
            )}
            {!loading && rest.map((a, idx) => (
              <Link 
                key={a.id} 
                to={`/articles/${a.slug}`} 
                className="article-card"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="card-thumb">
                  <img src={a.thumbnailUrl || a.coverImageUrl || '/images/medix-logo.png'} alt={a.title} />
                  <div className="thumb-overlay">
                    <i className="bi bi-eye-fill"></i>
                    Xem chi tiết
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{a.title}</h3>
                  {a.summary && <p className="card-summary">{a.summary}</p>}
                </div>
                <div className="card-footer">
                  <div className="card-meta">
                    <span className="meta-date">
                      <i className="bi bi-calendar-event"></i>
                      {formatViDate(a.publishedAt)}
                    </span>
                    <span className="meta-reading">
                      <i className="bi bi-book"></i>
                      {getReadingTime(a.content)}
                    </span>
                  </div>
                  <span className="cta-link">
                    Đọc thêm
                    <i className="bi bi-arrow-right-short"></i>
                  </span>
                </div>
              </Link>
            ))}
          </section>

          {/* Pagination */}
          {!loading && rest.length > 0 && (
            <div className="pagination-wrapper">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}