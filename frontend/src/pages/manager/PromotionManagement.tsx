import React, { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import promotionService from '../../services/promotionService';
import { PromotionDto, normalizeIsActive, PromotionTargetDto } from '../../types/promotion.types';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import styles from '../../styles/manager/PromotionManagement.module.css';

interface PromotionListFilters {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: 'all' | 'active' | 'inactive';
  discountTypeFilter: 'all' | 'Percentage' | 'FixedAmount';
  timelineFilter: 'all' | 'upcoming' | 'ongoing' | 'expired';
  usageFilter: 'all' | 'limited' | 'unlimited';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

const defaultFilters: PromotionListFilters = {
  page: 1,
  pageSize: 10,
  search: '',
  statusFilter: 'all',
  discountTypeFilter: 'all',
  timelineFilter: 'all',
  usageFilter: 'all',
  sortBy: 'createdAt',
  sortDirection: 'desc'
};

const getInitialState = (): PromotionListFilters => {
  try {
    const savedState = localStorage.getItem('promotionListState');
    if (savedState) {
        return { ...defaultFilters, ...JSON.parse(savedState) };
    }
  } catch (e) {

  }
  return defaultFilters;
};

const formatDiscountValue = (value: number, type: string) => {
  if (type === 'Percentage') {
    return `${value}%`;
  }
  return `${value.toLocaleString('vi-VN')}đ`;
};

const formatIsoToDisplayDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
};

const parseDateInputValue = (value: string): string | null => {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [dayStr, monthStr, yearStr] = parts;
  if (dayStr.length !== 2 || monthStr.length !== 2 || yearStr.length !== 4) {
    return null;
  }
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date.toISOString();
};

const formatDateInputValue = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function PromotionManagement() {
  const [allPromotions, setAllPromotions] = useState<PromotionDto[]>([]);
  const [filters, setFilters] = useState<PromotionListFilters>(getInitialState);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<PromotionDto | null>(null);
  const [editing, setEditing] = useState<PromotionDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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
      setAllPromotions(promotions || []);
    } catch (error) {
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
      const currentIsActive = normalizeIsActive(promotion.isActive);
      const newIsActive = !currentIsActive;
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
      
      await promotionService.updatePromotion(promotion.id, updatedData);
      showToast(`Đã ${currentIsActive ? 'tắt' : 'bật'} khuyến mãi thành công`, 'success');
      await load();
    } catch (error: any) {
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
      } else if (action === 'toggle') {
        await handleToggleStatus(promotion);
      }
    } catch (error: any) {
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
      timelineFilter: 'all',
      usageFilter: 'all'
    });
  };

  const processedItems = useMemo(() => {
    const now = new Date();
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

      const promoStart = p.startDate ? new Date(p.startDate) : null;
      const promoEnd = p.endDate ? new Date(p.endDate) : null;
      const isUpcoming = promoStart ? promoStart > now : false;
      const isExpired = promoEnd ? promoEnd < now : false;
      const isOngoing = promoStart && promoEnd
        ? promoStart <= now && now <= promoEnd
        : isActive && !isExpired;

      const okTimeline = (() => {
        switch (filters.timelineFilter) {
          case 'upcoming': return isUpcoming;
          case 'ongoing': return isOngoing;
          case 'expired': return isExpired;
          default: return true;
        }
      })();

      const isLimited = typeof p.maxUsage === 'number' && p.maxUsage > 0;
      const okUsage = filters.usageFilter === 'all' ||
        (filters.usageFilter === 'limited' ? isLimited : !isLimited);

      return okSearch && okStatus && okDiscountType && okTimeline && okUsage;
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
  const activeRate = stats.total ? Math.round((stats.active / stats.total) * 100) : 0;
  const inactiveRate = stats.total ? Math.round((stats.inactive / stats.total) * 100) : 0;
  const todayLabel = useMemo(() => 
    new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }), []);

  const summaryCards = useMemo(() => ([
    {
      label: 'Tổng khuyến mãi',
      value: stats.total.toLocaleString('vi-VN'),
      description: 'Chiến dịch đã tạo',
      icon: 'bi-tags',
      accent: styles.cardPrimary
    },
    {
      label: 'Tỷ lệ hoạt động',
      value: `${activeRate}%`,
      description: `${stats.active} chiến dịch đang chạy`,
      icon: 'bi-lightning-charge',
      accent: styles.cardPositive
    },
    {
      label: 'Tỷ lệ tạm dừng',
      value: `${inactiveRate}%`,
      description: `${stats.inactive} chiến dịch tạm ngưng`,
      icon: 'bi-pause-circle',
      accent: styles.cardWarning
    },
    {
      label: 'Tổng lượt sử dụng',
      value: stats.totalUsed.toLocaleString('vi-VN'),
      description: 'Tích lũy toàn hệ thống',
      icon: 'bi-graph-up-arrow',
      accent: styles.cardNeutral
    }
  ]), [stats, activeRate, inactiveRate]);

  const upcomingPromotions = useMemo(() => {
    const now = new Date();
    return processedItems
      .filter(p => p.startDate && new Date(p.startDate) > now)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
      .slice(0, 3);
  }, [processedItems]);

  const expiringSoon = useMemo(() => {
    const now = new Date();
    const nextSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return processedItems
      .filter(p => p.endDate && new Date(p.endDate) <= nextSevenDays && new Date(p.endDate) >= now)
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
      .slice(0, 3);
  }, [processedItems]);

  const topPerformers = useMemo(
    () => [...processedItems]
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 3),
    [processedItems]
  );

  const getUsageRate = (promotion: PromotionDto) => {
    if (!promotion.maxUsage || promotion.maxUsage <= 0) return null;
    const rate = Math.min(100, (promotion.usedCount / promotion.maxUsage) * 100);
    return Math.round(rate);
  };

  const pendingPromotion = confirmationDialog.promotion;
  const isToggleDialog = confirmationDialog.action === 'toggle';
  const nextStatusLabel = pendingPromotion && normalizeIsActive(pendingPromotion.isActive) ? 'tắt' : 'bật';

  const drawerHasActiveFilter = 
    filters.statusFilter !== 'all' ||
    filters.timelineFilter !== 'all' ||
    filters.discountTypeFilter !== 'all' ||
    filters.usageFilter !== 'all' ||
    !(filters.sortBy === 'createdAt' && filters.sortDirection === 'desc');

  const handleSortPresetChange = (value: string) => {
    const [sortBy, direction] = value.split(':');
    setFilters(prev => ({ ...prev, sortBy, sortDirection: direction as 'asc' | 'desc' }));
  };

  return (
    <div className={styles.container}>
      <section className={styles.pageHeader}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <i className="bi bi-stars"></i>
          </div>
          <div>
            <h1 className={styles.title}>Quản lý khuyến mãi</h1>
            <p className={styles.subtitle}>
              Theo dõi chiến dịch, cập nhật trạng thái và tối ưu hiệu suất ưu đãi một cách trực quan.
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>{todayLabel}</span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.overviewSection}>
        <div className={styles.summaryGrid}>
          {summaryCards.map(card => (
            <div key={card.label} className={`${styles.summaryCard} ${card.accent}`}>
              <div className={styles.summaryCardIcon}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <div>
                <p>{card.label}</p>
                <h3>{card.value}</h3>
                <span>{card.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.activityPanel}>
          <div className={styles.activityHeader}>
            <div className={styles.activityTitle}>
              <span>Trạng thái vận hành</span>
              <strong>Giám sát chiến dịch</strong>
            </div>
            <button onClick={load} className={styles.refreshButton} title="Làm mới dữ liệu">
              <i className="bi bi-arrow-repeat"></i>
              <span>Làm mới</span>
            </button>
          </div>
          <div className={styles.activityStats}>
            <div>
              <span>Đang chạy</span>
              <strong>{stats.active}</strong>
            </div>
            <div>
              <span>Tạm dừng</span>
              <strong>{stats.inactive}</strong>
            </div>
          </div>
          <div className={styles.activityLists}>
            <div>
              <h5>Sắp diễn ra</h5>
              {upcomingPromotions.length ? upcomingPromotions.map(promo => (
                <div key={promo.id} className={styles.activityItem}>
                  <div>
                    <p>{promo.name}</p>
                    <small>Bắt đầu: {formatDateTime(promo.startDate)}</small>
                  </div>
                  {getStatusBadge(promo.isActive)}
                </div>
              )) : (
                <p className={styles.timelineEmpty}>Chưa có chiến dịch mới.</p>
              )}
            </div>
            <div>
              <h5>Sắp hết hạn</h5>
              {expiringSoon.length ? expiringSoon.map(promo => (
                <div key={`exp-${promo.id}`} className={styles.activityItem}>
                  <div>
                    <p>{promo.name}</p>
                    <small>Kết thúc: {formatDateTime(promo.endDate)}</small>
                  </div>
                  {getStatusBadge(promo.isActive)}
                </div>
              )) : (
                <p className={styles.timelineEmpty}>Không có chiến dịch cần lưu ý.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.filterBar}>
        <div className={styles.filterBarLeft}>
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
        </div>

        <div className={styles.filterBarRight}>
          <button 
            className={`${styles.btnFilter} ${isFilterDrawerOpen ? styles.active : ''}`}
            onClick={() => setIsFilterDrawerOpen(prev => !prev)}
          >
            <i className="bi bi-sliders2"></i>
            Bộ lọc chi tiết
            {drawerHasActiveFilter && <span className={styles.filterBadge}></span>}
          </button>
          <button onClick={() => setCreating(true)} className={styles.btnCreate}>
            <i className="bi bi-plus-lg"></i>
            Tạo khuyến mãi
          </button>
        </div>
      </div>

      {isFilterDrawerOpen && (
        <div className={styles.filterDrawer}>
          <div className={styles.drawerGrid}>
            <div className={styles.drawerField}>
              <label>Trạng thái</label>
              <select value={filters.statusFilter} onChange={e => handleFilterChange('statusFilter', e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
            <div className={styles.drawerField}>
              <label>Chu kỳ chiến dịch</label>
              <select value={filters.timelineFilter} onChange={e => handleFilterChange('timelineFilter', e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="ongoing">Đang triển khai</option>
                <option value="expired">Đã kết thúc</option>
              </select>
            </div>
            <div className={styles.drawerField}>
              <label>Loại giảm giá</label>
              <select value={filters.discountTypeFilter} onChange={e => handleFilterChange('discountTypeFilter', e.target.value)}>
                <option value="all">Tất cả loại</option>
                <option value="Percentage">Phần trăm</option>
                <option value="FixedAmount">Cố định</option>
              </select>
            </div>
            <div className={styles.drawerField}>
              <label>Giới hạn sử dụng</label>
              <select value={filters.usageFilter} onChange={e => handleFilterChange('usageFilter', e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="limited">Có giới hạn</option>
                <option value="unlimited">Không giới hạn</option>
              </select>
            </div>
            <div className={styles.drawerField}>
              <label>Sắp xếp</label>
              <select
                value={`${filters.sortBy}:${filters.sortDirection}`}
                onChange={e => handleSortPresetChange(e.target.value)}
              >
                <option value="createdAt:desc">Mới tạo gần đây</option>
                <option value="createdAt:asc">Mới tạo lâu nhất</option>
                <option value="startDate:asc">Bắt đầu sớm nhất</option>
                <option value="startDate:desc">Bắt đầu muộn nhất</option>
                <option value="endDate:asc">Kết thúc sớm nhất</option>
                <option value="endDate:desc">Kết thúc muộn nhất</option>
                <option value="discountValue:desc">Giá trị giảm cao nhất</option>
                <option value="usedCount:desc">Lượt dùng nhiều nhất</option>
              </select>
            </div>
          </div>
          <div className={styles.drawerActions}>
            <button onClick={handleResetFilters} className={styles.btnGhost}>
              Đặt lại
            </button>
            <button onClick={() => setIsFilterDrawerOpen(false)} className={styles.btnApplyFilter}>
              Áp dụng
            </button>
          </div>
        </div>
      )}

      <div className={styles.viewToolbar}>
        <div>
          <h3>Danh sách khuyến mãi</h3>
          <p>Đang hiển thị {paginatedItems.length} / {processedItems.length} chiến dịch phù hợp bộ lọc</p>
        </div>
      </div>

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
                  <th
                    onClick={() => handleSort('code')}
                    className={`${styles.sortable} ${filters.sortBy === 'code' ? styles.sortActive : ''}`}
                  >
                    Mã
                    {filters.sortBy === 'code' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className={`${styles.sortable} ${filters.sortBy === 'name' ? styles.sortActive : ''}`}
                  >
                    Tên
                    {filters.sortBy === 'name' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Loại</th>
                  <th
                    onClick={() => handleSort('discountValue')}
                    className={`${styles.sortable} ${filters.sortBy === 'discountValue' ? styles.sortActive : ''}`}
                  >
                    Giá trị
                    {filters.sortBy === 'discountValue' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('usedCount')}
                    className={`${styles.sortable} ${filters.sortBy === 'usedCount' ? styles.sortActive : ''}`}
                  >
                    Đã dùng
                    {filters.sortBy === 'usedCount' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Giới hạn</th>
                  <th
                    onClick={() => handleSort('startDate')}
                    className={`${styles.sortable} ${filters.sortBy === 'startDate' ? styles.sortActive : ''}`}
                  >
                    Ngày bắt đầu
                    {filters.sortBy === 'startDate' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort('endDate')}
                    className={`${styles.sortable} ${filters.sortBy === 'endDate' ? styles.sortActive : ''}`}
                  >
                    Ngày kết thúc
                    {filters.sortBy === 'endDate' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right', width: '220px' }}>Thao tác</th>
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
                          className={`${styles.actionBtn} ${styles.actionView}`}
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button 
                          onClick={() => setEditing(promotion)}
                          className={`${styles.actionBtn} ${styles.actionEdit}`}
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => setConfirmationDialog({ isOpen: true, promotion, action: 'toggle' })}
                          className={`${styles.actionBtn} ${styles.actionToggle}`}
                          title={normalizeIsActive(promotion.isActive) ? 'Tắt khuyến mãi' : 'Bật khuyến mãi'}
                        >
                          <i className={`bi bi-${normalizeIsActive(promotion.isActive) ? 'toggle-off' : 'toggle-on'}`}></i>
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
            <div className={styles.emptyIllustration}>
              <i className="bi bi-archive"></i>
            </div>
            <h3>Chưa có chiến dịch phù hợp</h3>
            <p>Hãy điều chỉnh bộ lọc hoặc tạo khuyến mãi mới để bắt đầu.</p>
            <button onClick={() => setCreating(true)} className={styles.btnCreate}>
              <i className="bi bi-plus-circle"></i>
              Tạo khuyến mãi đầu tiên
            </button>
          </div>
        )}
      </div>

      {processedItems.length > 0 && (
        <section className={styles.insightsSection}>
          <div className={styles.timelineCard}>
            <h4>Sắp diễn ra</h4>
            {upcomingPromotions.length ? upcomingPromotions.map(promo => (
              <div key={promo.id} className={styles.timelineItem}>
                <div className={styles.timelinePoint}></div>
                <div className={styles.timelineText}>
                  <p>{promo.name}</p>
                  <small>Khởi chạy: {formatDateTime(promo.startDate)}</small>
                </div>
                <span className={styles.timelineTag}>Sắp bắt đầu</span>
              </div>
            )) : (
              <p className={styles.timelineEmpty}>Không có chiến dịch sắp diễn ra.</p>
            )}

            <h4>Gần hết hạn</h4>
            {expiringSoon.length ? expiringSoon.map(promo => (
              <div key={`exp-${promo.id}`} className={styles.timelineItem}>
                <div className={styles.timelinePointWarning}></div>
                <div className={styles.timelineText}>
                  <p>{promo.name}</p>
                  <small>Kết thúc: {formatDateTime(promo.endDate)}</small>
                </div>
                <span className={styles.timelineTagWarning}>Theo dõi</span>
              </div>
            )) : (
              <p className={styles.timelineEmpty}>Không có chiến dịch sắp hết hạn.</p>
            )}
          </div>

          <div className={styles.topCard}>
            <h4>Hiệu suất cao nhất</h4>
            <ul>
              {topPerformers.map(promo => (
                <li key={promo.id}>
                  <div>
                    <strong>{promo.name}</strong>
                    <span>{promo.code}</span>
                  </div>
                  <div className={styles.topNumbers}>
                    <span>{promo.usedCount.toLocaleString('vi-VN')} lượt</span>
                    {promo.maxUsage && (
                      <small>{Math.round((promo.usedCount / promo.maxUsage) * 100)}% giới hạn</small>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={isToggleDialog ? 'Thay đổi trạng thái khuyến mãi' : 'Xóa khuyến mãi'}
        message={
          isToggleDialog
            ? `Bạn có chắc chắn muốn ${nextStatusLabel} khuyến mãi "${pendingPromotion?.name}"?`
            : `Bạn có chắc chắn muốn xóa khuyến mãi "${pendingPromotion?.name}"? Hành động này không thể hoàn tác.`
        }
        confirmText={isToggleDialog ? 'Xác nhận' : 'Xóa'}
        type={isToggleDialog ? 'warning' : 'danger'}
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
  const [formData, setFormData] = useState({
    code: promotion?.code || '',
    name: promotion?.name || '',
    description: promotion?.description || '',
    discountType: promotion?.discountType || 'Percentage',
    discountValue: promotion?.discountValue || 0,
    maxUsage: promotion?.maxUsage || undefined,
    startDate: promotion?.startDate || '',
    endDate: promotion?.endDate || '',
    isActive: promotion ? normalizeIsActive(promotion.isActive) : true,
    applicableTargets: promotion?.applicableTargets || '',
  });
  const [startDateInput, setStartDateInput] = useState(() => formatIsoToDisplayDate(promotion?.startDate));
  const [endDateInput, setEndDateInput] = useState(() => formatIsoToDisplayDate(promotion?.endDate));
  const [discountValueInput, setDiscountValueInput] = useState(
    promotion?.discountValue ? String(promotion.discountValue) : ''
  );
  
  // Quản lý danh sách nhóm áp dụng được chọn dưới dạng mảng
  const [selectedTargets, setSelectedTargets] = useState<string[]>(() => {
    if (promotion?.applicableTargets) {
      return promotion.applicableTargets.split(',').map(t => t.trim()).filter(t => t);
    }
    return [];
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [liveValidationEnabled, setLiveValidationEnabled] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [targets, setTargets] = useState<PromotionTargetDto[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const { showToast } = useToast();

  // Tải danh sách nhóm áp dụng khi mở modal
  React.useEffect(() => {
    const fetchTargets = async () => {
      setLoadingTargets(true);
      try {
        const data = await promotionService.getPromotionTargets();
        setTargets(data);
      } catch (error) {
        showToast('Không thể tải danh sách nhóm áp dụng', 'error');
      } finally {
        setLoadingTargets(false);
      }
    };

    fetchTargets();
  }, []);

  const visibleTargets = React.useMemo(
    () => targets.filter(t => !/vip/i.test(`${t.name || ''}${t.target || ''}`)),
    [targets]
  );

  const targetDisplayMap = React.useMemo<Record<string, { name: string; description?: string }>>(() => ({
    all: { name: 'Tất cả người dùng', description: 'Áp dụng cho toàn bộ người dùng hệ thống' },
    all_users: { name: 'Tất cả người dùng', description: 'Áp dụng cho toàn bộ người dùng hệ thống' },
    new_users: { name: 'Người dùng mới', description: 'Áp dụng cho người dùng mới đăng ký' },
  }), []);

  React.useEffect(() => {
    setFormData({
      code: promotion?.code || '',
      name: promotion?.name || '',
      description: promotion?.description || '',
      discountType: promotion?.discountType || 'Percentage',
      discountValue: promotion?.discountValue || 0,
      maxUsage: promotion?.maxUsage || undefined,
      startDate: promotion?.startDate || '',
      endDate: promotion?.endDate || '',
      isActive: promotion ? normalizeIsActive(promotion.isActive) : true,
      applicableTargets: promotion?.applicableTargets || '',
    });
    setStartDateInput(formatIsoToDisplayDate(promotion?.startDate));
    setEndDateInput(formatIsoToDisplayDate(promotion?.endDate));
    setDiscountValueInput(promotion?.discountValue ? String(promotion.discountValue) : '');
    if (promotion?.applicableTargets) {
      setSelectedTargets(
        promotion.applicableTargets.split(',').map(t => t.trim()).filter(t => t)
      );
    } else {
      setSelectedTargets([]);
    }
    setErrors({});
    setTouchedFields({});
    setLiveValidationEnabled(false);
    setHasSubmitted(false);
  }, [promotion, mode]);

  const buildValidationErrors = React.useCallback((
    data: typeof formData,
    startInput: string,
    endInput: string,
    discountInput: string
  ) => {
    const newErrors: Record<string, string> = {};
    const dateFormatRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!data.code.trim()) {
      newErrors.code = 'Mã khuyến mãi là bắt buộc';
    } else {
      const codeRegex = /^[A-Za-z0-9_-]+$/;
      if (!codeRegex.test(data.code)) {
        newErrors.code = 'Mã khuyến mãi chỉ được chứa chữ cái, số, gạch ngang và gạch dưới';
      }
    }

    if (!data.name.trim()) newErrors.name = 'Tên khuyến mãi là bắt buộc';
    const hasRawDiscount = discountInput !== '';
    const discountNumber = hasRawDiscount ? Number(discountInput) : (data.discountValue || 0);
    if (!discountNumber || discountNumber <= 0) {
      newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    } else if (data.discountType === 'Percentage' && discountNumber > 100) {
      newErrors.discountValue = 'Phần trăm giảm giá không được vượt quá 100%';
    }

    if (data.maxUsage && data.maxUsage < 1) {
      newErrors.maxUsage = 'Giới hạn sử dụng phải lớn hơn hoặc bằng 1';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isStartFormatValid = dateFormatRegex.test(startInput);
    const isEndFormatValid = dateFormatRegex.test(endInput);
    const startIso = isStartFormatValid ? parseDateInputValue(startInput) : null;
    const endIso = isEndFormatValid ? parseDateInputValue(endInput) : null;
    const parsedStart = startIso ? new Date(startIso) : null;
    const parsedEnd = endIso ? new Date(endIso) : null;

    if (!startInput) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc (dd/mm/yyyy)';
    } else if (!isStartFormatValid) {
      newErrors.startDate = 'Vui lòng nhập đúng định dạng dd/mm/yyyy';
    } else if (!startIso || !parsedStart || Number.isNaN(parsedStart.getTime())) {
      newErrors.startDate = 'Ngày bắt đầu không hợp lệ, vui lòng kiểm tra lại';
    } else if (parsedStart < today) {
      newErrors.startDate = 'Ngày bắt đầu không được nhỏ hơn hôm nay';
    }

    if (!endInput) {
      newErrors.endDate = 'Ngày kết thúc là bắt buộc (dd/mm/yyyy)';
    } else if (!isEndFormatValid) {
      newErrors.endDate = 'Vui lòng nhập đúng định dạng dd/mm/yyyy';
    } else if (!endIso || !parsedEnd || Number.isNaN(parsedEnd.getTime())) {
      newErrors.endDate = 'Ngày kết thúc không hợp lệ, vui lòng kiểm tra lại';
    } else if (parsedEnd < today) {
      newErrors.endDate = 'Ngày kết thúc không được nhỏ hơn hôm nay';
    }

    if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
      newErrors.endDate = 'Ngày kết thúc phải lớn hơn ngày bắt đầu';
    }

    return newErrors;
  }, []);

  React.useEffect(() => {
    if (!liveValidationEnabled) return;
    setErrors(buildValidationErrors(formData, startDateInput, endDateInput, discountValueInput));
  }, [buildValidationErrors, formData, startDateInput, endDateInput, discountValueInput, liveValidationEnabled]);

  const markFieldTouched = (field?: string) => {
    setLiveValidationEnabled(true);
    if (!field) return;
    setTouchedFields(prev => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleChange = (field: string, value: any) => {
    markFieldTouched(field);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartDateChange = (value: string) => {
    markFieldTouched('startDate');
    const formatted = formatDateInputValue(value);
    setStartDateInput(formatted);
    const isoString = formatted.length === 10 ? parseDateInputValue(formatted) : null;
    setFormData(prev => ({ ...prev, startDate: isoString || '' }));
  };

  const handleEndDateChange = (value: string) => {
    markFieldTouched('endDate');
    const formatted = formatDateInputValue(value);
    setEndDateInput(formatted);
    const isoString = formatted.length === 10 ? parseDateInputValue(formatted) : null;
    setFormData(prev => ({ ...prev, endDate: isoString || '' }));
  };

  const handleDiscountValueChange = (value: string) => {
    markFieldTouched('discountValue');
    const sanitized = value.replace(/[^\d.]/g, '');
    setDiscountValueInput(sanitized);
    handleChange('discountValue', sanitized === '' ? 0 : Number(sanitized));
  };

  // Xử lý thao tác chọn nhóm áp dụng
  const handleTargetToggle = (targetValue: string) => {
    setSelectedTargets(prev => {
      const newTargets = prev.includes(targetValue)
        ? prev.filter(t => t !== targetValue)
        : [...prev, targetValue];
      
      // Đồng bộ lại chuỗi applicableTargets trong form
      const targetsString = newTargets.join(',');
      setFormData(prevData => ({ ...prevData, applicableTargets: targetsString }));
      
      return newTargets;
    });
  };

  const validate = React.useCallback(() => {
    const newErrors = buildValidationErrors(formData, startDateInput, endDateInput, discountValueInput);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [buildValidationErrors, formData, startDateInput, endDateInput, discountValueInput]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLiveValidationEnabled(true);
    setHasSubmitted(true);
    
    const isValid = validate();
    if (!isValid) {
      showToast('Vui lòng kiểm tra lại thông tin', 'error');
      return;
    }

    const startIso = parseDateInputValue(startDateInput);
    const endIso = parseDateInputValue(endDateInput);

    setSaving(true);
    try {
      const submitData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || '',
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxUsage: formData.maxUsage || undefined,
        startDate: startIso || undefined,
        endDate: endIso || undefined,
        isActive: Boolean(formData.isActive), // Ensure it's a boolean
        applicableTargets: formData.applicableTargets || undefined,
      };
      
      await onSave(submitData);
    } catch (error: any) {
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
  const shouldShowError = (field: string) =>
    Boolean(errors[field] && (hasSubmitted || touchedFields[field]));

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <h2>
              {mode === 'view' ? 'Chi tiết khuyến mãi' : 
               mode === 'edit' ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
            </h2>
          </div>
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
                  className={shouldShowError('code') ? styles.error : ''}
                  title={mode === 'edit' ? 'Mã khuyến mãi không thể thay đổi khi chỉnh sửa' : ''}
                />
                {shouldShowError('code') && <span className={styles.errorText}>{errors.code}</span>}
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
                  className={shouldShowError('name') ? styles.error : ''}
                />
                {shouldShowError('name') && <span className={styles.errorText}>{errors.name}</span>}
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
                  value={discountValueInput}
                  onChange={e => handleDiscountValueChange(e.target.value)}
                  onBlur={() => {
                    if (!discountValueInput) {
                      setDiscountValueInput('');
                      handleChange('discountValue', 0);
                    }
                  }}
                  placeholder="0"
                  disabled={isViewMode}
                  className={shouldShowError('discountValue') ? styles.error : ''}
                  min="0"
                  step={formData.discountType === 'Percentage' ? '1' : '1000'}
                />
                {shouldShowError('discountValue') && <span className={styles.errorText}>{errors.discountValue}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Giới hạn sử dụng</label>
                <input
                  type="number"
                  value={formData.maxUsage || ''}
                  onChange={e => handleChange('maxUsage', e.target.value ? Number(e.target.value) : undefined)}
                  disabled={isViewMode}
                  placeholder="Để trống nếu không giới hạn"
                  min="1"
                  className={shouldShowError('maxUsage') ? styles.error : ''}
                />
                {shouldShowError('maxUsage') && <span className={styles.errorText}>{errors.maxUsage}</span>}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.dateRow}>
                  <div className={styles.dateField}>
                    <label>Ngày bắt đầu *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      value={startDateInput}
                      onChange={e => handleStartDateChange(e.target.value)}
                      disabled={isViewMode}
                      className={shouldShowError('startDate') ? styles.error : ''}
                      maxLength={10}
                    />
                    {shouldShowError('startDate') && <span className={styles.errorText}>{errors.startDate}</span>}
                  </div>

                  <div className={styles.dateField}>
                    <label>Ngày kết thúc *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      value={endDateInput}
                      onChange={e => handleEndDateChange(e.target.value)}
                      disabled={isViewMode}
                      className={shouldShowError('endDate') ? styles.error : ''}
                      maxLength={10}
                    />
                    {shouldShowError('endDate') && <span className={styles.errorText}>{errors.endDate}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Trạng thái khuyến mãi</label>
                {isViewMode ? (
                  <div className={styles.statusReadonly}>
                    {formData.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </div>
                ) : (
                  <div className={styles.statusToggle}>
                    <button
                      type="button"
                      className={`${styles.statusOption} ${formData.isActive ? `${styles.statusOptionActive} ${styles.statusActiveBtn}` : ''}`}
                      onClick={() => handleChange('isActive', true)}
                    >
                      <i className="bi bi-check-circle"></i> Hoạt động
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusOption} ${!formData.isActive ? `${styles.statusOptionActive} ${styles.statusOptionInactive}` : ''}`}
                      onClick={() => handleChange('isActive', false)}
                    >
                      <i className="bi bi-pause-circle"></i> Tạm dừng
                    </button>
                  </div>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Nhóm áp dụng khuyến mãi</span>
                  {!isViewMode && selectedTargets.length > 0 && (
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 500,
                      color: '#3b82f6',
                      backgroundColor: '#eff6ff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px'
                    }}>
                      {selectedTargets.length} nhóm
                    </span>
                  )}
                </label>
                {loadingTargets ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#718096' }}>
                    <i className="bi bi-hourglass-split"></i> Đang tải danh sách đối tượng...
                  </div>
                ) : (
                  <>
                    {!isViewMode && visibleTargets.length > 0 && (
                      <div style={{ 
                        marginBottom: '0.75rem', 
                        padding: '0.5rem',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        color: '#1e40af'
                      }}>
                        <i className="bi bi-info-circle-fill" style={{ marginRight: '0.5rem' }}></i>
                        Chọn một hoặc nhiều nhóm khách hàng cho chương trình này
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {visibleTargets.map(target => {
                        const key = target.target.trim();
                        const translation = targetDisplayMap[key];
                        const displayName = translation?.name || target.name;
                        const displayDesc = translation?.description || target.description;
                        return (
                        <label 
                          key={target.id} 
                          className={styles.checkboxLabel}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            padding: '0.75rem',
                            border: selectedTargets.includes(target.target) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: selectedTargets.includes(target.target) ? '#f0f9ff' : '#fff',
                            cursor: isViewMode ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedTargets.includes(target.target) ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTargets.includes(target.target)}
                            onChange={() => handleTargetToggle(target.target)}
                            disabled={isViewMode}
                            style={{ marginRight: '0.5rem', marginTop: '0.25rem' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '0.25rem' }}>
                              {displayName}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                              {displayDesc}
                            </div>
                          </div>
                        </label>
                        );
                      })}
                    </div>
                  </>
                )}
                {!loadingTargets && visibleTargets.length === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#718096', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
                    <i className="bi bi-info-circle"></i> Chưa có nhóm nào khả dụng
                  </div>
                )}
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
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Nhóm áp dụng khuyến mãi</label>
                    <div style={{ 
                      padding: '0.75rem', 
                      backgroundColor: '#f7fafc', 
                      borderRadius: '8px',
                      minHeight: '3rem'
                    }}>
                      {promotion.applicableTargets ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {promotion.applicableTargets.split(',').map((targetValue, idx) => {
                            const trimmed = targetValue.trim();
                            const target = visibleTargets.find(t => t.target === trimmed);
                            const translation = targetDisplayMap[trimmed];
                            const displayName = translation?.name || target?.name || trimmed;
                            return (
                              <span 
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '0.375rem 0.75rem',
                                  backgroundColor: '#3b82f6',
                                  color: '#fff',
                                  borderRadius: '6px',
                                  fontSize: '0.875rem',
                                  fontWeight: 500
                                }}
                              >
                                <i className="bi bi-people-fill" style={{ marginRight: '0.375rem' }}></i>
                                {displayName}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ color: '#718096', fontStyle: 'italic' }}>
                          Chưa thiết lập nhóm áp dụng
                        </span>
                      )}
                    </div>
                  </div>

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
                        'Hoạt động' 
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

