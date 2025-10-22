import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cmspageService } from '../../services/cmspageService'
import { CmsPageDTO } from '../../types/cmspage.types'
import CmsPageDetails from '../../components/admin/CmsPageDetails'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/CmsPageList.module.css'

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
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: 4, color: direction ? '#111827' : '#9ca3af' }}>
    {/* Up-arrow for 'asc' */}
    {direction === 'asc' && <path d="M18 15l-6-6-6 6" />}
    {/* Down-arrow for 'desc' */}
    {direction === 'desc' && <path d="M6 9l6 6 6-6" />}
  </svg>
);

export default function CmsPageList() {
  const SESSION_STORAGE_KEY = 'cmsPageListState';

  // Helper to get initial state from sessionStorage or defaults
  const getInitialState = () => {
    try {
      const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse saved state:", error);
    }
    // Default state
    return {
      page: 1,
      pageSize: 5,
      search: '',
      status: 'all',
      from: '',
      to: '',
      sortBy: 'createdAt',
      sortDir: 'desc',
    };
  };

  const [items, setItems] = useState<CmsPageDTO[]>([])
  const [viewing, setViewing] = useState<CmsPageDTO | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Initialize all states from sessionStorage or defaults
  const [page, setPage] = useState(getInitialState().page);
  const [pageSize, setPageSize] = useState(getInitialState().pageSize);
  const [search, setSearch] = useState(getInitialState().search);
  const [appliedSearch, setAppliedSearch] = useState(getInitialState().search);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>(getInitialState().status);
  const [dateFrom, setDateFrom] = useState(getInitialState().from);
  const [dateTo, setDateTo] = useState(getInitialState().to);
  const [sortBy, setSortBy] = useState(getInitialState().sortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(getInitialState().sortDir);

  const [suggestions, setSuggestions] = useState<CmsPageDTO[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  const { showToast } = useToast()
  const navigate = useNavigate()

  const load = async () => {
    // Fetch all items for client-side filtering
    const r = await cmspageService.list(1, 9999)
    setItems(r.items)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
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
      from: dateFrom,
      to: dateTo,
      sortBy,
      sortDir: sortDirection,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [page, pageSize, appliedSearch, statusFilter, dateFrom, dateTo, sortBy, sortDirection]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setAppliedSearch(value); // Áp dụng tìm kiếm ngay khi người dùng nhập
    if (page !== 1) setPage(1); // Reset về trang đầu tiên khi có tìm kiếm mới
    if (value.trim()) {
      const filteredSuggestions = items.filter(item =>
        item.pageTitle.toLowerCase().includes(value.toLowerCase()) ||
        (item.pageSlug && item.pageSlug.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 5);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: CmsPageDTO) => {
    setSearch(suggestion.pageTitle);
    setSuggestions([]);
    setShowSuggestions(false);
    setAppliedSearch(suggestion.pageTitle);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc'); // Default to descending
    }
  }

  const processedItems = useMemo(() => {
    let filtered = [...items];

    // Status filter
    if (statusFilter !== 'all') {
      const isPublished = statusFilter === 'published';
      filtered = filtered.filter(item => item.isPublished === isPublished);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => {
        const itemDate = new Date((item as any).createdAt);
        return itemDate >= fromDate;
      });
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const itemDate = new Date((item as any).createdAt);
        return itemDate <= toDate;
      });
    }

    // Search filter
    if (appliedSearch.trim()) {
      const searchTerm = appliedSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.pageTitle.toLowerCase().includes(searchTerm) ||
        (item.pageSlug && item.pageSlug.toLowerCase().includes(searchTerm))
      );
    }

    // Sorting logic
    filtered.sort((a, b) => {
      const valA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const valB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, appliedSearch, statusFilter, dateFrom, dateTo, sortBy, sortDirection]);

  const handleViewDetails = async (pageId: string) => {
    setLoadingDetails(true);
    setViewing({ id: pageId } as CmsPageDTO); // Đặt tạm để modal mở ra
    try {
      const fullPage = await cmspageService.get(pageId);
      setViewing(fullPage);
    } catch (error) {
      console.error("Failed to load page details:", error);
      showToast('Không thể tải chi tiết trang', 'error');
      setViewing(null); // Đóng modal nếu có lỗi
    } finally {
      setLoadingDetails(false);
    }
  }

  const onCreate = () => navigate('/app/manager/cms-pages/new')
  const onEdit = (p: CmsPageDTO) => navigate(`/app/manager/cms-pages/edit/${p.id}`)
  
  const handleStatusChange = async (pageToUpdate: CmsPageDTO, newStatus: boolean) => {
    // Prevent update if status is already the same
    if (pageToUpdate.isPublished === newStatus) return;

    const actionText = newStatus ? 'xuất bản' : 'ngừng xuất bản';
    if (!confirm(`Bạn có chắc muốn ${actionText} trang này không?`)) {
      return; 
    }

    try {
      // Tạo payload sạch chỉ với các trường mà API update mong đợi
      const payload = {
        pageTitle: pageToUpdate.pageTitle,
        pageSlug: pageToUpdate.pageSlug,
        pageContent: pageToUpdate.pageContent,
        metaTitle: pageToUpdate.metaTitle,
        metaDescription: pageToUpdate.metaDescription,
        authorId: '1A2C1A65-7B00-415F-8164-4FC3C1054203', // Sử dụng authorId mặc định
        isPublished: newStatus,
        publishedAt: newStatus ? new Date().toISOString() : undefined,
      };

      await cmspageService.update(pageToUpdate.id, payload as any);
      showToast(`Đã ${actionText} trang thành công.`);
      await load(); // Tải lại danh sách để cập nhật UI
    } catch (error) {
      console.error("Failed to update page status:", error);
      showToast('Không thể cập nhật trạng thái trang.', 'error');
    }
  }

  const pill = (p: CmsPageDTO) => {
    const text = p.isPublished ? 'Đang hoạt động' : 'Ngừng hoạt động';
    const bg = p.isPublished ? '#e7f9ec' : '#fff7e6'
    const color = p.isPublished ? '#16a34a' : '#b45309'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '-'

  // Frontend Pagination
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = processedItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Trang (CMS)</h1>
        <button onClick={onCreate} className={styles.createButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tạo mới
        </button>
      </div>

      {/* Filter Section */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGrid}>
          <div ref={searchContainerRef} className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tìm kiếm</label>
            <input
              placeholder="Tìm theo tiêu đề..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className={styles.filterInput}
            />
            {showSuggestions && (
              <div className={styles.suggestionsContainer}>
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)} className={styles.suggestionItem}>
                    {suggestion.pageTitle}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`${styles.filterGroup} ${styles.status}`}>
            <label className={styles.filterLabel}>Trạng thái</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} className={styles.filterSelect}>
              <option value="all">Tất cả</option>
              <option value="published">Đang hoạt động</option>
              <option value="draft">Ngừng hoạt động</option>
            </select>
          </div>
          <div className={`${styles.filterGroup} ${styles.date}`}>
            <label className={styles.filterLabel}>Từ ngày</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={styles.filterInput} />
          </div>
          <div className={`${styles.filterGroup} ${styles.date}`}>
            <label className={styles.filterLabel}>Đến ngày</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={styles.filterInput} />
          </div>
          <div>
            <button onClick={() => {
              setSearch(''); setAppliedSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); if (page !== 1) setPage(1);
            }} className={styles.filterButton}>
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
                <th className={`${styles.th} ${styles.center}`}>STT</th>
                <th className={styles.th}>Tiêu đề</th>
                <th className={styles.th}>Slug</th>
                <th className={styles.th}>Tác giả</th>
                <th className={styles.th}>Trạng thái</th>
                <th onClick={() => handleSort('createdAt')} className={`${styles.th} ${styles.sortable}`}>Ngày tạo <SortIcon direction={sortBy === 'createdAt' ? sortDirection : undefined} /></th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((p, index) => (
                <tr key={p.id}>
                  <td className={`${styles.td} ${styles.center}`}>
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className={`${styles.td} ${styles.title}`}>{p.pageTitle}</td>
                  <td className={styles.td}>{p.pageSlug}</td>
                  <td className={styles.td}>{p.authorName ?? '-'}</td>
                  <td className={styles.td}>
                    <select 
                      value={p.isPublished ? 'published' : 'draft'} 
                      onChange={(e) => handleStatusChange(p, e.target.value === 'published')}
                      className={`${styles.statusSelect} ${p.isPublished ? styles.statusSelectActive : styles.statusSelectInactive}`}
                    >
                      <option value="published">Đang hoạt động</option>
                      <option value="draft">Ngừng hoạt động</option>
                    </select>
                  </td>
                  <td className={styles.td}>{fmtDate((p as any).createdAt)}</td>
                  <td className={`${styles.td} ${styles.actions}`}>
                    <button onClick={() => handleViewDetails(p.id)} disabled={loadingDetails} title="Xem" className={styles.actionButton}><ViewIcon /></button>
                    <button onClick={() => onEdit(p)} title="Sửa" className={styles.actionButton}><EditIcon /></button>
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
            <select id="pageSize" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className={styles.filterSelect} style={{ width: 'auto' }}>
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
        <CmsPageDetails page={viewing} isLoading={loadingDetails} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}