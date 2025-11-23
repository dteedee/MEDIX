import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/admin/ArticleManagement.module.css'; // Sử dụng style từ ArticleManagement
import { PageLoader } from '../../components/ui';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { categoryService } from '../../services/categoryService';
import type { CategoryDTO } from '../../types/category.types';
import CategoryForm from './CategoryForm'; // Import form component

interface CategoryListFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'active' | 'inactive';
}

export default function CategoryList(): JSX.Element {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CategoryListFilters>({
    page: 1,
    pageSize: 5,
    search: '',
    statusFilter: 'all',
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [viewingCategory, setViewingCategory] = useState<CategoryDTO | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof CategoryDTO; direction: 'asc' | 'desc' } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // State để quản lý panel bộ lọc
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Sử dụng categoryService để lấy dữ liệu
      const { items, total } = await categoryService.list(1, 9999, ''); // Tải tất cả để tính toán stats
      setCategories(items || []);
      setTotal(total);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load categories:", error);
      showToast('Không thể tải danh mục.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters.search, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = (key: keyof CategoryListFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleToggleActive = (category: CategoryDTO) => {
    setSelectedCategory(category); // Lưu category để dùng trong dialog
    setShowConfirmation(true); // Mở dialog xác nhận
  };
  
  const confirmSoftDelete = async () => {
    if (!selectedCategory) return;
    try {
      // Sử dụng categoryService để cập nhật
      await categoryService.update(selectedCategory.id, {
        // Gửi đầy đủ các trường thông tin của danh mục, chỉ thay đổi isActive
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        description: selectedCategory.description,
        isActive: !selectedCategory.isActive, // Đảo ngược trạng thái hiện tại
      });
      showToast(`Đã ${!selectedCategory.isActive ? 'kích hoạt' : 'tạm dừng'} danh mục "${selectedCategory.name}"`, 'success');
      // Tải lại danh sách để cập nhật UI
      await load();
    } catch (error) {
      console.error("Failed to update category status:", error);
      showToast('Không thể cập nhật trạng thái danh mục.', 'error');
    } finally {
      setShowConfirmation(false);
      setSelectedCategory(null);
    }
  };

  const handleEdit = (category: CategoryDTO) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCategory(null); // Đảm bảo không có category nào được chọn
    setIsFormOpen(true);
  };

  const handleFormSaved = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    load(); // Tải lại danh sách sau khi lưu
  };

  const handleSort = (key: keyof CategoryDTO) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCategories = useMemo(() => {
    let sortableItems = [...categories];

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      sortableItems = sortableItems.filter(category =>
        category.name.toLowerCase().includes(searchTerm) ||
        (category.slug && category.slug.toLowerCase().includes(searchTerm)) ||
        (category.description && category.description.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by status
    if (filters.statusFilter !== 'all') {
      const isActive = filters.statusFilter === 'active';
      sortableItems = sortableItems.filter(category => category.isActive === isActive);
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [categories, sortConfig, filters.search, filters.statusFilter]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return sortedCategories.slice(startIndex, startIndex + filters.pageSize);
  }, [sortedCategories, filters.page, filters.pageSize]);

  const totalFilteredItems = sortedCategories.length;
  const totalPages = Math.ceil(totalFilteredItems / filters.pageSize);

  const getStats = () => {
    const total = categories.length;
    const active = categories.filter(c => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  };

  const stats = getStats();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Danh mục Bài viết</h1>
          <p className={styles.subtitle}>Quản lý danh sách danh mục bài viết sức khỏe</p>
        </div>
        <button onClick={handleCreateNew} className={styles.btnCreate}>
          <i className="bi bi-plus-lg"></i> Tạo mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}><i className="bi bi-tags-fill"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số danh mục</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}><i className="bi bi-check-circle-fill"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{stats.active}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}><i className="bi bi-pause-circle-fill"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tạm dừng</div>
            <div className={styles.statValue}>{stats.inactive}</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, slug..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
          {filters.search && (
            <button className={styles.clearSearch} onClick={() => handleFilterChange('search', '')} title="Xóa tìm kiếm">
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <button
          className={`${styles.btnFilter} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}>
          <i className="bi bi-funnel"></i>
          Bộ lọc
          {filters.statusFilter !== 'all' && <span className={styles.filterBadge}></span>}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label><i className="bi bi-toggle-on"></i> Trạng thái</label>
              <select value={filters.statusFilter} onChange={e => handleFilterChange('statusFilter', e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Đã tạm dừng</option>
              </select>
            </div>
          </div>
          <div className={styles.filterActions}>
            <button onClick={() => handleFilterChange('statusFilter', 'all')} className={styles.btnResetFilter}>
              <i className="bi bi-arrow-counterclockwise"></i> Đặt lại
            </button>
            <button onClick={() => setShowFilters(false)} className={styles.btnApplyFilter}>
              <i className="bi bi-check2"></i> Áp dụng
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : paginatedCategories.length > 0 ? (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th onClick={() => handleSort('name')} className={styles.sortable}>
                    Tên danh mục
                    {sortConfig?.key === 'name' && <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th onClick={() => handleSort('slug')} className={styles.sortable}>
                    Slug
                    {sortConfig?.key === 'slug' && <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th onClick={() => handleSort('description')} className={styles.sortable}>
                    Mô tả
                    {sortConfig?.key === 'description' && <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th onClick={() => handleSort('isActive')} className={styles.sortable}>
                    Trạng thái
                    {sortConfig?.key === 'isActive' && <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>}
                  </th>
                  <th style={{ textAlign: 'right', width: '150px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((category, index) => (
                  <tr key={category.id} className={styles.tableRow}>
                    <td className={styles.indexCell}>
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    <td><div className={styles.titleCell}>{category.name}</div></td>
                    <td><span className={styles.slugBadge}>{category.slug}</span></td>
                    <td><div className={styles.descriptionCell}>{category.description || '-'}</div></td>
                    <td>
                      <span className={`${styles.statusBadge} ${category.isActive ? styles.statusActive : styles.statusInactive}`}>
                        <i className={`bi ${category.isActive ? 'bi-check-circle-fill' : 'bi-pause-circle-fill'}`}></i>
                        {category.isActive ? 'Hoạt động' : 'Đã tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => setViewingCategory(category)} className={styles.actionBtn} title="Xem chi tiết">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button onClick={() => { setEditingCategory(category); setIsFormOpen(true); }} className={styles.actionBtn} title="Chỉnh sửa">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`${styles.actionBtn} ${category.isActive ? styles.actionLock : styles.actionUnlock}`}
                          title={category.isActive ? 'Tạm dừng (Khóa)' : 'Kích hoạt (Mở khóa)'}
                        >
                          <i className={`bi bi-${category.isActive ? 'lock' : 'unlock'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <p>Không tìm thấy danh mục nào</p>
          </div>
        )}

        {/* Pagination */}
        {totalFilteredItems > 0 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              <span>Hiển thị {(filters.page - 1) * filters.pageSize + 1} – {Math.min(filters.page * filters.pageSize, totalFilteredItems)} trong tổng số {totalFilteredItems} kết quả</span>
            </div>
            <div className={styles.paginationControls}>
              <select
                value={filters.pageSize}
                onChange={e => handleFilterChange('pageSize', Number(e.target.value))}
                className={styles.pageSizeSelect}
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={15}>15 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
              <div className={styles.paginationButtons}>
                <button onClick={() => handleFilterChange('page', 1)} disabled={filters.page === 1} className={styles.pageBtn}><i className="bi bi-chevron-double-left"></i></button>
                <button onClick={() => handleFilterChange('page', filters.page - 1)} disabled={filters.page === 1} className={styles.pageBtn}><i className="bi bi-chevron-left"></i></button>
                <span className={styles.pageIndicator}>
                  {filters.page} / {totalPages || 1}
                </span>
                <button onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page >= totalPages} className={styles.pageBtn}><i className="bi bi-chevron-right"></i></button>
                <button onClick={() => handleFilterChange('page', totalPages)} disabled={filters.page >= totalPages} className={styles.pageBtn}><i className="bi bi-chevron-double-right"></i></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title={`Xác nhận ${selectedCategory?.isActive ? 'tạm dừng' : 'kích hoạt'}`}
        message={`Bạn có chắc chắn muốn ${selectedCategory?.isActive ? 'tạm dừng' : 'kích hoạt'} danh mục "${selectedCategory?.name}" không?`}
        onConfirm={confirmSoftDelete}
        onCancel={() => setShowConfirmation(false)}
      />

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? 'Chỉnh sửa Danh mục Bài viết' : 'Tạo Danh mục Bài viết mới'}</h2>
              <button onClick={() => { setIsFormOpen(false); setEditingCategory(null); }} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.scrollableModalBody}`}>
              <CategoryForm category={editingCategory} mode={editingCategory ? 'edit' : 'create'} onSaved={handleFormSaved} onCancel={() => { setIsFormOpen(false); setEditingCategory(null); }} />
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingCategory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết Danh mục Bài viết</h2>
              <button onClick={() => setViewingCategory(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <CategoryForm category={viewingCategory} mode="view" onSaved={() => {}} onCancel={() => setViewingCategory(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
