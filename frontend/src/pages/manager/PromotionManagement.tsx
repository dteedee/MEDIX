import React, { useEffect, useMemo, useState } from 'react';
import promotionService from '../../services/promotionService';
import { PromotionDto, normalizeIsActive } from '../../types/promotion.types';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import styles from '../../styles/manager/PromotionManagement.module.css';

interface PromotionListFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'active' | 'inactive';
  discountTypeFilter: 'all' | 'Percentage' | 'FixedAmount';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const getInitialState = (): PromotionListFilters => {
  try {
    const savedState = localStorage.getItem('promotionListState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (e) {
    console.error("Failed to parse promotionListState from localStorage", e);
  }
  return {
    page: 1,
    pageSize: 10,
    search: '',
    statusFilter: 'all',
    discountTypeFilter: 'all',
    sortBy: 'createdAt',
    sortDirection: 'desc' as const,
  };
};

export default function PromotionManagement() {
  const [allPromotions, setAllPromotions] = useState<PromotionDto[]>([]);
  const [filters, setFilters] = useState<PromotionListFilters>(getInitialState);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<PromotionDto | null>(null);
  const [editing, setEditing] = useState<PromotionDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    promotion: PromotionDto | null;
    action: 'delete' | 'toggle' | null;
  }>({
    isOpen: false,
    promotion: null,
    action: null
  });

  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const promotions = await promotionService.getAllPromotions();
      
      // Debug: Log first promotion to see data structure
      if (promotions && promotions.length > 0) {
        console.log('📊 Sample promotion from backend:', {
          id: promotions[0].id,
          code: promotions[0].code,
          isActive_VALUE: promotions[0].isActive,
          isActive_TYPE: typeof promotions[0].isActive,
          isActive_NORMALIZED: normalizeIsActive(promotions[0].isActive)
        });
      }
      
      setAllPromotions(promotions || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
      showToast('Không thể tải danh sách khuyến mãi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('promotionListState', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filters.page, filters.pageSize]);

  const handleFilterChange = (key: keyof PromotionListFilters, value: any) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value };
      if (key !== 'page') newState.page = 1;
      return newState;
    });
  };

  const handleToggleStatus = async (promotion: PromotionDto) => {
    try {
      console.log('🔍 ANTES DE TOGGLE:', {
        promotionId: promotion.id,
        promotionCode: promotion.code,
        isActive_RAW: promotion.isActive,
        isActive_TYPE: typeof promotion.isActive,
      });
      
      const currentIsActive = normalizeIsActive(promotion.isActive);
      const newIsActive = !currentIsActive;
      
      console.log('🔄 DEPOIS DE NORMALIZAR:', {
        currentIsActive: currentIsActive,
        newIsActive: newIsActive,
        message: currentIsActive ? 'Vai DESATIVAR (false)' : 'Vai ATIVAR (true)'
      });
      
      // Toggle status by updating the promotion
      const updatedData = {
        code: promotion.code,
        name: promotion.name,
        description: promotion.description || '',
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxUsage: promotion.maxUsage || undefined,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: newIsActive, // Send boolean (true/false)
      };
      
      console.log('📤 ENVIANDO PARA API:', {
        id: promotion.id,
        isActive: newIsActive,
        fullData: updatedData
      });
      
      await promotionService.updatePromotion(promotion.id, updatedData);
      showToast(`Đã ${currentIsActive ? 'tắt' : 'bật'} khuyến mãi thành công`, 'success');
      await load();
    } catch (error: any) {
      console.error('❌ ERROR:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể thay đổi trạng thái';
      showToast(message, 'error');
    }
  };

  const handleDelete = (promotion: PromotionDto) => {
    setConfirmationDialog({
      isOpen: true,
      promotion,
      action: 'delete'
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationDialog.promotion || !confirmationDialog.action) return;

    const { promotion, action } = confirmationDialog;
    setConfirmationDialog({ isOpen: false, promotion: null, action: null });

    try {
      if (action === 'delete') {
        await promotionService.deletePromotion(promotion.id);
        showToast('Đã xóa khuyến mãi thành công', 'success');
        await load();
      }
    } catch (error: any) {
      console.error('Error performing action:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể thực hiện thao tác';
      showToast(message, 'error');
    }
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFilters(prev => ({ ...prev, sortBy: column, sortDirection: 'desc' as const }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      ...filters,
      statusFilter: 'all',
      discountTypeFilter: 'all',
    });
  };

  const processedItems = useMemo(() => {
    const filtered = allPromotions.filter(p => {
      const searchTerm = filters.search.toLowerCase();
      const okSearch = !searchTerm ||
        (p.name && p.name.toLowerCase().includes(searchTerm)) ||
        (p.code && p.code.toLowerCase().includes(searchTerm));

      const isActive = normalizeIsActive(p.isActive);
      const okStatus = filters.statusFilter === 'all' || 
        (filters.statusFilter === 'active' ? isActive : !isActive);

      const okDiscountType = filters.discountTypeFilter === 'all' ||
        p.discountType === filters.discountTypeFilter;

      return okSearch && okStatus && okDiscountType;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA: any, valB: any;
      
      if (filters.sortBy === 'createdAt' || filters.sortBy === 'startDate' || filters.sortBy === 'endDate') {
        valA = a[filters.sortBy] ? new Date(a[filters.sortBy]!).getTime() : 0;
        valB = b[filters.sortBy] ? new Date(b[filters.sortBy]!).getTime() : 0;
      } else if (filters.sortBy === 'name' || filters.sortBy === 'code') {
        valA = (a[filters.sortBy] || '').toLowerCase();
        valB = (b[filters.sortBy] || '').toLowerCase();
      } else if (filters.sortBy === 'discountValue' || filters.sortBy === 'usedCount') {
        valA = a[filters.sortBy] || 0;
        valB = b[filters.sortBy] || 0;
      }

      if (valA < valB) return filters.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [allPromotions, filters]);

  const paginatedItems = useMemo(() => 
    processedItems.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize), 
    [processedItems, filters.page, filters.pageSize]
  );
  
  const totalPages = Math.ceil(processedItems.length / filters.pageSize);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadge = (isActive: boolean | number) => {
    const active = normalizeIsActive(isActive);
    
    if (active) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusActive}`}>
          <i className="bi bi-check-circle-fill"></i>
          Hoạt động
        </span>
      );
    } else {
      return (
        <span className={`${styles.statusBadge} ${styles.statusInactive}`}>
          <i className="bi bi-x-circle-fill"></i>
          Không hoạt động
        </span>
      );
    }
  };

  const getDiscountTypeBadge = (discountType: string) => {
    return (
      <span className={`${styles.discountBadge} ${discountType === 'Percentage' ? styles.percentage : styles.fixed}`}>
        <i className={`bi bi-${discountType === 'Percentage' ? 'percent' : 'currency-dollar'}`}></i>
        {discountType === 'Percentage' ? 'Phần trăm' : 'Cố định'}
      </span>
    );
  };

  const formatDiscountValue = (value: number, type: string) => {
    if (type === 'Percentage') {
      return `${value}%`;
    }
    return `${value.toLocaleString('vi-VN')}đ`;
  };

  const getStats = () => {
    const active = allPromotions.filter(p => normalizeIsActive(p.isActive)).length;
    const inactive = allPromotions.length - active;
    const totalUsed = allPromotions.reduce((sum, p) => sum + p.usedCount, 0);
    
    return {
      total: allPromotions.length,
      active,
      inactive,
      totalUsed
    };
  };

  const stats = getStats();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Khuyến mãi</h1>
          <p className={styles.subtitle}>Quản lý các mã khuyến mãi và chương trình giảm giá</p>
        </div>
        <button onClick={() => setCreating(true)} className={styles.btnCreate}>
          <i className="bi bi-plus-lg"></i>
          Tạo mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-tag-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số khuyến mãi</div>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-tag-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{stats.active}</div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-pause-circle-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Không hoạt động</div>
            <div className={styles.statValue}>{stats.inactive}</div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-pause-circle-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-graph-up"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng lượt sử dụng</div>
            <div className={styles.statValue}>{stats.totalUsed}</div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-graph-up"></i>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã..."
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
          {filters.search && (
            <button 
              className={styles.clearSearch}
              onClick={() => handleFilterChange('search', '')}
            >
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
          {(filters.statusFilter !== 'all' || filters.discountTypeFilter !== 'all') && (
            <span className={styles.filterBadge}></span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-toggle-on"></i>
                Trạng thái
              </label>
              <select value={filters.statusFilter} onChange={e => handleFilterChange('statusFilter', e.target.value)}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-percent"></i>
                Loại giảm giá
              </label>
              <select value={filters.discountTypeFilter} onChange={e => handleFilterChange('discountTypeFilter', e.target.value)}>
                <option value="all">Tất cả loại</option>
                <option value="Percentage">Phần trăm</option>
                <option value="FixedAmount">Cố định</option>
              </select>
            </div>
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleResetFilters} className={styles.btnResetFilter}>
              <i className="bi bi-arrow-counterclockwise"></i>
              Đặt lại bộ lọc
            </button>
            <button onClick={() => setShowFilters(false)} className={styles.btnApplyFilter}>
              <i className="bi bi-check2"></i>
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : processedItems.length > 0 ? (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th onClick={() => handleSort('code')} className={styles.sortable}>
                    Mã
                    {filters.sortBy === 'code' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('name')} className={styles.sortable}>
                    Tên
                    {filters.sortBy === 'name' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Loại</th>
                  <th onClick={() => handleSort('discountValue')} className={styles.sortable}>
                    Giá trị
                    {filters.sortBy === 'discountValue' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('usedCount')} className={styles.sortable}>
                    Đã dùng
                    {filters.sortBy === 'usedCount' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Giới hạn</th>
                  <th onClick={() => handleSort('startDate')} className={styles.sortable}>
                    Ngày bắt đầu
                    {filters.sortBy === 'startDate' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('endDate')} className={styles.sortable}>
                    Ngày kết thúc
                    {filters.sortBy === 'endDate' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right', width: '180px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((promotion, index) => (
                  <tr key={promotion.id} className={styles.tableRow}>
                    <td className={styles.indexCell}>
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    <td>
                      <span className={styles.codeCell}>{promotion.code}</span>
                    </td>
                    <td>
                      <div className={styles.nameCell} title={promotion.name}>
                        {promotion.name}
                      </div>
                    </td>
                    <td>{getDiscountTypeBadge(promotion.discountType)}</td>
                    <td className={styles.valueCell}>
                      {formatDiscountValue(promotion.discountValue, promotion.discountType)}
                    </td>
                    <td className={styles.usedCell}>
                      <i className="bi bi-people-fill"></i>
                      {promotion.usedCount}
                    </td>
                    <td className={styles.limitCell}>
                      {promotion.maxUsage || 'Không giới hạn'}
                    </td>
                    <td className={styles.dateCell}>{formatDate(promotion.startDate)}</td>
                    <td className={styles.dateCell}>{formatDate(promotion.endDate)}</td>
                    <td>{getStatusBadge(promotion.isActive)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          onClick={() => setViewing(promotion)}
                          className={styles.actionBtn}
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          onClick={() => setEditing(promotion)}
                          className={styles.actionBtn}
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                   
                        <button 
                          onClick={() => handleDelete(promotion)}
                          className={`${styles.actionBtn} ${styles.actionDelete}`}
                          title="Xóa"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                <span>Hiển thị {(filters.page - 1) * filters.pageSize + 1} – {Math.min(filters.page * filters.pageSize, processedItems.length)} trong tổng số {processedItems.length} kết quả</span>
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
                  <span className={styles.pageInfo}>{filters.page} / {totalPages || 1}</span>
                  <button onClick={() => handleFilterChange('page', filters.page + 1)} disabled={filters.page >= totalPages} className={styles.pageBtn}><i className="bi bi-chevron-right"></i></button>
                  <button onClick={() => handleFilterChange('page', totalPages)} disabled={filters.page >= totalPages} className={styles.pageBtn}><i className="bi bi-chevron-double-right"></i></button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <h3>Không có khuyến mãi nào</h3>
            <p>Hãy tạo khuyến mãi đầu tiên của bạn</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title="Xóa khuyến mãi"
        message={`Bạn có chắc chắn muốn xóa khuyến mãi "${confirmationDialog.promotion?.name}"? Hành động này không thể hoàn tác.`}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmationDialog({ isOpen: false, promotion: null, action: null })}
      />

      {/* View Modal */}
      {viewing && (
        <PromotionModal
          promotion={viewing}
          mode="view"
          onClose={() => setViewing(null)}
          onSave={async () => {}}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <PromotionModal
          promotion={editing}
          mode="edit"
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            try {
              await promotionService.updatePromotion(editing.id, data);
              showToast('Cập nhật khuyến mãi thành công', 'success');
              setEditing(null);
              await load();
            } catch (error: any) {
              console.error('Error updating promotion:', error);
              const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật khuyến mãi';
              throw new Error(message);
            }
          }}
        />
      )}

      {/* Create Modal */}
      {creating && (
        <PromotionModal
          promotion={null}
          mode="create"
          onClose={() => setCreating(false)}
          onSave={async (data) => {
            try {
              await promotionService.createPromotion(data);
              showToast('Tạo khuyến mãi thành công', 'success');
              setCreating(false);
              await load();
            } catch (error: any) {
              console.error('Error creating promotion:', error);
              const message = error?.response?.data?.message || error?.message || 'Không thể tạo khuyến mãi';
              
              // Check for specific error messages
              if (error?.response?.status === 409) {
                throw new Error('Mã khuyến mãi đã tồn tại. Vui lòng sử dụng mã khác.');
              }
              
              throw new Error(message);
            }
          }}
        />
      )}
    </div>
  );
}

// Modal Component
interface PromotionModalProps {
  promotion: PromotionDto | null;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ promotion, mode, onClose, onSave }) => {
  // Debug: Log initial isActive value
  React.useEffect(() => {
    if (promotion) {
      console.log('📝 Modal opened for promotion:', {
        id: promotion.id,
        code: promotion.code,
        isActive_RAW: promotion.isActive,
        isActive_TYPE: typeof promotion.isActive,
        isActive_NORMALIZED: normalizeIsActive(promotion.isActive)
      });
    }
  }, [promotion]);

  const [formData, setFormData] = useState({
    code: promotion?.code || '',
    name: promotion?.name || '',
    description: promotion?.description || '',
    discountType: promotion?.discountType || 'Percentage',
    discountValue: promotion?.discountValue || 0,
    maxUsage: promotion?.maxUsage || undefined,
    startDate: promotion?.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
    endDate: promotion?.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
    isActive: promotion ? normalizeIsActive(promotion.isActive) : true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Mã khuyến mãi là bắt buộc';
    } else {
      // Check if code contains only valid characters
      const codeRegex = /^[A-Za-z0-9_-]+$/;
      if (!codeRegex.test(formData.code)) {
        newErrors.code = 'Mã khuyến mãi chỉ được chứa chữ cái, số, gạch ngang và gạch dưới';
      }
    }

    if (!formData.name.trim()) newErrors.name = 'Tên khuyến mãi là bắt buộc';
    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    } else if (formData.discountType === 'Percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Phần trăm giảm giá không được vượt quá 100%';
    }
    
    if (formData.maxUsage && formData.maxUsage < 1) {
      newErrors.maxUsage = 'Giới hạn sử dụng phải lớn hơn hoặc bằng 1';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc là bắt buộc';
    }
    
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate >= endDate) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const isValid = await validate();
    if (!isValid) {
      showToast('Vui lòng kiểm tra lại thông tin', 'error');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || '',
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxUsage: formData.maxUsage || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: Boolean(formData.isActive), // Ensure it's a boolean
      };
      
      console.log('Submitting promotion data:', submitData);
      await onSave(submitData);
    } catch (error: any) {
      console.error('Error saving promotion:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể lưu khuyến mãi';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Prevent form submission on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const isViewMode = mode === 'view';

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>
            {mode === 'view' ? 'Chi tiết Khuyến mãi' : 
             mode === 'edit' ? 'Chỉnh sửa Khuyến mãi' : 'Tạo Khuyến mãi mới'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Mã khuyến mãi *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => handleChange('code', e.target.value)}
                  disabled={isViewMode || mode === 'edit'}
                  className={errors.code ? styles.error : ''}
                  title={mode === 'edit' ? 'Mã khuyến mãi không thể thay đổi khi chỉnh sửa' : ''}
                />
                {errors.code && <span className={styles.errorText}>{errors.code}</span>}
                {mode === 'edit' && (
                  <small style={{ color: '#718096', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    <i className="bi bi-info-circle"></i> Mã khuyến mãi không thể thay đổi
                  </small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Tên khuyến mãi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  disabled={isViewMode}
                  className={errors.name ? styles.error : ''}
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Loại giảm giá *</label>
                <select
                  value={formData.discountType}
                  onChange={e => handleChange('discountType', e.target.value)}
                  disabled={isViewMode}
                >
                  <option value="Percentage">Phần trăm</option>
                  <option value="FixedAmount">Cố định</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Giá trị giảm giá *</label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={e => handleChange('discountValue', Number(e.target.value))}
                  disabled={isViewMode}
                  className={errors.discountValue ? styles.error : ''}
                  min="0"
                  step={formData.discountType === 'Percentage' ? '1' : '1000'}
                />
                {errors.discountValue && <span className={styles.errorText}>{errors.discountValue}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Giới hạn sử dụng</label>
                <input
                  type="number"
                  value={formData.maxUsage || ''}
                  onChange={e => handleChange('maxUsage', e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isViewMode}
                  placeholder="Không giới hạn"
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Ngày bắt đầu *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => handleChange('startDate', e.target.value)}
                  disabled={isViewMode}
                  className={errors.startDate ? styles.error : ''}
                />
                {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Ngày kết thúc *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => handleChange('endDate', e.target.value)}
                  disabled={isViewMode}
                  className={errors.endDate ? styles.error : ''}
                />
                {errors.endDate && <span className={styles.errorText}>{errors.endDate}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Trạng thái khuyến mãi</label>
                <div className={styles.toggleContainer}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => {
                        const newValue = e.target.checked;
                        console.log('✏️ Changing isActive:', {
                          from: formData.isActive,
                          to: newValue
                        });
                        handleChange('isActive', newValue);
                      }}
                      disabled={isViewMode}
                    />
                    <span className={formData.isActive ? styles.activeLabel : styles.inactiveLabel}>
                      {formData.isActive ? (
                        <>
                          <i className="bi bi-check-circle-fill"></i> Hoạt động
                        </>
                      ) : (
                        <>
                          <i className="bi bi-x-circle-fill"></i> Không hoạt động
                        </>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  disabled={isViewMode}
                  rows={3}
                />
              </div>

              {mode === 'view' && promotion && (
                <>
                  <div className={styles.formGroup}>
                    <label>Số lần đã sử dụng</label>
                    <input type="text" value={promotion.usedCount} disabled />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tỷ lệ sử dụng</label>
                    <input 
                      type="text" 
                      value={
                        promotion.maxUsage 
                          ? `${promotion.usedCount} / ${promotion.maxUsage} (${((promotion.usedCount / promotion.maxUsage) * 100).toFixed(1)}%)`
                          : `${promotion.usedCount} / Không giới hạn`
                      }
                      disabled 
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Ngày tạo</label>
                    <input 
                      type="text" 
                      value={new Date(promotion.createdAt).toLocaleString('vi-VN')} 
                      disabled 
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Trạng thái hiện tại</label>
                    <input 
                      type="text" 
                      value={
                        !normalizeIsActive(promotion.isActive) ? 'Không hoạt động' :
                        new Date(promotion.endDate) < new Date() ? 'Đã hết hạn' :
                        new Date(promotion.startDate) > new Date() ? 'Chưa bắt đầu' :
                        promotion.maxUsage && promotion.usedCount >= promotion.maxUsage ? 'Đã hết lượt sử dụng' :
                        'Đang hoạt động' 
                      }
                      disabled 
                    />
                  </div>
                </>
              )}
            </div>

            {!isViewMode && (
              <div className={styles.modalActions}>
                <button type="button" onClick={onClose} className={styles.btnCancel} disabled={saving}>
                  Hủy
                </button>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }} 
                  className={styles.btnSave} 
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

