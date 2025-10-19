import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { ArticleDTO } from '../../types/article.types'
import ArticleDetails from '../../components/admin/ArticleDetails'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import { useToast } from '../../contexts/ToastContext'

// SVG Icons for actions
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4b5563' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4b5563' }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: 4, color: direction ? '#111827' : '#9ca3af' }}>
    {direction === 'asc' && <path d="M12 5l-7 7h14z" transform="rotate(180 12 12)" />}
    {direction !== 'asc' && <path d="M12 5l-7 7h14z" />}
  </svg>
);
export default function ArticleList() {
  const [items, setItems] = useState<ArticleDTO[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [viewing, setViewing] = useState<ArticleDTO | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [allCategories, setAllCategories] = useState<CategoryDTO[]>([])

  // filter/search UI
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('') // State for the actual filtering
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'PUBLISHED', 'DRAFT'
  const [categoryFilterIds, setCategoryFilterIds] = useState<string[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [suggestions, setSuggestions] = useState<ArticleDTO[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryFilterRef = React.useRef<HTMLDivElement>(null)
  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  // sorting
  const [sortBy, setSortBy] = useState('publishedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
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
  }, []) // Load categories and all articles once on mount

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

  // Scroll to top on page or page size change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, pageSize]);

  const onCreate = () => navigate('/manager/articles/new')
  const onEdit = (a: ArticleDTO) => navigate(`/manager/articles/edit/${a.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await articleService.remove(id);
    showToast('Xóa bài viết thành công!')
    await load()
  }

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
    setAppliedSearch(value); // Áp dụng tìm kiếm ngay khi người dùng nhập
    setPage(1); // Reset về trang đầu tiên khi có tìm kiếm mới

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
    const isPublished = (statusCode ?? '').toLowerCase().includes('publ');
    const text = isPublished ? 'Đã xuất bản' : 'Bản nháp';
    const bg = isPublished ? '#e7f9ec' : '#fff7e6';
    const color = isPublished ? '#16a34a' : '#b45309';
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500 }}>{text}</span>;
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
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Quản lý Bài viết</h1>
        <button
          onClick={onCreate}
          style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tạo mới
        </button>
      </div>

      {/* Filter Section */}
     <div
  style={{
    marginBottom: 24,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 20,
  }}
>
  <div
    style={{
      display: "flex",
      gap: 16,
      alignItems: "end",
      flexWrap: "wrap",
    }}
  >
    {/* Ô tìm kiếm */}
    <div
      ref={searchContainerRef}
      style={{
        flex: "3 1 300px",
        minWidth: 260,
        position: "relative",
      }}
    >
      <label
        style={{
          fontSize: 14,
          color: "#4b5563",
          marginBottom: 6,
          display: "block",
        }}
      >
        Tìm kiếm
      </label>
      <input
        placeholder="Tìm theo tiêu đề..."
        value={search}
        onChange={e => handleSearchChange(e.target.value)}
        style={{
          width: "80%",
          padding: "10px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
        }}
      />
      {showSuggestions && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0 0 8px 8px",
            zIndex: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            marginTop: "-1px",
          }}
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 14,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f9fafb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {suggestion.title}
            </div>
          ))}
        </div>
      )}
    </div>

    

    {/* Trạng thái */}
    <div
      style={{
        flex: "1 1 180px",
        minWidth: 160,
      }}
    >
      <label
        style={{
          fontSize: 14,
          color: "#4b5563",
          marginBottom: 6,
          display: "block",
        }}
      >
        Trạng thái
      </label>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as any)}
        style={{
          padding: 10,
          width: "100%",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="PUBLISHED">Đã xuất bản</option>
        <option value="DRAFT">Bản nháp</option>
      </select>
    </div>

    {/* Từ ngày */}
    <div
      style={{
        flex: "1 1 160px",
        minWidth: 120,
      }}
    >
      <label
        style={{
          fontSize: 14,
          color: "#4b5563",
          marginBottom: 6,
          display: "block",
        }}
      >
        Từ ngày
      </label>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        style={{
          padding: 9,
          width: "80%",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
        }}
      />
    </div>

    {/* Đến ngày */}
    <div
      style={{
        flex: "1 1 160px",
        minWidth: 120,
      }}
    >
      <label
        style={{
          fontSize: 14,
          color: "#4b5563",
          marginBottom: 6,
          display: "block",
        }}
      >
        Đến ngày
      </label>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        style={{
          padding: 9,
          width: "80%",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
        }}
      />
    </div>

    {/* Nút thao tác */}
    <div
      style={{
        display: "flex",
        gap: 8,
        flex: "0 0 auto",
      }}
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
        style={{
          padding: "10px 20px",
          background: "#fff",
          color: "#2563eb",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Xóa
      </button>
    </div>
  </div>
</div>


      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {paginatedItems.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '50px' }}>STT</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>Ảnh</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiêu đề</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Danh mục</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                <th onClick={() => handleSort('publishedAt')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Ngày đăng <SortIcon direction={sortBy === 'publishedAt' ? sortDirection : undefined} /></th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((a, index) => (
                <tr key={a.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: 14, textAlign: 'center' }}>
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ width: 100, height: 56, background: '#f0f2f5', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {a.thumbnailUrl ? <img src={a.thumbnailUrl} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: '#6b7280' }}>No Image</span>}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14, maxWidth: 250 }}>{a.title}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14, maxWidth: 200 }}>{getCategoryNames(a)}</td>
                  <td style={{ padding: '16px' }}>{pill(a.statusCode)}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{fmtDate(a.publishedAt ?? a.createdAt)}</td>
                  <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => handleViewDetails(a.id)} disabled={loadingDetails} title="Xem" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><ViewIcon /></button>
                    <button onClick={() => onEdit(a)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                    <button onClick={() => onDelete(a.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><DeleteIcon /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            Không tìm thấy kết quả
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#4b5563', fontSize: 14 }}>
        <div>
          Hiển thị {paginatedItems.length} trên tổng số {totalItems} kết quả
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="pageSize" style={{ fontSize: 14 }}>Số mục:</label>
            <select id="pageSize" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: page <= 1 ? 0.6 : 1 }}>
              Trang trước
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', opacity: page >= totalPages ? 0.6 : 1 }}>
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
