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
  if (!content) return '5 phút đọc';
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} phút đọc`;
}

export default function ArticleReaderPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [total, setTotal] = useState(0);
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search for better UX
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load categories once
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

  // Fetch articles when filters change
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { items, total } = await articleService.list(page, pageSize, {
          keyword: debounced || undefined,
        });

        // Client-side category filter
        const filtered = selectedCategoryId === 'all'
          ? items
          : items.filter(a => (a.categoryIds || []).includes(String(selectedCategoryId)));

        setArticles(filtered);
        setTotal(filtered.length);
      } catch (err) {
        console.error('Failed to load articles', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, debounced, selectedCategoryId]);

  // Compute current page data
  const pagedArticles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return articles.slice(start, start + pageSize);
  }, [articles, page, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const featured: ArticleDTO | undefined = pagedArticles[0] ?? articles[0];
  const rest = useMemo(() => {
    const list = pagedArticles[0] ? pagedArticles.slice(1) : pagedArticles;
    return list;
  }, [pagedArticles]);

  const handleSelectCategory = (id: string | 'all') => {
    setSelectedCategoryId(id);
    setPage(1);
  };

  return (
    <div className="article-reader-page">
      {/* Top navigation */}
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
          <div className="sidebar-card search-card">
            <div className="sidebar-title">
              <i className="bi bi-search"></i>
              Tìm kiếm bài viết
            </div>
            <div className="search-box">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Nhập từ khóa tìm kiếm..."
              />
              {search && (
                <button className="clear-btn" onClick={() => setSearch('')} aria-label="Xoá tìm kiếm">
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
            {debounced && (
              <div className="search-result-info">
                <i className="bi bi-check-circle-fill"></i>
                Tìm thấy {total} kết quả
              </div>
            )}
          </div>

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
                  <span className="category-icon">📚</span>
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
                    <span className="category-icon">🏥</span>
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
          {/* Header with breadcrumb and stats */}
          <div className="page-header">
            <div className="breadcrumb">
              <a onClick={() => navigate('/')}>
                <i className="bi bi-house-fill"></i>
                Trang chủ
              </a>
              <i className="bi bi-chevron-right"></i>
              <span>Bài viết sức khỏe</span>
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
            <Link 
              to={`/articles/${featured.slug}`} 
              className="featured-card"
            >
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

          {/* Grid/List cards */}
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
                style={{ animationDelay: `${idx * 0.05}s` }}
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
                </div>
                <div className="card-footer">
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