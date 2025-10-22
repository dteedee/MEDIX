import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoryService } from '../../services/categoryService'
import { CategoryDTO } from '../../types/category.types'
import CategoryDetails from '../../components/admin/CategoryDetails'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/CategoryList.module.css'

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
export default function CategoryList() {
  const SESSION_STORAGE_KEY = 'categoryListState';

  const getInitialState = () => {
    try {
      const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse saved state for categories:", error);
    }
    return {
      page: 1,
      pageSize: 5,
      search: '',
      status: 'all',
    };
  };

  const [items, setItems] = useState<CategoryDTO[]>([])
  const [viewing, setViewing] = useState<CategoryDTO | null>(null)

  const [page, setPage] = useState(getInitialState().page);
  const [pageSize, setPageSize] = useState(getInitialState().pageSize);
  const [search, setSearch] = useState(getInitialState().search);
  const [appliedSearch, setAppliedSearch] = useState(getInitialState().search);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(getInitialState().status);

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
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [page, pageSize, appliedSearch, statusFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setAppliedSearch(value); // Áp dụng tìm kiếm ngay khi người dùng nhập
    if (page !== 1) setPage(1); // Reset về trang đầu tiên khi có tìm kiếm mới

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
    setAppliedSearch(suggestion.name); // Áp dụng tìm kiếm ngay khi chọn
    setShowSuggestions(false);
  };

  const processedItems = useMemo(() => {
    let filtered = [...items];

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(item => item.isActive === isActive);
    }

    if (appliedSearch.trim()) {
      const searchTerm = appliedSearch.toLowerCase();
      return filtered.filter(item => item.name.toLowerCase().includes(searchTerm) || (item.slug && item.slug.toLowerCase().includes(searchTerm)) || (item.description && item.description.toLowerCase().includes(searchTerm)));
    }
    return filtered;
  }, [items, appliedSearch, statusFilter]);

  const onCreate = () => navigate('/app/manager/categories/new')
  const onEdit = (c: CategoryDTO) => navigate(`/app/manager/categories/edit/${c.id}`)
  const handleStatusChange = async (categoryToUpdate: CategoryDTO, newStatus: boolean) => {
    if (categoryToUpdate.isActive === newStatus) return;

    const actionText = newStatus ? 'kích hoạt' : 'ngừng hoạt động';
    if (!confirm(`Bạn có chắc muốn ${actionText} danh mục này không?`)) {
      return;
    }

    try {
      const payload = {
        name: categoryToUpdate.name ?? '',
        slug: categoryToUpdate.slug ?? '',
        description: categoryToUpdate.description ?? '',
        parentId: categoryToUpdate.parentId ?? null,
        isActive: newStatus,
      } as any; // Sử dụng as any để bỏ qua kiểm tra kiểu dữ liệu nghiêm ngặt tạm thời
      await categoryService.update(categoryToUpdate.id, payload);
      showToast(`Đã ${actionText} danh mục thành công.`);
      await load();
    } catch (error) {
      showToast('Không thể cập nhật trạng thái danh mục.', 'error');
    }
  }

  const pill = (active?: boolean) => {
    const isOn = Boolean(active)
    const text = isOn ? 'Đang hoạt động' : 'Ngừng hoạt động'
    const bg = isOn ? '#e7f9ec' : '#fee2e2'
    const color = isOn ? '#16a34a' : '#dc2626'
    return <span style={{ background: bg, color, padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>{text}</span>
  }

  // Frontend Pagination
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = processedItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Danh mục</h1>
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
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.filterInput}
            />
            {showSuggestions && (
              <div className={styles.suggestionsContainer}>
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)} className={styles.suggestionItem}>
                    {suggestion.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${styles.filterGroup} ${styles.status}`}>
            <label className={styles.filterLabel}>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              className={styles.filterSelect}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                setStatusFilter("all");
                if (page !== 1) setPage(1);
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
                <th className={styles.th}>Tên danh mục</th>
                <th className={styles.th}>Slug</th>
                <th className={styles.th}>Mô tả</th>
                <th className={styles.th}>Trạng thái</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((c, index) => (
                <tr key={c.id}>
                  <td className={`${styles.td} ${styles.center}`}>
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className={`${styles.td} ${styles.title}`}>{c.name}</td>
                  <td className={styles.td}>{c.slug}</td>
                  <td className={`${styles.td} ${styles.description}`}>{c.description}</td>
                  <td className={styles.td}>
                    <select
                      value={c.isActive ? 'active' : 'inactive'}
                      onChange={(e) => handleStatusChange(c, e.target.value === 'active')}
                      className={`${styles.statusSelect} ${c.isActive ? styles.statusSelectActive : styles.statusSelectInactive}`}
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="inactive">Ngừng hoạt động</option>
                    </select>
                  </td>
                  <td className={`${styles.td} ${styles.actions}`}>
                    <button onClick={() => setViewing(c)} title="Xem" className={styles.actionButton}><ViewIcon /></button>
                    <button onClick={() => onEdit(c)} title="Sửa" className={styles.actionButton}><EditIcon /></button>
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

      {viewing && <CategoryDetails category={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}