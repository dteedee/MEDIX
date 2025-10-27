import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bannerService } from '../../services/bannerService'
import { BannerDTO } from '../../types/banner.types'
import BannerDetails from './BannerDetails'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/BannerList.module.css'

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
export default function BannerList() {
  const SESSION_STORAGE_KEY = 'bannerListState';

  const getInitialState = () => {
    try {
      const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse saved state for banners:", error);
    }
    return {
      page: 1,
      pageSize: 5,
      search: '',
      status: 'all',
      sortBy: 'createdAt',
      sortDir: 'desc',
    };
  };

  const [items, setItems] = useState<BannerDTO[]>([])
  const [viewing, setViewing] = useState<BannerDTO | null>(null)

  const [page, setPage] = useState(getInitialState().page);
  const [pageSize, setPageSize] = useState(getInitialState().pageSize);
  const [search, setSearch] = useState(getInitialState().search);
  const [appliedSearch, setAppliedSearch] = useState(getInitialState().search);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(getInitialState().status);
  const [sortBy, setSortBy] = useState(getInitialState().sortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(getInitialState().sortDir);

  const [suggestions, setSuggestions] = useState<BannerDTO[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  const { showToast } = useToast()

  const load = async () => {
    // Fetch all items for client-side filtering and search suggestions
    const r = await bannerService.list(1, 9999, {})
    setItems(r.items)
  }

  const navigate = useNavigate()
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

  // Save state to sessionStorage when it changes
  useEffect(() => {
    const stateToSave = {
      page,
      pageSize,
      search: appliedSearch,
      status: statusFilter,
      sortBy,
      sortDir: sortDirection,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [page, pageSize, appliedSearch, statusFilter, sortBy, sortDirection]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setAppliedSearch(value); // Áp dụng tìm kiếm ngay khi người dùng nhập
    if (page !== 1) setPage(1); // Reset về trang đầu tiên khi có tìm kiếm mới

    if (value.trim()) {
      const filteredSuggestions = items.filter(item =>
        item.bannerTitle.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: BannerDTO) => {
    setSearch(suggestion.bannerTitle);
    setSuggestions([]);
    setShowSuggestions(false);
    setAppliedSearch(suggestion.bannerTitle);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc'); // Default to descending when changing column
    }
  }

  const processedItems = useMemo(() => {
    let filtered = [...items];

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(item => item.isActive === isActive);
    }

    if (appliedSearch.trim()) {
      const searchTerm = appliedSearch.toLowerCase();
      filtered = filtered.filter(item =>
        item.bannerTitle.toLowerCase().includes(searchTerm) ||
        item.bannerUrl?.toLowerCase().includes(searchTerm)
      );
    }

    // Sorting logic
    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof BannerDTO];
      let valB: any = b[sortBy as keyof BannerDTO];

      // Handle date strings
      if (sortBy === 'createdAt') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [items, statusFilter, appliedSearch, sortBy, sortDirection]);

  const onCreate = () => navigate('/app/manager/banners/new')
  const onEdit = (b: BannerDTO) => navigate(`/app/manager/banners/edit/${b.id}`)
  const handleStatusChange = async (bannerToUpdate: BannerDTO, newStatus: boolean) => {
    if (bannerToUpdate.isActive === newStatus) return;

    const actionText = newStatus ? 'kích hoạt' : 'ngừng hoạt động';
    if (!confirm(`Bạn có chắc muốn ${actionText} banner này không?`)) {
      return;
    }

    try {
      // Tạo payload với các trường mà backend mong đợi
      const payload: any = {
        bannerTitle: bannerToUpdate.bannerTitle ?? '',
        bannerImageUrl: bannerToUpdate.bannerImageUrl ?? null,
        bannerUrl: bannerToUpdate.bannerUrl ?? null,
        displayOrder: bannerToUpdate.displayOrder ?? 0,
        isActive: newStatus,
      };

      await bannerService.update(bannerToUpdate.id, payload);
      showToast(`Đã ${actionText} banner thành công.`);
      await load();
    } catch (error) {
      showToast('Không thể cập nhật trạng thái banner.', 'error');
    }
  }

  const pill = (active?: boolean) => {
    const isOn = Boolean(active)
    const text = isOn ? 'Đang hoạt động' : 'Ngừng'
    return <span className={`${styles.statusPill} ${isOn ? styles.statusActive : styles.statusInactive}`}>{text}</span>
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
        <h1 className={styles.title}>Quản lý Banner</h1>
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
              placeholder="Tìm theo tiêu đề"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className={styles.filterInput}
            />
            {showSuggestions && (
              <div className={styles.suggestionsContainer}>
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)} className={styles.suggestionItem}>
                    {suggestion.bannerTitle}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`${styles.filterGroup} ${styles.status}`}>
            <label className={styles.filterLabel}>Trạng thái</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} className={styles.filterSelect}>
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng</option>
            </select>
          </div>
          <div>
            <button onClick={() => { setSearch(''); setAppliedSearch(''); setStatusFilter('all'); if (page !== 1) setPage(1); }} className={styles.filterButton}>
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
                <th className={styles.th}>Link</th>
                <th className={`${styles.th} ${styles.center}`}>Thứ tự</th>
                <th className={styles.th}>Trạng thái</th>
                <th onClick={() => handleSort('createdAt')} className={`${styles.th} ${styles.sortable}`}>Ngày tạo <SortIcon direction={sortBy === 'createdAt' ? sortDirection : undefined} /></th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
                {paginatedItems.map((b, index) => (
                  <tr key={b.id}>
                    <td className={`${styles.td} ${styles.center}`}>
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.thumbnailContainer}>
                        {b.bannerImageUrl ? <img src={b.bannerImageUrl} alt={b.bannerTitle} className={styles.thumbnail} /> : <span className={styles.noImage}>No Image</span>}
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.title}`}>{b.bannerTitle}</td>
                    <td className={`${styles.td} ${styles.link}`}>
                      <a href={b.bannerUrl} target="_blank" rel="noopener noreferrer">{b.bannerUrl}</a>
                    </td>
                    <td className={`${styles.td} ${styles.center}`}>{b.displayOrder ?? '-'}</td>
                    <td className={styles.td}>
                      <select
                        value={b.isActive ? 'active' : 'inactive'}
                        onChange={(e) => handleStatusChange(b, e.target.value === 'active')}
                        className={`${styles.statusSelect} ${b.isActive ? styles.statusSelectActive : styles.statusSelectInactive}`}
                      >
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Ngừng</option>
                      </select>
                    </td>
                    <td className={styles.td}>{fmtDate(b.createdAt)}</td>
                    <td className={`${styles.td} ${styles.actions}`}>
                      <button onClick={() => setViewing(b)} title="Xem" className={styles.actionButton}><ViewIcon /></button>
                      <button onClick={() => onEdit(b)} title="Sửa" className={styles.actionButton}><EditIcon /></button>
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
            <select id="pageSize" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className={styles.filterSelect} style={{ padding: '6px 10px', width: 'auto' }}>
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
        <BannerDetails banner={viewing} onClose={() => setViewing(null)} />
      )}

    </div>
  )

}