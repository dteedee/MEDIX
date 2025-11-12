import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bannerService } from '../../services/bannerService';
import { BannerDTO, CreateBannerRequest, UpdateBannerRequest } from '../../types/banner.types';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import BannerForm from './BannerForm';
import styles from '../../styles/admin/BannerManagement.module.css';

interface BannerListFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'active' | 'inactive';
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const getInitialState = (): BannerListFilters => {
  try {
    const savedState = localStorage.getItem('bannerListState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (e) {
    console.error("Failed to parse bannerListState from localStorage", e);
  }
  return {
    page: 1,
    pageSize: 10,
    search: '',
    statusFilter: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'displayOrder',
    sortDirection: 'asc' as const,
  };
};

export default function BannerManagement() {
  const [allBanners, setAllBanners] = useState<BannerDTO[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [filters, setFilters] = useState<BannerListFilters>(getInitialState);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<BannerDTO | null>(null);
  const [editing, setEditing] = useState<BannerDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageTitle, setSelectedImageTitle] = useState('');
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    banner: BannerDTO | null;
    action: 'lock' | 'unlock' | null;
  }>({
    isOpen: false,
    banner: null,
    action: null
  });

  const { showToast } = useToast();
  const navigate = useNavigate();

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate stats with real data
  const getStats = () => {
    const now = new Date();
    
    // Calculate date ranges
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    // Total banners created before last month
    const bannersCreatedBeforeLastMonth = allBanners.filter(b => {
      if (!b.createdAt) return false;
      const createdDate = new Date(b.createdAt);
      return createdDate < oneMonthAgo;
    }).length;
    
    // Total banner now
    const totalNow = allBanners.length;
    
    // Calculate change: how many new banners in last month
    const newBannersLastMonth = totalNow - bannersCreatedBeforeLastMonth;
    const totalBannerChange = bannersCreatedBeforeLastMonth > 0 
      ? ((newBannersLastMonth / bannersCreatedBeforeLastMonth) * 100)
      : (newBannersLastMonth > 0 ? 100 : 0);

    // Active banners: count banners that existed last week and are currently active
    const activeNow = allBanners.filter(b => b.isActive).length;
    
    // Count banners that existed a week ago (by createdAt)
    const existingLastWeek = allBanners.filter(b => {
      if (!b.createdAt) return false;
      const createdDate = new Date(b.createdAt);
      return createdDate < oneWeekAgo;
    });
    
    const activeLastWeek = existingLastWeek.filter(b => b.isActive).length;
    const activeChange = activeLastWeek > 0 
      ? ((activeNow - activeLastWeek) / activeLastWeek) * 100
      : (activeNow > 0 ? 100 : 0);

    // Inactive banners: similar logic
    const inactiveNow = allBanners.filter(b => !b.isActive).length;
    const inactiveLastWeek = existingLastWeek.filter(b => !b.isActive).length;
    const inactiveChange = inactiveLastWeek > 0
      ? ((inactiveNow - inactiveLastWeek) / inactiveLastWeek) * 100
      : (inactiveNow > 0 ? 100 : 0);

    return {
      totalBannerChange,
      activeChange,
      inactiveChange
    };
  };

  const stats = getStats();

  const load = async () => {
    setLoading(true);
    try {
      console.log('Loading banners...');
      const banners = await bannerService.getAll({ page: 1, pageSize: 9999 });
      console.log('Loaded banners:', banners);
      console.log('Banners with isLocked field:', banners.map(b => ({ id: b.id, title: b.bannerTitle, isLocked: b.isLocked })));
      setAllBanners(banners || []);
      setTotal(banners?.length);
    } catch (error) {
      console.error('Error loading banners:', error);
      showToast('Không thể tải danh sách banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('bannerListState', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filters.page, filters.pageSize]);

  const handleFilterChange = (key: keyof BannerListFilters, value: any) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value };
      if (key !== 'page') newState.page = 1;
      return newState;
    });
  };

  const handleStatusChange = (bannerToUpdate: BannerDTO, isBeingLocked: boolean) => {
    // For banners, lock/unlock is based on isActive status
    // Lock = set isActive to false, Unlock = set isActive to true
    setConfirmationDialog({
      isOpen: true,
      banner: bannerToUpdate,
      action: isBeingLocked ? 'lock' : 'unlock'
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmationDialog.banner || !confirmationDialog.action) return;

    const { banner: currentBanner, action } = confirmationDialog;
    const isBeingLocked = action === 'lock';
    const actionText = isBeingLocked ? 'khóa' : 'mở khóa';

    console.log('Confirming status change:', {
      bannerId: currentBanner.id,
      title: currentBanner.bannerTitle,
      currentIsActive: currentBanner.isActive,
      isBeingLocked,
      action
    });

    setConfirmationDialog({ isOpen: false, banner: null, action: null });
    showToast(`Đang ${actionText} banner "${currentBanner.bannerTitle}"...`, 'info');

    setUpdatingIds(prev => ({ ...prev, [currentBanner.id]: true }));

    try {
      // Directly use the update service to toggle isActive status
      const newIsActive = !isBeingLocked;
      console.log(`Using update service to set isActive to ${newIsActive} for banner:`, currentBanner.id);

      await bannerService.update(currentBanner.id, {
        isActive: newIsActive,
        bannerTitle: currentBanner.bannerTitle,
        displayOrder: currentBanner.displayOrder,
        bannerImageUrl: currentBanner.bannerImageUrl,
        bannerUrl: currentBanner.bannerUrl,
        // Include other required fields if any, to prevent validation errors
        startDate: currentBanner.startDate ?? undefined,
        endDate: currentBanner.endDate ?? undefined,
      });

      showToast(`Đã ${actionText} banner thành công.`, 'success');
      
      // Reload data
      console.log('Reloading banners after lock/unlock...');
      await load();
    } catch (error: any) {
      console.error('Error locking/unlocking banner:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái banner.';
      showToast(message, 'error');
    } finally {
      setUpdatingIds(prev => ({ ...prev, [currentBanner.id]: false }));
    }
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFilters(prev => ({ ...prev, sortBy: column, sortDirection: 'desc' as const }));
    }
  };

  const handleViewDetails = (banner: BannerDTO) => {
    setViewing(banner);
  };

  const handleEdit = (banner: BannerDTO) => {
    setEditing(banner);
  };

  const handleCreateNew = () => {
    setCreating(true);
  };

  const handleImageClick = (imageUrl: string, imageTitle: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageTitle(imageTitle);
    setShowImagePopup(true);
  };

  const closeImagePopup = () => {
    setShowImagePopup(false);
    setSelectedImageUrl('');
    setSelectedImageTitle('');
  };

  const handleResetFilters = () => {
    setFilters({
      ...filters,
      statusFilter: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  const processedItems = useMemo(() => {
    const from = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const to = filters.dateTo ? (() => {
      const date = new Date(filters.dateTo);
      date.setHours(23, 59, 59, 999);
      return date;
    })() : undefined;

    const filtered = allBanners.filter(b => {
      const searchTerm = filters.search.toLowerCase();
      const okSearch = !searchTerm ||
        (b.bannerTitle && b.bannerTitle.toLowerCase().includes(searchTerm));

      // Use isActive for status filtering (isLocked may not be available from backend)
      const okStatus = filters.statusFilter === 'all' || 
        (filters.statusFilter === 'active' ? b.isActive : 
         filters.statusFilter === 'inactive' ? !b.isActive : true);

      // Sửa logic lọc ngày: kiểm tra sự giao thoa giữa khoảng thời gian của banner và bộ lọc
      const okDate = (() => {
        if (!from && !to) return true; // Không có bộ lọc ngày

        const bannerStart = b.startDate ? new Date(b.startDate) : null;
        const bannerEnd = b.endDate ? new Date(b.endDate) : null;

        // Nếu banner không có ngày bắt đầu hoặc kết thúc, nó không thể khớp với bộ lọc có ngày
        if (!bannerStart || !bannerEnd) return false;

        // Điều kiện để hai khoảng thời gian giao nhau:
        // (StartA <= EndB) and (EndA >= StartB)
        const overlaps = (!from || bannerEnd >= from) && (!to || bannerStart <= to);
        return overlaps;
      })();

      return okSearch && okStatus && okDate;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA: any, valB: any;
      
      if (filters.sortBy === 'startDate' || filters.sortBy === 'endDate') {
        valA = a[filters.sortBy] ? new Date(a[filters.sortBy]!).getTime() : 0;
        valB = b[filters.sortBy] ? new Date(b[filters.sortBy]!).getTime() : 0;
      } else if (filters.sortBy === 'bannerTitle') {
        valA = (a.bannerTitle || '').toLowerCase();
        valB = (b.bannerTitle || '').toLowerCase();
      } else if (filters.sortBy === 'isActive') {
        valA = a.isActive ? 1 : 0;
        valB = b.isActive ? 1 : 0;
      } else if (filters.sortBy === 'displayOrder') {
        valA = a.displayOrder || 0;
        valB = b.displayOrder || 0;
      }

      if (valA < valB) return filters.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [allBanners, filters]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (isActive: boolean, isLocked: boolean) => {
    // If isLocked field is available and true, show locked status
    if (isLocked !== undefined && isLocked) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusLocked}`}>
          <i className="bi bi-lock-fill"></i>
          Đã khóa
        </span>
      );
    }
    // Otherwise use isActive status
    return (
      <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
        <i className={`bi bi-${isActive ? 'check-circle-fill' : 'x-circle-fill'}`}></i>
        {isActive ? 'Hoạt động' : 'Tạm dừng'}
      </span>
    );
  };

  const paginatedItems = useMemo(() => processedItems.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize), [processedItems, filters.page, filters.pageSize]);
  const totalPages = Math.ceil(processedItems.length / filters.pageSize);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Banner</h1>
          <p className={styles.subtitle}>Quản lý và theo dõi các banner quảng cáo</p>
        </div>
        <button onClick={handleCreateNew} className={styles.btnCreate}>
          <i className="bi bi-plus-lg"></i>
          Tạo mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-images"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số banner</div>
            <div className={styles.statValue}>{total ?? 0}</div>
            <div className={styles.statTrend}>
              {stats.totalBannerChange >= 0 ? (
                <i className="bi bi-graph-up"></i>
              ) : (
                <i className="bi bi-graph-down"></i>
              )}
              <span>
                {stats.totalBannerChange >= 0 ? '+' : ''}
                {stats.totalBannerChange.toFixed(1)}% so với tháng trước
              </span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-images"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>
              {allBanners.filter(b => b.isActive).length}
            </div>
            <div className={`${styles.statTrend} ${stats.activeChange < 0 ? styles.negative : ''}`}>
              {stats.activeChange >= 0 ? (
                <i className="bi bi-graph-up"></i>
              ) : (
                <i className="bi bi-graph-down"></i>
              )}
              <span>
                {stats.activeChange >= 0 ? '+' : ''}
                {stats.activeChange.toFixed(1)}% tuần này
              </span>
            </div>
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
            <div className={styles.statLabel}>Ngừng hoạt động</div>
            <div className={styles.statValue}>
              {allBanners.filter(b => !b.isActive).length}
            </div>
            <div className={`${styles.statTrend} ${stats.inactiveChange >= 0 ? styles.negative : ''}`}>
              {stats.inactiveChange < 0 ? (
                <i className="bi bi-graph-down"></i>
              ) : (
                <i className="bi bi-graph-up"></i>
              )}
              <span>
                {stats.inactiveChange >= 0 ? '+' : ''}
                {stats.inactiveChange.toFixed(1)}% tuần này
              </span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-pause-circle-fill"></i>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
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
          {(filters.statusFilter !== 'all' || filters.dateFrom || filters.dateTo) && (
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
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-event"></i>
                Từ ngày
              </label>
              <input 
                type="date" 
                value={filters.dateFrom} 
                onChange={e => handleFilterChange('dateFrom', e.target.value)} 
              />
            </div>

            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-calendar-check"></i>
                Đến ngày
              </label>
              <input 
                type="date" 
                value={filters.dateTo} 
                onChange={e => handleFilterChange('dateTo', e.target.value)} 
              />
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
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th onClick={() => handleSort('bannerTitle')} className={styles.sortable}>
                    Tiêu đề
                    {filters.sortBy === 'bannerTitle' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Ảnh</th>
                  <th onClick={() => handleSort('displayOrder')} className={styles.sortable}>
                    Thứ tự
                    {filters.sortBy === 'displayOrder' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('isActive')} className={styles.sortable}>
                    Trạng thái
                    {filters.sortBy === 'isActive' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
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
                  <th style={{ textAlign: 'right', width: '150px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((banner, index) => (
                  <tr key={banner.id} className={styles.tableRow}>
                    <td className={styles.indexCell}>
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    <td>
                      <div className={styles.titleCell}>
                        <span className={styles.titleText}>{banner.bannerTitle}</span>
                      </div>
                    </td>
                    <td>
                      {banner.bannerImageUrl ? (
                        <div 
                          className={styles.imageContainer}
                          onClick={() => handleImageClick(banner.bannerImageUrl!, banner.bannerTitle)}
                          title="Click để xem ảnh lớn"
                        >
                          <img src={banner.bannerImageUrl} alt={banner.bannerTitle} className={styles.bannerImage} />
                          <div className={styles.imageOverlay}>
                            <i className="bi bi-eye"></i>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noImage}>Không có</div>
                      )}
                    </td>
                    <td>
                      <span className={styles.orderBadge}>{banner.displayOrder !== undefined && banner.displayOrder !== null ? banner.displayOrder : 'N/A'}</span>
                    </td>
                    <td>{getStatusBadge(banner.isActive, banner.isLocked || false)}</td>
                    <td className={styles.dateCell}>{formatDate(banner.startDate)}</td>
                    <td className={styles.dateCell}>{formatDate(banner.endDate)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => handleViewDetails(banner)} title="Xem chi tiết" className={styles.actionBtn}>
                          <i className="bi bi-eye"></i>
                        </button>
                        <button onClick={() => handleEdit(banner)} title="Sửa" className={styles.actionBtn}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleStatusChange(banner, banner.isActive)}
                          disabled={Boolean(updatingIds[banner.id])}
                          title={banner.isActive ? 'Tạm dừng (Khóa)' : 'Kích hoạt (Mở khóa)'}
                          className={`${styles.actionBtn} ${banner.isActive ? styles.actionLock : styles.actionUnlock}`}
                        >
                          <i className={`bi bi-${banner.isActive ? 'lock' : 'unlock'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox"></i>
            <p>Không tìm thấy banner nào</p>
          </div>
        )}

        {/* Pagination */}
        {processedItems.length > 0 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>Hiển thị {(filters.page - 1) * filters.pageSize + 1} – {Math.min(filters.page * filters.pageSize, processedItems.length)} trong tổng số {processedItems.length} kết quả</div>

            <div className={styles.paginationControls}>
              <select value={filters.pageSize} onChange={e => setFilters(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}>
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={15}>15 / trang</option>
                <option value={20}>20 / trang</option>
              </select>

              <div className={styles.paginationButtons}>
                <button 
                  onClick={() => handleFilterChange('page', 1)} 
                  disabled={filters.page <= 1}
                  title="Trang đầu"
                >
                  <i className="bi bi-chevron-double-left"></i>
                </button>
                <button 
                  onClick={() => handleFilterChange('page', filters.page - 1)} 
                  disabled={filters.page <= 1}
                  title="Trang trước"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                
                <span className={styles.pageIndicator}>
                  {filters.page} / {totalPages || 1}
                </span>

                <button 
                  onClick={() => handleFilterChange('page', filters.page + 1)} 
                  disabled={filters.page >= totalPages}
                  title="Trang sau"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button 
                  onClick={() => handleFilterChange('page', totalPages)} 
                  disabled={filters.page >= totalPages}
                  title="Trang cuối"
                >
                  <i className="bi bi-chevron-double-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Popup */}
      {showImagePopup && (
        <div className={styles.imageModalOverlay} onClick={closeImagePopup}>
          <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.imageModalHeader}>
              <h3>{selectedImageTitle}</h3>
              <button className={styles.closeButton} onClick={closeImagePopup}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.imageModalBody}>
              <img src={selectedImageUrl} alt={selectedImageTitle} className={styles.popupImage} />
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết Banner</h2>
              <button onClick={() => setViewing(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <BannerForm
                banner={viewing}
                mode="view"
                onSaved={() => {}}
                onCancel={() => setViewing(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Chỉnh sửa Banner</h2>
              <button onClick={() => setEditing(null)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <BannerForm
                banner={editing}
                mode="edit"
                onSaved={async () => {
                  setEditing(null);
                  await load();
                }}
                onCancel={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Tạo Banner mới</h2>
              <button onClick={() => setCreating(false)} className={styles.closeButton}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <BannerForm
                mode="create"
                onSaved={async () => {
                  setCreating(false);
                  await load();
                }}
                onCancel={() => setCreating(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.action === 'lock' ? 'Xác nhận tạm dừng banner' : 'Xác nhận kích hoạt banner'}
        message={
          confirmationDialog.action === 'lock' 
            ? `Bạn có chắc muốn tạm dừng (khóa) banner "${confirmationDialog.banner?.bannerTitle}" không? Banner sẽ không hiển thị trên trang chủ và các trang khác.`
            : `Bạn có chắc muốn kích hoạt (mở khóa) banner "${confirmationDialog.banner?.bannerTitle}" không? Banner sẽ được hiển thị trở lại.`
        }
        confirmText={confirmationDialog.action === 'lock' ? 'Tạm dừng banner' : 'Kích hoạt banner'}
        cancelText="Hủy"
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmationDialog({ isOpen: false, banner: null, action: null })}
        type={confirmationDialog.action === 'lock' ? 'danger' : 'warning'}
      />
    </div>
  );
}
