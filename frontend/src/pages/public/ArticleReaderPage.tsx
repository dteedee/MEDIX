import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/public/ArticleReaderPage.css';
import homeStyles from '../../styles/public/home.module.css';
import { articleService } from '../../services/articleService';
import { categoryService } from '../../services/categoryService';
import type { ArticleDTO } from '../../types/article.types';
import type { CategoryDTO } from '../../types/category.types';
import Pagination from '../../components/layout/Pagination';
import { useLanguage } from '../../contexts/LanguageContext';
import ChatbotBubble from '../../components/ChatbotBubble';
import BackToTopButton from '../../components/BackToTopButton';

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
}

export default function ArticleReaderPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [categoryCounts, setCategoryCounts] = useState<{ [catId: string]: number }>({});
  const [totalValid, setTotalValid] = useState(0);
  const [validArticles, setValidArticles] = useState<ArticleDTO[]>([]);

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

  useEffect(() => {
    (async () => {
      try {
        const { items } = await categoryService.list(1, 9999);
        setCategories(items.filter(cat => cat.isActive === true));
      } catch (err) {
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ items: allCategories }, { items: allArticles }] = await Promise.all([
          categoryService.list(1, 9999),
          articleService.list(1, 9999)
        ]);
        
        const activeCategories = allCategories.filter(cat => cat.isActive === true);
        const activeCategoryIds = new Set(activeCategories.map(cat => cat.id));
        
        const valid = allArticles.filter(a => {
          const isPublished = String(a.statusCode).toLowerCase() === 'published';
          const hasActiveCategory = Array.isArray(a.categoryIds) && 
            a.categoryIds.length > 0 && 
            a.categoryIds.some(cid => activeCategoryIds.has(cid));
          return isPublished && hasActiveCategory;
        });
        
        setValidArticles(valid);
        setTotalValid(valid.length);
        
        // Đếm cho từng category active (chỉ đếm articles có category đó)
        const catCounts: { [catId: string]: number } = {};
        for(const a of valid) {
          (a.categoryIds || []).forEach(cid => {
            // Chỉ đếm nếu category đó đang active
            if (activeCategoryIds.has(cid)) {
              catCounts[cid] = (catCounts[cid] || 0) + 1;
            }
          });
        }
        setCategoryCounts(catCounts);
      } catch {
        setValidArticles([]); setTotalValid(0); setCategoryCounts({});
      }
      setLoading(false);
    })();
  }, []);

  const filteredArticles = useMemo(() => {
    let arr = validArticles;
    if (debounced) {
      const key = debounced.toLowerCase();
      arr = arr.filter(a =>
        a.title?.toLowerCase().includes(key)
        || a.summary?.toLowerCase().includes(key)
        || a.content?.toLowerCase().includes(key)
      );
    }
    if (selectedCategoryId !== 'all') {
      arr = arr.filter(a => (a.categoryIds || []).includes(String(selectedCategoryId)));
    }
    // Sort by date: newest first
    return arr.slice().sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });
  }, [validArticles, debounced, selectedCategoryId]);

  const pagedArticles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredArticles.length / pageSize)),
    [filteredArticles.length, pageSize]
  );

  const activeCategory = selectedCategoryId !== 'all'
    ? categories.find(c => c.id === selectedCategoryId)
    : null;

  const featured: ArticleDTO | undefined = useMemo(() => {
    if (debounced) return undefined;
    if (selectedCategoryId !== 'all') {
      // Chỉ featured bài đầu tiên thật sự thuộc danh mục đang chọn
      return filteredArticles.find(a => (a.categoryIds || []).includes(String(selectedCategoryId)));
    }
    return filteredArticles[0];
  }, [debounced, filteredArticles, selectedCategoryId]);

  const featuredTag =
    activeCategory?.name ||
    (featured?.categories?.[0]?.name || "Sức khoẻ");

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

  const formatDate = useCallback(
    (input?: string | null) => {
      if (!input) return '';
      const locale = language === 'vi' ? 'vi-VN' : 'en-US';
      const d = new Date(input);
      return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    [language]
  );

  const getReadingTimeText = useCallback(
    (content?: string | null) => {
      const WORDS_PER_MINUTE = 200;
      if (!content) {
        return t('articleReader.readingTime', { minutes: '1' });
      }
      const plainText = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const words = plainText ? plainText.split(' ').length : 0;
      const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
      return t('articleReader.readingTime', { minutes: String(minutes) });
    },
    [t]
  );

  return (
    <div className="article-reader-page">
      {/* Navigation */}
      <nav className={homeStyles["navbar"]}>
        <ul className={homeStyles["nav-menu"]}>
          <li>
            <a
              onClick={() => { scrollToTop(); navigate('/'); }}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/' ? homeStyles["active"] : ''}`}
            >
              {t('nav.home')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => { scrollToTop(); navigate('/ai-chat'); }}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/ai-chat' ? homeStyles["active"] : ''}`}
            >
              {t('nav.ai-diagnosis')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => { scrollToTop(); navigate('/specialties'); }}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/specialties' ? homeStyles["active"] : ''}`}
            >
              {t('nav.specialties')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => { scrollToTop(); navigate('/doctors'); }}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/doctors' ? homeStyles["active"] : ''}`}
            >
              {t('nav.doctors')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => { scrollToTop(); navigate('/articles'); }}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/articles' ? homeStyles["active"] : ''}`}
            >
              {t('nav.health-articles')}
            </a>
          </li>
          <li><span>|</span></li>
          <li>
            <a
              onClick={() => { scrollToTop(); navigate('/about'); }}
              className={`${homeStyles["nav-link"]} ${window.location.pathname === '/about' ? homeStyles["active"] : ''}`}
            >
              {t('nav.about')}
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
              {t('articleReader.sidebar.categories')}
            </div>
            <ul className="category-list">
              <li>
                <button className={`category-item ${selectedCategoryId === 'all' ? 'active' : ''}`} onClick={() => { scrollToTop(); handleSelectCategory('all'); }}>
                  <span className="category-icon"><i className="bi bi-grid-3x3-gap-fill"></i></span>
                  <span>{t('articleReader.sidebar.all')}</span>
                  <span className="category-badge">{validArticles.length}</span>
                </button>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <button
                    className={`category-item ${selectedCategoryId === c.id ? 'active' : ''}`}
                    onClick={() => { scrollToTop(); handleSelectCategory(c.id); }}
                  >
                    <span className="category-icon"><i className={`bi ${getCategoryIcon(c.name)}`}></i></span>
                    <span>{c.name}</span>
                    <span className="category-badge">{categoryCounts[c.id] || 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* View mode toggle */}
          <div className="sidebar-card view-mode-card">
            <div className="sidebar-title">
              <i className="bi bi-layout-three-columns"></i>
              {t('articleReader.sidebar.viewMode')}
            </div>
            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <i className="bi bi-grid-3x3-gap-fill"></i>
                {t('articleReader.sidebar.view.grid')}
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <i className="bi bi-list-ul"></i>
                {t('articleReader.sidebar.view.list')}
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
                  placeholder={t('articleReader.search.placeholder')}
                />
                {search && (
                  <button className="clear-btn" onClick={() => setSearch('')} aria-label={t('articleReader.search.clearAria')}>
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="stats-bar">
              <div className="stat-item">
                <i className="bi bi-file-earmark-text-fill"></i>
                <span>{t('articleReader.stats.total', { count: String(totalValid) })}</span>
              </div>
              {selectedCategoryId !== 'all' && (
                <div className="stat-item active-filter">
                  <i className="bi bi-funnel-fill"></i>
                  <span>{t('articleReader.stats.filter')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Featured */}
          {featured && (
            <Link to={`/articles/${featured.slug}`} className="featured-card">
              <div className="featured-badge">
                <i className="bi bi-star-fill"></i>
                {t('articleReader.featured.badge')}
              </div>
              <div className="featured-image">
                <img src={featured.coverImageUrl || featured.thumbnailUrl || '/images/medix-logo.png'} alt={featured.title} />
                <div className="featured-overlay"></div>
              </div>
              <div className="featured-content">
                <div className="featured-tags">
                  <span className="tag">
                    <i className="bi bi-bookmark-fill"></i>
                    {featuredTag}
                  </span>
                </div>
                <h2 className="featured-title">{featured.title}</h2>
                {featured.summary && <p className="featured-summary">{featured.summary}</p>}
                <div className="featured-meta">
                  <div className="meta-item">
                    <i className="bi bi-calendar3"></i>
                    <span>{formatDate(featured.publishedAt)}</span>
                  </div>
                  <div className="meta-item">
                    <i className="bi bi-clock"></i>
                    <span>{getReadingTimeText(featured.content)}</span>
                  </div>
                  <span className="read-more">
                    {t('articleReader.featured.readNow')}
                    <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Articles section */}
          <div className="section-header">
            <h3 className="section-title">{t('articleReader.section.latest')}</h3>
            <div className="section-count">{t('articleReader.section.count', { count: String(rest.length) })}</div>
          </div>

          <section className={`card-container ${viewMode}`}>
            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>{t('articleReader.loading')}</p>
              </div>
            )}
            {!loading && rest.length === 0 && (
              <div className="empty-state">
                <i className="bi bi-inbox"></i>
                <h3>{t('articleReader.empty.title')}</h3>
                <p>{t('articleReader.empty.description')}</p>
              </div>
            )}
            {!loading && rest.map((a, idx) => (
              <button
                key={a.id}
                className="article-card"
                style={{ animationDelay: `${idx * 0.04}s` }}
                onClick={() => { scrollToTop(); navigate(`/articles/${a.slug}`); }}
              >
                <div className="card-thumb">
                  <img src={a.thumbnailUrl || a.coverImageUrl || '/images/medix-logo.png'} alt={a.title} />
                  <div className="thumb-overlay">
                    <i className="bi bi-eye-fill"></i>
                    {t('articleReader.card.preview')}
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
                      {formatDate(a.publishedAt)}
                    </span>
                    <span className="meta-reading">
                      <i className="bi bi-book"></i>
                      {getReadingTimeText(a.content)}
                    </span>
                  </div>
                  <span className="cta-link">
                    {t('articleReader.card.readMore')}
                    <i className="bi bi-arrow-right-short"></i>
                  </span>
                </div>
              </button>
            ))}
          </section>

          {/* Pagination */}
          {!loading && filteredArticles.length > 0 && (
            <div className="pagination-wrapper">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </main>
      </div>
      <BackToTopButton />
      <ChatbotBubble />
    </div>
  );
}