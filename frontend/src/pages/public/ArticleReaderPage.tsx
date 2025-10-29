import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArticleDTO } from '../../types/article.types'
import '../../styles/public/ArticleReaderPage.css'

export default function ArticleReaderPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialPage = parseInt(queryParams.get('page') || '1', 10) || 1;
  const initialCategories = queryParams.get('categories')?.split(',') || [];

  const [allArticles, setAllArticles] = useState<ArticleDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(true)
  // State for search suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ArticleDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // State for category filter
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories.filter(Boolean));
  const pageSize = 5 // 1 featured + 4 grid items per page

  const LikeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
         fill="currentColor" 
         stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
         style={{ color: 'red', marginRight: '4px' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );

  const loadAllArticles = async () => {
    setLoading(true);
    try {
      // First, fetch a single item to get the total count from `item1`
      const initialUrl = `/api/HealthArticle/published?page=1&pageSize=1`;
      const initialRes = await fetch(initialUrl);
      const initialResponse = await initialRes.json();
      const totalArticles = initialResponse.item1 || 0;

      if (totalArticles > 0) {
        // Now, fetch all articles in a single request
        const allUrl = `/api/HealthArticle/published?page=1&pageSize=${totalArticles}`;
        const allRes = await fetch(allUrl);
        const allResponse = await allRes.json();
        // Filter out locked articles
        const filteredArticles = (allResponse.item2 || []).filter((article: any) => !article.isLocked);
        setAllArticles(filteredArticles);
      } else {
        setAllArticles([]);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
      setAllArticles([]); // Clear articles on error
    } finally {
      setLoading(false);
    }
  }

  // Load initial articles on component mount
  useEffect(() => {
    loadAllArticles();
  }, [])

  // Effect for fetching search suggestions with debouncing
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        // Assume a new endpoint for searching articles
        const url = `/api/HealthArticle/search?q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url);
        const suggestedArticles = await res.json();
        // Filter out locked articles
        const filteredSuggestions = (suggestedArticles || []).filter((article: any) => !article.isLocked);
        setSuggestions(filteredSuggestions);
      } catch (error) {
        console.error("Failed to fetch search suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => fetchSuggestions(), 300); // 300ms delay
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Derive categories and filtered articles using useMemo for performance
  const { categories, filteredArticles } = useMemo(() => {
    const categorySet = new Set<string>();
    allArticles.forEach(article => {
      article.categories?.forEach(cat => categorySet.add(cat.name));
    });
    const categories = Array.from(categorySet).sort();

    const filtered =
      selectedCategories.length === 0
        ? allArticles
        : allArticles.filter(article =>
            // Show article if it has at least one of the selected categories
            selectedCategories.some(selectedCat =>
              article.categories?.some(articleCat => articleCat.name === selectedCat)
            )
          );

    return { categories, filteredArticles: filtered };
  }, [allArticles, selectedCategories]);

  // Paginate the filtered articles
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredArticles.slice(startIndex, startIndex + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

  const updateUrl = (newPage: number, newCategories: string[]) => {
    const params = new URLSearchParams();
    if (newCategories.length > 0) {
      params.set('categories', newCategories.join(','));
    }
    params.set('page', newPage.toString());
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrl(newPage, selectedCategories);
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const category = event.target.value;
    const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category) // Uncheck: remove from array
        : [...selectedCategories, category]; // Check: add to array
    
    setSelectedCategories(newCategories);
    setCurrentPage(1); // Reset to page 1 on filter change
    updateUrl(1, newCategories);
  };

  const totalPages = Math.ceil(filteredArticles.length / pageSize) || 1;
  const hasMore = currentPage < totalPages;

  // Show a loading indicator only on the initial page load
  if (loading) {
    return <div className="article-reader-container">Đang tải bài viết...</div>;
  }

  const featuredArticle = paginatedArticles[0];
  const otherArticles = paginatedArticles.slice(1);

  return (
    <div className="article-layout-container">
      {/* --- Cột trái: Sidebar (20%) --- */}
      <div className="article-sidebar-left">
       




       
      </div>

      {/* --- Cột giữa: Nội dung chính (60%) --- */}
      <div className="article-center-column">
        <div className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span className="separator">/</span>
          <span className="current-page">Kiến thức y khoa</span>
        </div>

        <h1 className="reader-main-title">Kiến Thức Y Khoa</h1>
        <p className="reader-main-subtitle">Khám phá các bài viết chuyên sâu về sức khỏe, dinh dưỡng và lối sống lành mạnh từ các chuyên gia hàng đầu.</p>

        <div className="article-content-wrapper">
          <div className="article-main-content">
            <div className="article-page-chunk">
              {featuredArticle && (
                <Link to={`/app/articles/${featuredArticle.slug}`} className="featured-article-link">
                  <div className="featured-article">
                    <img src={featuredArticle.coverImageUrl || featuredArticle.thumbnailUrl || '/images/placeholder.png'} alt={featuredArticle.title} />
                    <div className="featured-content">
                      <h2>{featuredArticle.title}</h2>
                      <p>{featuredArticle.summary}</p>
                      <div className="article-card-stats">
                        <LikeIcon />
                        <span>{featuredArticle.likeCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              <div className="article-grid">
                {otherArticles.map(article => (
                  <Link key={article.id} to={`/app/articles/${article.slug}`} className="article-card-link">
                    <div className="article-card">
                      <div className="article-card-image-wrapper">
                        <img src={article.thumbnailUrl || '/images/placeholder.png'} alt={article.title} className="article-card-image" />
                      </div>
                      <div className="article-card-content">
                        <span className="article-card-category">{(article.categories?.[0]?.name ?? 'Kiến thức').toUpperCase()}</span>
                        <h3 className="article-card-title">{article.title}</h3>
                        <div className="article-card-stats">
                          <LikeIcon />
                          <span>{article.likeCount ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pagination-container">
              <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="pagination-button">
                Trang trước
              </button>
              <span className="pagination-info">Trang {currentPage} / {totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={!hasMore || loading} className="pagination-button">
                Trang sau
              </button>
            </div>
          </div>

          {/* --- Cột phải: Tìm kiếm & Lọc (20%) --- */}
          <div className="article-sidebar-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <div className="search-spinner"></div>}
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map(article => (
                    <li key={article.id}>
                      <Link to={`/app/articles/${article.slug}`}>{article.title}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="category-filter-container">
              <label className="category-filter-label">Lọc theo danh mục:</label>
              <div className="category-checkbox-group">
                {categories.map(cat => (
                  <div key={cat} className="category-checkbox-item">
                    <input
                      type="checkbox"
                      id={`cat-${cat}`}
                      value={cat}
                      checked={selectedCategories.includes(cat)}
                      onChange={handleCategoryChange}
                    />
                    <label htmlFor={`cat-${cat}`}>{cat}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


