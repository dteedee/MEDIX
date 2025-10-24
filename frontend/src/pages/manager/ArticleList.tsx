import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { articleService, ArticleFormPayload } from '../../services/articleService' // Import ArticleFormPayload
import { ArticleDTO } from '../../types/article.types'
import ArticleDetails from './ArticleDetails'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/ArticleList.module.css'

// SVG Icons for actions
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.sortIcon} data-active={!!direction}>
    {direction === 'asc' && <path d="M12 5l-7 7h14z" transform="rotate(180 12 12)" />}
    {direction !== 'asc' && <path d="M12 5l-7 7h14z" />}
  </svg>
);
export default function ArticleList() {
  const SESSION_STORAGE_KEY = 'articleListState';

  const getInitialState = () => {
    try {
      const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse saved state for articles:", error);
    }
    // Default state
    return {
      page: 1,
      pageSize: 5,
      search: '',
      status: 'all',
      category: [],
      from: '',
      to: '',
      sortBy: 'publishedAt',
      sortDir: 'desc',
    };
  };

  const [items, setItems] = useState<ArticleDTO[]>([])
  const [viewing, setViewing] = useState<ArticleDTO | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([])

  const [page, setPage] = useState(getInitialState().page);
  const [pageSize, setPageSize] = useState(getInitialState().pageSize);
  const [search, setSearch] = useState(getInitialState().search);
  const [appliedSearch, setAppliedSearch] = useState(getInitialState().search);
  const [statusFilter, setStatusFilter] = useState(getInitialState().status);
  const [categoryFilterIds, setCategoryFilterIds] = useState<string[]>(getInitialState().category);
  const [dateFrom, setDateFrom] = useState(getInitialState().from);
  const [dateTo, setDateTo] = useState(getInitialState().to);
  const [sortBy, setSortBy] = useState(getInitialState().sortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(getInitialState().sortDir);

  const [suggestions, setSuggestions] = useState<ArticleDTO[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryFilterRef = React.useRef<HTMLDivElement>(null)
  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  const { showToast } = useToast()

  const load = async () => {
    // Fetch all items once for frontend filtering
    const r = await articleService.list(1, 9999);
    setItems(r.items)
  }

  const navigate = useNavigate()
  useEffect(() => {
    categoryService.list(1, 1000).then(res => {
      setAllCategories(res.items);
      load();
    });
  }, []); // Load categories and all articles once on mount

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        categoryFilterRef.current && !categoryFilterRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      page,
      pageSize,
      search: appliedSearch,
      status: statusFilter,
      category: categoryFilterIds,
      from: dateFrom,
      to: dateTo,
      sortBy,
      sortDir: sortDirection,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [page, pageSize, appliedSearch, statusFilter, categoryFilterIds, dateFrom, dateTo, sortBy, sortDirection]);

  const onCreate = () => navigate('/app/manager/articles/new')
  const onEdit = (a: ArticleDTO) => navigate(`/app/manager/articles/edit/${a.id}`)
  const handleArchive = async (article: ArticleDTO) => {
  if (article.statusCode === 'ARCHIVE') {
    showToast('Bài viết đã được khóa.', 'info');
    return;
  }

  if (!confirm(`Bạn có chắc muốn khóa bài viết "${article.title}" không?`)) return;

  try {
    // ✅ 1. Lấy lại full dữ liệu từ backend theo ID bằng phương thức 'get'
    const fullArticle = await articleService.get(article.id);
    console.log('>>> Full Article từ backend:', fullArticle);

    let categoryIds =
      (Array.isArray(fullArticle.categoryIds) && fullArticle.categoryIds.length > 0)
        ? fullArticle.categoryIds
        : (Array.isArray(fullArticle.categories) && fullArticle.categories.length > 0)
          ? fullArticle.categories.map(c => c.id).filter(Boolean)
          : [];
    if (categoryIds.length === 0) {
      categoryIds = ['4531ED5F-2DB8-4B56-A38C-3C320F555922'];
    }


    const payload: ArticleFormPayload = { // Use the new payload type
      title: fullArticle.title ?? 'Không có tiêu đề',
      slug: fullArticle.slug ?? 'khong-co-slug',
      summary: fullArticle.summary ?? '',
      content: fullArticle.content ?? '*', 
      displayType: fullArticle.displayType ?? 'default',
      thumbnailUrl: fullArticle.thumbnailUrl ?? '',
      coverImageUrl: fullArticle.coverImageUrl ?? '',
      isHomepageVisible: fullArticle.isHomepageVisible ?? false,
      displayOrder: fullArticle.displayOrder ?? 0,
      metaTitle: fullArticle.metaTitle ?? '',
      metaDescription: fullArticle.metaDescription ?? '',
      authorId:
        (fullArticle as any).authorId ??
        '1A2C1A65-7B00-415F-8164-4FC3C1054203',
      publishedAt: fullArticle.publishedAt ?? undefined,
      categoryIds: categoryIds,
      statusCode: 'ARCHIVE',
    };

    console.log('🧾 Payload gửi lên backend:', payload);

    // ✅ 4. Gửi update
    await articleService.update(article.id, payload);
    showToast('Đã chuyển bài viết vào kho lưu trữ.', 'success');
    await load();
  } catch (error: any) {
    console.error('🚨 Failed to archive article:', error);
    if (error.response?.data?.errors) {
      console.error('🧩 Backend validation errors:', error.response.data.errors);
    }
    showToast('Lưu trữ bài viết thất bại.', 'error');
  }
};



  const handleViewDetails = async (articleId: string) => {
    setLoadingDetails(true);
    setViewing({ id: articleId } as ArticleDTO); // Set a temporary object to open the modal
    try {
      // Gọi service để lấy chi tiết đầy đủ của bài viết
      const fullArticle = await articleService.get(articleId);
      setViewing(fullArticle); // Update with full data
    } catch (error) {
      console.error("Failed to load article details:", error);
      showToast('Không thể tải chi tiết bài viết', 'error');
    } finally {
      setLoadingDetails(false);
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setAppliedSearch(value);

    if (value.trim() && !appliedSearch.trim()) {
      if (page !== 1) setPage(1);
    }

    if (value.trim()) {
      // Suggestions should be based on the full, unfiltered list
      const filteredSuggestions = items.filter(item => 
        item.title.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Show top 5 suggestions
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: ArticleDTO) => {
    setSearch(suggestion.title);
    setSuggestions([]);
    setShowSuggestions(false);
    setAppliedSearch(suggestion.title);
    if (page !== 1) setPage(1);
  };

  const processedItems = useMemo(() => {
    let filtered = [...items];

    // 1. Filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.statusCode === statusFilter);
    }
    // Category filtering
    if (categoryFilterIds.length > 0) {
      filtered = filtered.filter(item =>
        categoryFilterIds.some(filterId => (item.categoryIds ?? []).includes(filterId))
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.publishedAt ?? item.createdAt!);
        return itemDate >= fromDate;
      });
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.publishedAt ?? item.createdAt!);
        return itemDate <= toDate;
      });
    }

    // 2. Sorting
    filtered.sort((a, b) => {
      const valA = a.publishedAt ?? a.createdAt!;
      const valB = b.publishedAt ?? b.createdAt!;
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // 3. Search term filtering (after other filters)
    if (appliedSearch.trim()) {
      return filtered.filter(item => item.title.toLowerCase().includes(appliedSearch.toLowerCase()));
    }
    return filtered;
  }, [items, statusFilter, categoryFilterIds, dateFrom, dateTo, sortBy, sortDirection, appliedSearch]);

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '-'

  const pill = (statusCode?: string) => {
    let text = 'Bản nháp';
    let bg = '#fff7e6'; // yellow-100
    let color = '#b45309'; // yellow-700

    if (statusCode === 'PUBLISHED') {
      return <span className={`${styles.statusPill} ${styles.statusPublished}`}>Đã xuất bản</span>;
    } else if (statusCode === 'ARCHIVE') {
      return <span className={`${styles.statusPill} ${styles.statusArchive}`}>Khóa</span>;
    }
    // Default is DRAFT
    return <span className={`${styles.statusPill} ${styles.statusDraft}`}>{text}</span>;
  }

  const getCategoryNames = (article: ArticleDTO) => {
    if (article.categories?.length) {
      return article.categories.map(c => c.name).join(', ');
    }
    return (article.categoryIds || []).map(id => allCategories.find(c => c.id === id)?.name).filter(Boolean).join(', ');
  };

  // Frontend Pagination
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = processedItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Bài viết</h1>
        <button onClick={onCreate} className={styles.createButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tạo mới
        </button>
      </div>

      {/* Filter Section */}
     <div
  className={styles.filterContainer}
>
  <div
    className={styles.filterGrid}
  >
    {/* Ô tìm kiếm */}
    <div
      ref={searchContainerRef}
      className={styles.filterGroup}
    >
      <label
        className={styles.filterLabel}
      >
        Tìm kiếm
      </label>
      <input
        placeholder="Tìm theo tiêu đề..."
        value={search}
        onChange={e => handleSearchChange(e.target.value)}
        className={styles.filterInput}
      />
      {showSuggestions && (
        <div
          className={styles.suggestionsContainer}
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={styles.suggestionItem}
            >
              {suggestion.title}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Trạng thái */}
    <div
      className={`${styles.filterGroup} ${styles.status}`}
    >
      <label
        className={styles.filterLabel}
      >
        Trạng thái
      </label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as any)}
        className={styles.filterSelect}
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="PUBLISHED">Đã xuất bản</option>
        <option value="DRAFT">Bản nháp</option>
        <option value="ARCHIVE">Khóa</option>
      </select>
    </div>

    {/* Từ ngày */}
    <div
      className={`${styles.filterGroup} ${styles.date}`}
    >
      <label
        className={styles.filterLabel}
      >
        Từ ngày
      </label>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className={`${styles.filterInput} ${styles.date}`}
      />
    </div>

    {/* Đến ngày */}
    <div
      className={`${styles.filterGroup} ${styles.date}`}
    >
      <label
        className={styles.filterLabel}
      >
        Đến ngày
      </label>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className={`${styles.filterInput} ${styles.date}`}
      />
    </div>

    {/* Nút thao tác */}
    <div
      className={`${styles.filterGroup} ${styles.action}`}
    >
      <button
        onClick={() => {
          // Clear all filter states
          setSearch('');
          setAppliedSearch('');
          setCategoryFilterIds([]);
          setStatusFilter('all');
          setDateFrom('');
          setDateTo('');
          setPage(1);
        }}
        className={styles.filterButton}
      >
        Xóa
      </button>
    </div>
  </div>
</div>


      {/* Table */}
      <div className={styles.tableContainer}>
        {paginatedItems.length > 0 ? (
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.th} style={{ width: '50px' }}>STT</th>
                <th className={styles.th} style={{ width: '120px' }}>Ảnh</th>
                <th className={styles.th}>Tiêu đề</th>
                <th className={styles.th}>Danh mục</th>
                <th className={styles.th}>Trạng thái</th>
                <th onClick={() => handleSort('publishedAt')} className={`${styles.th} ${styles.sortable}`}>Ngày đăng <SortIcon direction={sortBy === 'publishedAt' ? sortDirection : undefined} /></th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((a, index) => (
                <tr key={a.id}>
                  <td className={`${styles.td} ${styles.center}`}>
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.thumbnailContainer}>
                      {a.thumbnailUrl ? <img src={a.thumbnailUrl} alt={a.title} className={styles.thumbnail} /> : <span className={styles.noImage}>No Image</span>}
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.title}`}>{a.title}</td>
                  <td className={`${styles.td} ${styles.category}`}>{getCategoryNames(a)}</td>
                  <td className={styles.td}>{pill(a.statusCode)}</td>
                  <td className={styles.td}>{fmtDate(a.publishedAt ?? a.createdAt)}</td>
                  <td className={`${styles.td} ${styles.actions}`}>
                    <button onClick={() => handleViewDetails(a.id)} disabled={loadingDetails} title="Xem" className={styles.actionButton}><ViewIcon /></button>
                    <button onClick={() => onEdit(a)} title="Sửa" className={styles.actionButton}><EditIcon /></button>
                    <button onClick={() => handleArchive(a)} title="Lưu trữ" className={styles.actionButton}><DeleteIcon /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.noResults}>
            Không tìm thấy kết quả
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.paginationContainer}>
        <div>
          Hiển thị {paginatedItems.length} trên tổng số {totalItems} kết quả
        </div>
        <div className={styles.paginationControls}>
          <div className={styles.paginationPageSize}>
            <label htmlFor="pageSize">Số mục:</label>
            <select id="pageSize" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className={styles.filterSelect} style={{ padding: '6px 10px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <div className={styles.paginationControls}>
            <button onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page <= 1} className={styles.paginationButton}>
              Trang trước
            </button>
            <button onClick={() => setPage((p: number) => p + 1)} disabled={page >= totalPages} className={styles.paginationButton}>
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {viewing && (
        <ArticleDetails article={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
