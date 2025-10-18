import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cmspageService } from '../../services/cmspageService'
import { CmsPageDTO } from '../../types/cmspage.types'
import CmsPageDetails from '../../components/admin/CmsPageDetails'
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
    {/* Up-arrow for 'asc' */}
    {direction === 'asc' && <path d="M18 15l-6-6-6 6" />}
    {/* Down-arrow for 'desc' */}
    {direction === 'desc' && <path d="M6 9l6 6 6-6" />}
  </svg>
);

export default function CmsPageList() {
  const [items, setItems] = useState<CmsPageDTO[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [viewing, setViewing] = useState<CmsPageDTO | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Search and suggestion state
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [suggestions, setSuggestions] = useState<CmsPageDTO[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  // Sorting state
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

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

  // Scroll to top on page or page size change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, pageSize]);

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

  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    setAppliedSearch(search);
    setShowSuggestions(false);
  }

  const handleSearchChange = (value: string) => {
    setSearch(value);
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

  const onCreate = () => navigate('/manager/cms-pages/new')
  const onEdit = (p: CmsPageDTO) => navigate(`/manager/cms-pages/edit/${p.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    await cmspageService.remove(id);
    showToast('Xóa trang thành công!')
    await load() 
  }

  const pill = (p: CmsPageDTO) => {
    const text = p.isPublished ? 'Đang hoạt động' : 'Nháp'
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
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Quản lý Trang (CMS)</h1>
        <button
          onClick={onCreate}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Tạo mới
        </button>
      </div>

      {/* Filter Section */}
      <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'end' }}>
          <div ref={searchContainerRef} style={{ flex: '2 1 250px', position: 'relative' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Tìm kiếm</label>
            <input
              placeholder="Tìm theo tiêu đề..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              style={{ width: '80%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
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
                    {suggestion.pageTitle}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Trạng thái</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} style={{ padding: 10, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="all">Tất cả</option>
              <option value="published">Đang hoạt động</option>
              <option value="draft">Nháp</option>
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Từ ngày</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: 9, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 6, display: 'block' }}>Đến ngày</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: 9, width: '100%', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <button onClick={handleSearch} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 500, cursor: 'pointer' }}>
              Tìm
            </button>
          </div>
          <div>
            <button onClick={() => { 
              setSearch(''); setAppliedSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); setPage(1); 
            }} style={{ padding: '10px 20px', background: '#fff', color: '#374151', borderRadius: 8, border: '1px solid #d1d5db', fontWeight: 500, cursor: 'pointer' }}>
              Xóa
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
        {paginatedItems.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>STT</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiêu đề</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slug</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tác giả</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                <th onClick={() => handleSort('createdAt')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>Ngày tạo <SortIcon direction={sortBy === 'createdAt' ? sortDirection : undefined} /></th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((p, index) => (
                <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: 14, textAlign: 'center' }}>
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14 }}>{p.pageTitle}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{p.pageSlug}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{p.authorName ?? '-'}</td>
                  <td style={{ padding: '16px' }}>{pill(p)}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{fmtDate((p as any).createdAt)}</td>
                  <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => handleViewDetails(p.id)} disabled={loadingDetails} title="Xem" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><ViewIcon /></button>
                    <button onClick={() => onEdit(p)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                    <button onClick={() => onDelete(p.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><DeleteIcon /></button>
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
        <CmsPageDetails page={viewing} isLoading={loadingDetails} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
