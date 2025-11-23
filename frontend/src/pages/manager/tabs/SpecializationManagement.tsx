import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import styles from '../../../styles/admin/UserList.module.css';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import ConfirmationDialog from '../../../components/ui/ConfirmationDialog';
import specializationService, { SpecializationListDto } from '../../../services/specializationService';
import SpecializationForm from './SpecializationForm';

interface SpecializationFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'active' | 'inactive';
}

export default function SpecializationManagement(): JSX.Element {
  const [specializations, setSpecializations] = useState<SpecializationListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SpecializationFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    statusFilter: 'all',
  });
  const [selectedSpecialization, setSelectedSpecialization] = useState<SpecializationListDto | null>(null);
  const [editingSpecialization, setEditingSpecialization] = useState<SpecializationListDto | null>(null);
  const [viewingSpecialization, setViewingSpecialization] = useState<SpecializationListDto | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SpecializationListDto; direction: 'asc' | 'desc' } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await specializationService.getAll(false); // Lấy tất cả, không chỉ active
      setSpecializations(data || []);
    } catch (error) {
      console.error("Failed to load specializations:", error);
      showToast('Không thể tải danh sách chuyên khoa.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = useCallback((key: keyof SpecializationFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset page to 1 only when changing search, statusFilter, or pageSize
      if (key !== 'page') {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  const handleToggleActive = (specialization: SpecializationListDto) => {
    setSelectedSpecialization(specialization);
    setShowConfirmation(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedSpecialization) return;
    try {
      const result = await specializationService.toggleActive(selectedSpecialization.id);
      showToast(
        result.message || `Đã ${result.isActive ? 'kích hoạt' : 'tạm dừng'} chuyên khoa "${selectedSpecialization.name}"`, 
        'success'
      );
      // Reload data to get updated doctor count and other info
      await load();
    } catch (error: any) {
      console.error("Failed to update specialization status:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái chuyên khoa.';
      showToast(errorMessage, 'error');
    } finally {
      setShowConfirmation(false);
      setSelectedSpecialization(null);
    }
  };

  const handleOpenForm = (specialization: SpecializationListDto | null) => {
    setEditingSpecialization(specialization);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSpecialization(null);
  };

  const handleFormSaved = async () => {
    handleCloseForm();
    await load(); // Reload data after save
  };

  const handleSort = (key: keyof SpecializationListDto) => {
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

  const sortedSpecializations = useMemo(() => {
    let sortableItems = [...specializations];

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      sortableItems = sortableItems.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.code.toLowerCase().includes(searchLower) ||
        (s.description && s.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (filters.statusFilter !== 'all') {
      const isActive = filters.statusFilter === 'active';
      sortableItems = sortableItems.filter(s => s.isActive === isActive);
    }

    // Sort
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];
        
        // Handle undefined/null values
        if (valA == null) valA = '';
        if (valB == null) valB = '';
        
        // Convert to string for comparison
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
  }, [specializations, sortConfig, filters.search, filters.statusFilter]);

  const paginatedSpecializations = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return sortedSpecializations.slice(startIndex, startIndex + filters.pageSize);
  }, [sortedSpecializations, filters.page, filters.pageSize]);

  const totalFilteredItems = sortedSpecializations.length;
  const totalPages = Math.ceil(totalFilteredItems / filters.pageSize);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Quản lý Chuyên khoa</h2>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => handleOpenForm(null)} className={styles.btnCreate}>
            <i className="bi bi-plus-lg"></i> Tạo mới
          </button>
        </div>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã..."
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
        ) : paginatedSpecializations.length > 0 ? (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>STT</th>
                    <th onClick={() => handleSort('code')} className={styles.sortable}>
                      Mã {sortConfig?.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('name')} className={styles.sortable}>
                      Tên {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('description')} className={styles.sortable}>
                      Mô tả {sortConfig?.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Ảnh</th>
                    <th onClick={() => handleSort('doctorCount')} className={styles.sortable}>
                      Số bác sĩ {sortConfig?.key === 'doctorCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSpecializations.map((specialization, index) => (
                    <tr key={specialization.id}>
                      <td className={styles.indexCell}>
                        {(filters.page - 1) * filters.pageSize + index + 1}
                      </td>
                      <td><strong>{specialization.code}</strong></td>
                      <td>{specialization.name}</td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {specialization.description || '-'}
                      </td>
                      <td>
                        {specialization.imageUrl ? (
                          <img 
                            src={specialization.imageUrl} 
                            alt={specialization.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td><strong>{specialization.doctorCount}</strong></td>
                      <td>
                        <span className={`${styles.statusBadge} ${specialization.isActive ? styles.statusActive : styles.statusLocked}`}>
                          {specialization.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className={styles.actions}>
                        <button 
                          onClick={() => setViewingSpecialization(specialization)} 
                          className={styles.actionBtn} 
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        <button 
                          onClick={() => handleOpenForm(specialization)} 
                          className={styles.actionBtn} 
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button
                          onClick={() => handleToggleActive(specialization)}
                          className={`${styles.actionBtn} ${specialization.isActive ? styles.actionLock : styles.actionUnlock}`}
                          title={specialization.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                        >
                          <i className={`bi ${specialization.isActive ? 'bi-lock' : 'bi-unlock'}`}></i>
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
            <p>Không tìm thấy chuyên khoa nào</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          title={`Xác nhận ${selectedSpecialization?.isActive ? 'tạm dừng' : 'kích hoạt'} chuyên khoa`}
          message={`Bạn có chắc chắn muốn ${selectedSpecialization?.isActive ? 'tạm dừng' : 'kích hoạt'} chuyên khoa "${selectedSpecialization?.name}" không?`}
          confirmText={selectedSpecialization?.isActive ? 'Tạm dừng' : 'Kích hoạt'}
          cancelText="Hủy"
          onConfirm={confirmToggleActive}
          onCancel={() => {
            setShowConfirmation(false);
            setSelectedSpecialization(null);
          }}
          type={selectedSpecialization?.isActive ? 'danger' : 'warning'}
        />
      )}

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseForm}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingSpecialization ? 'Chỉnh sửa Chuyên khoa' : 'Tạo Chuyên khoa mới'}</h2>
              <button onClick={handleCloseForm} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.scrollableModalBody}`}>
              <SpecializationForm 
                specialization={editingSpecialization} 
                mode={editingSpecialization ? 'edit' : 'create'} 
                onSaved={handleFormSaved} 
                onCancel={handleCloseForm} 
              />
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingSpecialization && (
        <div className={styles.modalOverlay} onClick={() => setViewingSpecialization(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết Chuyên khoa</h2>
              <button onClick={() => setViewingSpecialization(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.scrollableModalBody}`}>
              <SpecializationForm 
                specialization={viewingSpecialization} 
                mode="view" 
                onSaved={() => {}} 
                onCancel={() => setViewingSpecialization(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
