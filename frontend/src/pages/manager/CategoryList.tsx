import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import CategoryDetails from '../../components/admin/CategoryDetails'
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
export default function CategoryList() {
  const [items, setItems] = useState<CategoryDTO[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [viewing, setViewing] = useState<CategoryDTO | null>(null)

  // Search and suggestion state
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [suggestions, setSuggestions] = useState<CategoryDTO[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchContainerRef = React.useRef<HTMLDivElement>(null)

  const { showToast } = useToast()
  const navigate = useNavigate()

  const load = async () => {
    // Fetch all items for client-side filtering
    const r = await categoryService.list(1, 9999)
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
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        (item.slug && item.slug.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 5);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: CategoryDTO) => {
    setSearch(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setAppliedSearch(suggestion.name);
  };

  const processedItems = useMemo(() => {
    let filtered = [...items];

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(item => item.isActive === isActive);
    }

    if (!appliedSearch.trim()) return filtered;
    const searchTerm = appliedSearch.toLowerCase();
    return filtered.filter(item => item.name.toLowerCase().includes(searchTerm) || (item.slug && item.slug.toLowerCase().includes(searchTerm)) || (item.description && item.description.toLowerCase().includes(searchTerm)));
  }, [items, appliedSearch, statusFilter]);

  const onCreate = () => navigate('/manager/categories/new')
  const onEdit = (c: CategoryDTO) => navigate(`/manager/categories/edit/${c.id}`)
  const onDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await categoryService.remove(id);
    showToast('Xóa danh mục thành công!')
    await load() 
  }

  const pill = (active?: boolean) => {
    const isOn = Boolean(active)
    const text = isOn ? 'Đang hoạt động' : 'Ngừng'
    const bg = isOn ? '#e7f9ec' : '#fee2e2'
    const color = isOn ? '#16a34a' : '#dc2626'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  // Frontend Pagination
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = processedItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ padding: 24, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Quản lý Danh mục</h1>
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
      flexWrap: "wrap", // giúp responsive nếu thu nhỏ
    }}
  >
    {/* Ô tìm kiếm */}
    <div
      ref={searchContainerRef}
      style={{
        flex: "2 1 300px",
        position: "relative",
        minWidth: 250,
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
        placeholder="Tìm theo tên..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        style={{
          width: "70%",
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
              {suggestion.name}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Ô lọc trạng thái */}
    <div style={{ flex: "1 1 200px", minWidth: 180 }}>
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
        onChange={(e) => {
          setStatusFilter(e.target.value as any);
          setPage(1);
        }}
        style={{
          padding: 10,
          width: "100%",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          fontSize: 14,
        }}
      >
        <option value="all">Tất cả</option>
        <option value="active">Đang hoạt động</option>
        <option value="inactive">Ngừng</option>
      </select>
    </div>

    {/* Nút hành động */}
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={handleSearch}
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          color: "#fff",
          borderRadius: 8,
          border: "none",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Tìm
      </button>
      <button
        onClick={() => {
          setSearch("");
          setAppliedSearch("");
          setStatusFilter("all");
          setPage(1);
        }}
        style={{
          padding: "10px 20px",
          background: "#fff",
          color: "#374151",
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '50px' }}>STT</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tên danh mục</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slug</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mô tả</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((c, index) => (
                <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: 14, textAlign: 'center' }}>
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td style={{ padding: '16px', color: '#111827', fontWeight: 500, fontSize: 14 }}>{c.name}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14 }}>{c.slug}</td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: 14, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                  <td style={{ padding: '16px' }}>{pill(c.isActive)}</td>
                  <td style={{ padding: '16px', display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => setViewing(c)} title="Xem" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><ViewIcon /></button>
                    <button onClick={() => onEdit(c)} title="Sửa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><EditIcon /></button>
                    <button onClick={() => onDelete(c.id)} title="Xóa" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><DeleteIcon /></button>
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

      {viewing && <CategoryDetails category={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
