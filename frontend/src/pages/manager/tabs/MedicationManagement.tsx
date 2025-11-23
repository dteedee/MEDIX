import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import styles from '../../../styles/admin/UserList.module.css';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import ConfirmationDialog from '../../../components/ui/ConfirmationDialog';
import medicationService, { MedicationDto } from '../../../services/medicationService';
import MedicationForm from './MedicationForm';

interface MedicationFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'active' | 'inactive';
}

export default function MedicationManagement(): JSX.Element {
  const [medications, setMedications] = useState<MedicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MedicationFilters>({
    page: 1,
    pageSize: 10,
    search: '',
    statusFilter: 'all',
  });
  const [selectedMedication, setSelectedMedication] = useState<MedicationDto | null>(null);
  const [editingMedication, setEditingMedication] = useState<MedicationDto | null>(null);
  const [viewingMedication, setViewingMedication] = useState<MedicationDto | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof MedicationDto; direction: 'asc' | 'desc' } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await medicationService.getAllIncludingInactive();
      setMedications(data || []);
    } catch (error) {
      console.error("Failed to load medications:", error);
      showToast('Không thể tải danh sách thuốc.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = useCallback((key: keyof MedicationFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset page to 1 only when changing search, statusFilter, or pageSize
      if (key !== 'page') {
        newFilters.page = 1;
      }
      return newFilters;
    });
  }, []);

  const handleToggleActive = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowConfirmation(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedMedication) return;
    try {
      const result = await medicationService.toggleActive(selectedMedication.id);
      showToast(result.message || `Đã ${result.isActive ? 'kích hoạt' : 'tạm dừng'} thuốc "${selectedMedication.medicationName}"`, 'success');
      // Reload data
      await load();
    } catch (error: any) {
      console.error("Failed to update medication status:", error);
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật trạng thái thuốc.';
      showToast(errorMessage, 'error');
    } finally {
      setShowConfirmation(false);
      setSelectedMedication(null);
    }
  };

  const handleOpenForm = (medication: MedicationDto | null) => {
    setEditingMedication(medication);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMedication(null);
  };

  const handleFormSaved = async () => {
    handleCloseForm();
    await load(); // Reload data after save
  };

  const handleSort = (key: keyof MedicationDto) => {
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

  const sortedMedications = useMemo(() => {
    let sortableItems = [...medications];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      sortableItems = sortableItems.filter(m =>
        m.medicationName.toLowerCase().includes(searchLower) ||
        (m.genericName && m.genericName.toLowerCase().includes(searchLower))
      );
    }

    if (filters.statusFilter !== 'all') {
      const isActive = filters.statusFilter === 'active';
      sortableItems = sortableItems.filter(m => m.isActive === isActive);
    }

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
  }, [medications, sortConfig, filters.search, filters.statusFilter]);

  const paginatedMedications = useMemo(() => {
    const startIndex = (filters.page - 1) * filters.pageSize;
    return sortedMedications.slice(startIndex, startIndex + filters.pageSize);
  }, [sortedMedications, filters.page, filters.pageSize]);

  const totalFilteredItems = sortedMedications.length;
  const totalPages = Math.ceil(totalFilteredItems / filters.pageSize);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Quản lý Danh mục Thuốc</h2>
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
            placeholder="Tìm kiếm theo tên thuốc, tên gốc..."
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
                onChange={e => handleFilterChange('statusFilter', e.target.value)}
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
        ) : paginatedMedications.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th onClick={() => handleSort('medicationName')} className={styles.sortable}>
                    Tên thuốc {sortConfig?.key === 'medicationName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('genericName')} className={styles.sortable}>
                    Tên gốc {sortConfig?.key === 'genericName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Dạng bào chế</th>
                  <th>Công dụng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMedications.map((medication, index) => (
                  <tr key={medication.id}>
                    <td className={styles.indexCell}>
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    <td>{medication.medicationName}</td>
                    <td>{medication.genericName || '-'}</td>
                    <td>{medication.dosageForms || '-'}</td>
                    <td>{medication.commonUses || '-'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${medication.isActive ? styles.statusActive : styles.statusLocked}`}>
                        {medication.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button 
                        onClick={() => setViewingMedication(medication)} 
                        className={styles.actionBtn} 
                        title="Xem chi tiết"
                      >
                        <i className="bi bi-eye-fill"></i>
                      </button>
                      <button 
                        onClick={() => handleOpenForm(medication)} 
                        className={styles.actionBtn} 
                        title="Chỉnh sửa"
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        onClick={() => handleToggleActive(medication)}
                        className={`${styles.actionBtn} ${medication.isActive ? styles.actionLock : styles.actionUnlock}`}
                        title={medication.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                      >
                        <i className={`bi ${medication.isActive ? 'bi-lock' : 'bi-unlock'}`}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <p>Không tìm thấy thuốc nào</p>
          </div>
        )}

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
      </div>

      {showConfirmation && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          title={`Xác nhận ${selectedMedication?.isActive ? 'tạm dừng' : 'kích hoạt'} thuốc`}
          message={`Bạn có chắc chắn muốn ${selectedMedication?.isActive ? 'tạm dừng' : 'kích hoạt'} thuốc "${selectedMedication?.medicationName}" không?`}
          confirmText={selectedMedication?.isActive ? 'Tạm dừng' : 'Kích hoạt'}
          cancelText="Hủy"
          onConfirm={confirmToggleActive}
          onCancel={() => setShowConfirmation(false)}
          type={selectedMedication?.isActive ? 'danger' : 'warning'}
        />
      )}

      {isFormOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseForm}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingMedication ? 'Chỉnh sửa Thuốc' : 'Tạo Thuốc mới'}</h2>
              <button onClick={handleCloseForm} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.scrollableModalBody}`}>
              <MedicationForm 
                medication={editingMedication} 
                mode={editingMedication ? 'edit' : 'create'} 
                onSaved={handleFormSaved} 
                onCancel={handleCloseForm} 
              />
            </div>
          </div>
        </div>
      )}

      {viewingMedication && (
        <div className={styles.modalOverlay} onClick={() => setViewingMedication(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết Thuốc</h2>
              <button onClick={() => setViewingMedication(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={`${styles.modalBody} ${styles.scrollableModalBody}`}>
              <MedicationForm 
                medication={viewingMedication} 
                mode="view" 
                onSaved={() => {}} 
                onCancel={() => setViewingMedication(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

