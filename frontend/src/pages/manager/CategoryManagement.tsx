import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/admin/UserList.module.css';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { categoryService } from '../../services/categoryService';
import type { CategoryDTO } from '../../types/category.types';
import CategoryForm from './CategoryForm'; 

interface CategoryListFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'active' | 'inactive';
}

interface CategoryListProps {
  hideHeader?: boolean;
  title?: string;
}

export default function CategoryList({ hideHeader = false, title = 'Quản lý Danh mục Bài viết' }: CategoryListProps): JSX.Element {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CategoryListFilters>({
    page: 1,
    pageSize: 10,
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
      const { items, total } = await categoryService.list(1, 9999, ''); // Tải tất cả để tính toán stats
      setCategories(items || []);
      setTotal(total);
      setLoading(false);
    } catch (error) {
      showToast('Không thể tải danh mục.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters.search, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = useCallback((key: keyof CategoryListFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key !== 'page') {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  const handleToggleActive = (category: CategoryDTO) => {
    setSelectedCategory(category); // Lưu category để dùng trong dialog
    setShowConfirmation(true); // Mở dialog xác nhận
  };
  
  const confirmSoftDelete = async () => {
    if (!selectedCategory) return;
    try {
      await categoryService.update(selectedCategory.id, {
        name: selectedCategory.name,
        slug: selectedCategory.slug,
        description: selectedCategory.description,
        isActive: !selectedCategory.isActive, 
      });
      showToast(`Đã ${!selectedCategory.isActive ? 'kích hoạt' : 'tạm dừng'} danh mục "${selectedCategory.name}"`, 'success');
      await load();
    } catch (error) {
      showToast('Không thể cập nhật trạng thái danh mục.', 'error');
    } finally {
      setShowConfirmation(false);
      setSelectedCategory(null);
    }
  };

  const handleOpenForm = (category: CategoryDTO | null) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleFormSaved = async () => {
    handleCloseForm();
    await load(); // Reload data after save
  };

  const handleSort = (key: keyof CategoryDTO) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      pageSize: 10,
      search: '',
      statusFilter: 'all',
    });
  };

  const sortedCategories = useMemo(() => {
    let sortableItems = [...categories];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      sortableItems = sortableItems.filter(category =>
        category.name.toLowerCase().includes(searchTerm) ||
        (category.slug && category.slug.toLowerCase().includes(searchTerm)) ||
        (category.description && category.description.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.statusFilter !== 'all') {
      const isActive = filters.statusFilter === 'active';
      sortableItems = sortableItems.filter(category => category.isActive === isActive);
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];
        
        if (valA == null) valA = '';
        if (valB == null) valB = '';
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (strA > strB) {
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

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(c => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [categories]);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <i className="bi bi-grid-3x3-gap" style={{ fontSize: '28px' }}></i>
            </div>
            <div>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>Quản lý và phân loại các danh mục bài viết trong hệ thống</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => handleOpenForm(null)} className={styles.btnCreate}>
            <i className="bi bi-plus-lg"></i> Tạo mới
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-book"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số danh mục</div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-arrow-up"></i>
              <span>Trong hệ thống</span>
            </div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-arrow-up"></i>
              <span>Danh mục đang sử dụng</span>
            </div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardLocked}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-lock-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Bị khóa</div>
            <div className={styles.statValue}>{stats.inactive}</div>
            <div className={`${styles.statTrend} ${styles.negative}`}>
              <i className="bi bi-arrow-down"></i>
              <span>Danh mục tạm dừng</span>
            </div>
          </div>
        </div>
      </div>

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
            <button className={styles.clearSearch} onClick={() => handleFilterChange('search', '')}>
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
        <button
          className={`${styles.btnFilter} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="bi bi-funnel"></i>
          Bộ lọc
          {(filters.statusFilter !== 'all') && (
            <span className={styles.filterBadge}></span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-toggle-on"></i>
                Trạng thái
              </label>
              <select 
                value={filters.statusFilter} 
                onChange={e => handleFilterChange('statusFilter', e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          </div>
          <div className={styles.filterActions}>
            <button onClick={handleResetFilters} className={styles.btnResetFilter}>
              <i className="bi bi-arrow-counterclockwise"></i>
              Đặt lại
            </button>
            <button onClick={() => setShowFilters(false)} className={styles.btnApplyFilter}>
              <i className="bi bi-check2"></i>
              Áp dụng
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>
            <LoadingSpinner />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : paginatedCategories.length > 0 ? (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>STT</th>
                    <th onClick={() => handleSort('name')} className={styles.sortable}>
                      Tên danh mục {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('slug')} className={styles.sortable}>
                      Slug {sortConfig?.key === 'slug' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('description')} className={styles.sortable}>
                      Mô tả {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((category, index) => (
                    <tr key={category.id}>
                      <td className={styles.indexCell}>
                        {(filters.page - 1) * filters.pageSize + index + 1}
                      </td>
                      <td><strong>{category.name}</strong></td>
                      <td>{category.slug}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {category.description || '-'}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${category.isActive ? styles.statusActive : styles.statusLocked}`}>
                          {category.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className={styles.actions}>
                        <button 
                          onClick={() => setViewingCategory(category)} 
                          className={styles.actionBtn} 
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        <button 
                          onClick={() => handleOpenForm(category)} 
                          className={styles.actionBtn} 
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`${styles.actionBtn} ${category.isActive ? styles.actionLock : styles.actionUnlock}`}
                          title={category.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                        >
                          <i className={`bi ${category.isActive ? 'bi-lock' : 'bi-unlock'}`}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalFilteredItems > 0 && (
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  Hiển thị {(filters.page - 1) * filters.pageSize + 1} - {Math.min(filters.page * filters.pageSize, totalFilteredItems)} trong tổng số {totalFilteredItems} kết quả
                </div>

                <div className={styles.paginationControls}>
                  <select 
                    value={filters.pageSize} 
                    onChange={e => handleFilterChange('pageSize', Number(e.target.value))}
                  >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={15}>15 / trang</option>
                    <option value={20}>20 / trang</option>
                  </select>

                  <div className={styles.paginationButtons}>
                    <button
                      onClick={() => handleFilterChange('page', 1)}
                      disabled={filters.page <= 1}
                      className={filters.page <= 1 ? styles.disabled : ''}
                    >
                      <i className="bi bi-chevron-double-left"></i>
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      disabled={filters.page <= 1}
                      className={filters.page <= 1 ? styles.disabled : ''}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>

                    <span className={styles.pageIndicator}>
                      {filters.page} / {totalPages || 1}
                    </span>

                    <button
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={filters.page >= totalPages}
                      className={filters.page >= totalPages ? styles.disabled : ''}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', totalPages)}
                      disabled={filters.page >= totalPages}
                      className={filters.page >= totalPages ? styles.disabled : ''}
                    >
                      <i className="bi bi-chevron-double-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <p>Không tìm thấy danh mục nào</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          title={`Xác nhận ${selectedCategory?.isActive ? 'tạm dừng' : 'kích hoạt'} danh mục`}
          message={`Bạn có chắc chắn muốn ${selectedCategory?.isActive ? 'tạm dừng' : 'kích hoạt'} danh mục "${selectedCategory?.name}" không?`}
          confirmText={selectedCategory?.isActive ? 'Tạm dừng' : 'Kích hoạt'}
          cancelText="Hủy"
          onConfirm={confirmSoftDelete}
          onCancel={() => {
            setShowConfirmation(false);
            setSelectedCategory(null);
          }}
          type={selectedCategory?.isActive ? 'danger' : 'warning'}
        />
      )}

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseForm}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingCategory ? 'Chỉnh sửa Danh mục Bài viết' : 'Tạo Danh mục Bài viết mới'}</h2>
              <button onClick={handleCloseForm} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.scrollableModalBody}`}>
              <CategoryForm 
                category={editingCategory} 
                mode={editingCategory ? 'edit' : 'create'} 
                onSaved={handleFormSaved} 
                onCancel={handleCloseForm} 
              />
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingCategory && (
        <div className={styles.modalOverlay} onClick={() => setViewingCategory(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết Danh mục Bài viết</h2>
              <button onClick={() => setViewingCategory(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.scrollableModalBody}`}>
              <CategoryForm 
                category={viewingCategory} 
                mode="view" 
                onSaved={() => {}} 
                onCancel={() => setViewingCategory(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
