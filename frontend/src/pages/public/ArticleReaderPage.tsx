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

        // Client-side category filter (backend supports IDs on each article)
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

  // Compute current page data (since we filtered client side)
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
      {/* Top navigation same as homepage */}
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
              Bài viết sức khoẻ
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
          <div className="sidebar-card">
            <div className="sidebar-title">Tìm kiếm</div>
            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm bài viết sức khoẻ..."
              />
              {search && (
                <button className="clear-btn" onClick={() => setSearch('')} aria-label="Xoá tìm kiếm">
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
            <div className="search-hint">Gõ để lọc và hiển thị ngay kết quả.</div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-title">Danh mục</div>
            <ul className="category-list">
              <li>
                <button
                  className={`category-item ${selectedCategoryId === 'all' ? 'active' : ''}`}
                  onClick={() => handleSelectCategory('all')}
                >
                  Tất cả
                </button>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <button
                    className={`category-item ${selectedCategoryId === c.id ? 'active' : ''}`}
                    onClick={() => handleSelectCategory(c.id)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main className="arp-main">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <a onClick={() => navigate('/')}>Trang chủ</a>
            <span>/</span>
            <span>Bài viết sức khoẻ</span>
          </div>

          {/* Featured */}
          {featured && (
            <Link 
              to={`/articles/${featured.slug}`} 
              className="featured-card"
              onMouseMove={(e) => {
                const el = e.currentTarget as HTMLElement;
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                el.style.setProperty('--mx', `${x}px`);
                el.style.setProperty('--my', `${y}px`);
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.removeProperty('--mx');
                el.style.removeProperty('--my');
              }}
            >
              <div className="featured-image">
                <img src={featured.coverImageUrl || featured.thumbnailUrl || '/images/medix-logo.png'} alt={featured.title} />
              </div>
              <div className="featured-content">
                <h2 className="featured-title">{featured.title}</h2>
                {featured.summary && <p className="featured-summary">{featured.summary}</p>}
                <div className="featured-meta">
                  <span>{formatViDate(featured.publishedAt)}</span>
                  <span className="read-more">Đọc thêm</span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid cards */}
          <section className="card-grid">
            {loading && <div className="loading">Đang tải...</div>}
            {!loading && rest.map(a => (
              <Link 
                key={a.id} 
                to={`/articles/${a.slug}`} 
                className="article-card"
                onMouseMove={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  el.style.setProperty('--mx', `${x}px`);
                  el.style.setProperty('--my', `${y}px`);
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.removeProperty('--mx');
                  el.style.removeProperty('--my');
                }}
              >
                <div className="thumb">
                  <img src={a.thumbnailUrl || a.coverImageUrl || '/images/medix-logo.png'} alt={a.title} />
                </div>
                <div className="card-body">
                  <h3 className="title">{a.title}</h3>
                  {a.summary && <p className="summary">{a.summary}</p>}
                </div>
                <div className="card-footer">
                  <span className="date">{formatViDate(a.publishedAt)}</span>
                  <span className="cta">Xem thêm</span>
                </div>
              </Link>
            ))}
          </section>

          {/* Pagination */}
          <div className="pagination-wrapper">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </main>
      </div>
    </div>
  );
}


