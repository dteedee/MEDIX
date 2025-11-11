import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DoctorService from '../../services/doctorService';
import DoctorRegistrationFormService from '../../services/doctorRegistrationFormService';
import DoctorDegreeService from '../../services/doctorDegreeService';
import { useToast } from '../../contexts/ToastContext';
import DoctorDetails from './DoctorDetails';
import DoctorReviewModal from './DoctorReviewModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import styles from '../../styles/manager/DoctorManagement.module.css';

interface DoctorFilters {
  page: number;
  pageSize: number;
  search: string;
  specializationFilter: string;
  statusFilter: 'all' | 'active' | 'inactive';
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  minRating?: number;
  maxRating?: number;
  minExperience?: number;
  maxExperience?: number;
}

const getInitialState = (): DoctorFilters => {
  try {
    const savedState = localStorage.getItem('doctorListState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (e) {
    console.error("Failed to parse doctorListState", e);
  }
  return {
    page: 1,
    pageSize: 10,
    search: '',
    specializationFilter: 'all',
    statusFilter: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  };
};

export default function DoctorManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [filters, setFilters] = useState<DoctorFilters>(getInitialState);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any>(null);
  const [reviewing, setReviewing] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const loadAllDoctors = async () => {
    try {
      const data = await DoctorService.getAll({ page: 1, pageSize: 0, searchTerm: '' });
      setAllDoctors(data.items || []);
      
      // Extract unique specializations
      const uniqueSpecs = [...new Set(data.items.map((d: any) => d.specialization).filter(Boolean))];
      setSpecializations(uniqueSpecs);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      showToast('Không thể tải danh sách bác sĩ', 'error');
    }
  };

  const loadPendingDoctors = async () => {
    try {
      const data = await DoctorRegistrationFormService.getAll({ page: 1, pageSize: 10000, searchTerm: '' });
      setPendingDoctors(data.doctors || []);
    } catch (error) {
      console.error("Failed to load pending doctors:", error);
      showToast('Không thể tải danh sách bác sĩ chờ duyệt', 'error');
    }
  };

  const loadDegrees = async () => {
    try {
      const data = await DoctorDegreeService.getAll();
      setDegrees(data || []);
    } catch (error) {
      console.error("Failed to load degrees:", error);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadAllDoctors(), loadPendingDoctors(), loadDegrees()]);
      setLastRefreshTime(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [location.pathname, load]);

  useEffect(() => {
    localStorage.setItem('doctorListState', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filters.page]);

  const handleFilterChange = (key: keyof DoctorFilters, value: any) => {
    setFilters(prev => {
      const newState = { ...prev, [key]: value };
      if (key !== 'page') newState.page = 1;
      return newState;
    });
  };

  const handleSort = (column: string) => {
    if (filters.sortBy === column) {
      handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFilters(prev => ({ ...prev, sortBy: column, sortDirection: 'desc' }));
    }
  };

  const handleViewDetails = async (doctor: any) => {
    setLoadingDetails(true);
    setViewing(doctor);
    try {
      if (activeTab === 'all') {
        const fullDoctor: any = await DoctorService.getById(doctor.id);
        setViewing(fullDoctor);
        // Update doctor in list with serviceTier if available
        setAllDoctors(prev => prev.map(d => 
          d.id === doctor.id ? { ...d, serviceTier: fullDoctor.serviceTier || d.serviceTier } : d
        ));
      } else {
        const fullDoctor = await DoctorRegistrationFormService.getDetails(doctor.id);
        setViewing(fullDoctor);
      }
    } catch (error) {
      console.error("Failed to load doctor details:", error);
      showToast('Không thể tải chi tiết bác sĩ', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReview = async (doctor: any) => {
    setLoadingDetails(true);
    try {
      const fullDoctor = await DoctorRegistrationFormService.getDetails(doctor.id);
      setReviewing(fullDoctor);
    } catch (error) {
      console.error("Failed to load doctor details:", error);
      showToast('Không thể tải chi tiết bác sĩ', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReviewSubmit = async (approved: boolean, data: any) => {
    try {
      showToast(approved ? 'Đang duyệt hồ sơ...' : 'Đang từ chối hồ sơ...', 'info');
      await DoctorRegistrationFormService.reviewProfile(data, reviewing.id);
      showToast(approved ? 'Đã duyệt hồ sơ thành công!' : 'Đã từ chối hồ sơ', 'success');
      setReviewing(null);
      await load();
    } catch (error: any) {
      console.error('Review failed:', error);
      const message = error?.response?.data?.message || error?.message || 'Không thể xử lý hồ sơ';
      showToast(message, 'error');
    }
  };

  const processedItems = useMemo(() => {
    const currentList = activeTab === 'all' ? allDoctors : pendingDoctors;
    const from = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const to = filters.dateTo ? (() => {
      const date = new Date(filters.dateTo);
      date.setHours(23, 59, 59, 999);
      return date;
    })() : undefined;

    const filtered = currentList.filter(d => {
      const searchTerm = filters.search.toLowerCase();
      const okSearch = !searchTerm ||
        (d.fullName && d.fullName.toLowerCase().includes(searchTerm)) ||
        (d.email && d.email.toLowerCase().includes(searchTerm)) ||
        (d.specialization && d.specialization.toLowerCase().includes(searchTerm));

      const okSpec = filters.specializationFilter === 'all' || d.specialization === filters.specializationFilter;
      
      const okStatus = activeTab === 'pending' || filters.statusFilter === 'all' || 
        (filters.statusFilter === 'active' ? d.statusCode === 1 : d.statusCode !== 1);

      let okDate = true;
      if (from || to) {
        const created = d.createdAt ? new Date(d.createdAt) : undefined;
        okDate = !!created && (!from || created >= from) && (!to || created <= to);
      }

      // Rating filter
      let okRating = true;
      if (filters.minRating !== undefined || filters.maxRating !== undefined) {
        const rating = d.rating || 0;
        okRating = (!filters.minRating || rating >= filters.minRating) &&
                   (!filters.maxRating || rating <= filters.maxRating);
      }

      // Experience filter
      let okExperience = true;
      if (filters.minExperience !== undefined || filters.maxExperience !== undefined) {
        const exp = d.yearsOfExperience || 0;
        okExperience = (!filters.minExperience || exp >= filters.minExperience) &&
                       (!filters.maxExperience || exp <= filters.maxExperience);
      }

      return okSearch && okSpec && okStatus && okDate && okRating && okExperience;
    });

    const sorted = [...filtered].sort((a, b) => {
      let valA: any, valB: any;
      
      if (filters.sortBy === 'createdAt') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (filters.sortBy === 'fullName') {
        valA = (a.fullName || '').toLowerCase();
        valB = (b.fullName || '').toLowerCase();
      } else if (filters.sortBy === 'email') {
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
      } else if (filters.sortBy === 'specialization') {
        valA = (a.specialization || '').toLowerCase();
        valB = (b.specialization || '').toLowerCase();
      } else if (filters.sortBy === 'education') {
        valA = (a.education || '').toLowerCase();
        valB = (b.education || '').toLowerCase();
      } else if (filters.sortBy === 'rating') {
        valA = a.rating || 0;
        valB = b.rating || 0;
      }

      if (valA < valB) return filters.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const startIndex = (filters.page - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    
    return sorted.slice(startIndex, endIndex);
  }, [allDoctors, pendingDoctors, filters, activeTab]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      ...filters,
      specializationFilter: 'all',
      statusFilter: 'all',
      dateFrom: '',
      dateTo: '',
      minRating: undefined,
      maxRating: undefined,
      minExperience: undefined,
      maxExperience: undefined,
    });
  }, [filters]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const currentList = activeTab === 'all' ? allDoctors : pendingDoctors;
    const headers = activeTab === 'all' 
      ? ['STT', 'Tên', 'Email', 'Chuyên khoa', 'Kinh nghiệm', 'Đánh giá', 'Số đánh giá', 'Trạng thái', 'Ngày tạo']
      : ['STT', 'Tên', 'Email', 'Chuyên khoa', 'Ngày đăng ký'];
    
    const rows = currentList.map((d, index) => {
      if (activeTab === 'all') {
        return [
          index + 1,
          d.fullName || '',
          d.email || '',
          d.specialization || '',
          `${d.yearsOfExperience || 0} năm`,
          (d.rating || 0).toFixed(1),
          d.reviewCount || 0,
          d.statusCode === 1 ? 'Hoạt động' : 'Ngừng hoạt động',
          new Date(d.createdAt).toLocaleDateString('vi-VN')
        ];
      } else {
        return [
          index + 1,
          d.fullName || '',
          d.email || '',
          d.specialization || '',
          new Date(d.createdAt).toLocaleDateString('vi-VN')
        ];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `danh-sach-bac-si-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Đã xuất file CSV thành công', 'success');
  }, [activeTab, allDoctors, pendingDoctors, showToast]);

  // Calculate stats with real data
  const stats = useMemo(() => {
    const totalDoctors = allDoctors.length;
    const activeDoctors = allDoctors.filter(d => d.statusCode === 1).length;
    const inactiveDoctors = totalDoctors - activeDoctors;
    const pendingCount = pendingDoctors.length;
    
    // Calculate average rating
    const doctorsWithRating = allDoctors.filter(d => d.rating && d.rating > 0);
    const avgRating = doctorsWithRating.length > 0
      ? doctorsWithRating.reduce((sum, d) => sum + (d.rating || 0), 0) / doctorsWithRating.length
      : 0;
    
    // Calculate total reviews
    const totalReviews = allDoctors.reduce((sum, d) => sum + (d.reviewCount || 0), 0);
    
    // Calculate average experience
    const doctorsWithExp = allDoctors.filter(d => d.yearsOfExperience && d.yearsOfExperience > 0);
    const avgExperience = doctorsWithExp.length > 0
      ? doctorsWithExp.reduce((sum, d) => sum + (d.yearsOfExperience || 0), 0) / doctorsWithExp.length
      : 0;
    
    // Top specialty
    const specCounts: Record<string, number> = allDoctors.reduce((acc, d) => {
      if (d.specialization) {
        acc[d.specialization] = (acc[d.specialization] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const entries = Object.entries(specCounts) as [string, number][];
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const topSpecialty = sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : { name: 'N/A', count: 0 };
    
    // Calculate percentage changes (simplified - in real app, compare with previous period)
    const activePercentage = totalDoctors > 0 ? ((activeDoctors / totalDoctors) * 100).toFixed(1) : '0';
    
    return {
      totalDoctors,
      activeDoctors,
      inactiveDoctors,
      pendingCount,
      avgRating: avgRating.toFixed(1),
      totalReviews,
      avgExperience: avgExperience.toFixed(1),
      topSpecialty,
      activePercentage
    };
  }, [allDoctors, pendingDoctors]);

  const currentList = activeTab === 'all' ? allDoctors : pendingDoctors;
  const totalPages = Math.ceil(currentList.length / filters.pageSize);

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const getEducationLabel = (educationCode?: string): string => {
    if (!educationCode) return 'Chưa có';
    
    // Try to find matching degree description
    const degree = degrees.find((d: any) => d.code === educationCode);
    if (degree) {
      return degree.description;
    }
    
    // If not found, return the code as is (might be already a description)
    return educationCode;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Bác sĩ</h1>
          <p className={styles.subtitle}>Quản lý và theo dõi tất cả bác sĩ trong hệ thống</p>
        </div>
        <div className={styles.headerActions}>
          {lastRefreshTime && (
            <p className={styles.lastUpdate} style={{ fontSize: '0.85rem', color: '#666' }}>
              Cập nhật lần cuối: {lastRefreshTime.toLocaleTimeString('vi-VN')}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <i className="bi bi-people-fill"></i>
          Tất cả bác sĩ
          <span className={styles.tabBadge}>{stats.totalDoctors}</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <i className="bi bi-clock-history"></i>
          Chờ phê duyệt
          {stats.pendingCount > 0 && <span className={styles.tabBadgeAlert}>{stats.pendingCount}</span>}
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-people-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng bác sĩ</div>
            <div className={styles.statValue}>{stats.totalDoctors}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-graph-up"></i>
              <span>{stats.activePercentage}% đang hoạt động</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-people-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-person-check-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{stats.activeDoctors}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-star-fill"></i>
              <span>Đánh giá TB: {stats.avgRating}/5.0</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-person-check-fill"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-clock-history"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Chờ phê duyệt</div>
            <div className={styles.statValue}>{stats.pendingCount}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-exclamation-circle"></i>
              <span>{stats.pendingCount > 0 ? 'Cần xử lý ngay' : 'Không có'}</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-clock-history"></i>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <i className="bi bi-award-fill"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Chuyên khoa hàng đầu</div>
            <div className={styles.statValue} style={{ fontSize: '1.2rem' }}>{stats.topSpecialty.name}</div>
            <div className={styles.statTrend}>
              <i className="bi bi-briefcase"></i>
              <span>{stats.topSpecialty.count} bác sĩ • {stats.avgExperience} năm TB</span>
            </div>
          </div>
          <div className={styles.statBg}>
            <i className="bi bi-award-fill"></i>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc chuyên khoa..."
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
          {(filters.specializationFilter !== 'all' || filters.statusFilter !== 'all' || filters.dateFrom || filters.dateTo || 
            filters.minRating !== undefined || filters.maxRating !== undefined || 
            filters.minExperience !== undefined || filters.maxExperience !== undefined) && (
            <span className={styles.filterBadge}></span>
          )}
        </button>
        <button 
          onClick={handleExportCSV}
          className={styles.btnExport}
          disabled={processedItems.length === 0}
          title="Xuất danh sách ra file CSV"
        >
          <i className="bi bi-download"></i>
          Xuất CSV
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>
                <i className="bi bi-hospital"></i>
                Chuyên khoa
              </label>
              <select value={filters.specializationFilter} onChange={e => handleFilterChange('specializationFilter', e.target.value)}>
                <option value="all">Tất cả chuyên khoa</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {activeTab === 'all' && (
              <>
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
                    <i className="bi bi-star"></i>
                    Đánh giá từ
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max="5" 
                    step="0.1"
                    placeholder="0.0"
                    value={filters.minRating || ''} 
                    onChange={e => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)} 
                  />
                </div>
                <div className={styles.filterItem}>
                  <label>
                    <i className="bi bi-star-fill"></i>
                    Đánh giá đến
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max="5" 
                    step="0.1"
                    placeholder="5.0"
                    value={filters.maxRating || ''} 
                    onChange={e => handleFilterChange('maxRating', e.target.value ? Number(e.target.value) : undefined)} 
                  />
                </div>
                <div className={styles.filterItem}>
                  <label>
                    <i className="bi bi-calendar3"></i>
                    Kinh nghiệm từ (năm)
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="0"
                    value={filters.minExperience || ''} 
                    onChange={e => handleFilterChange('minExperience', e.target.value ? Number(e.target.value) : undefined)} 
                  />
                </div>
                <div className={styles.filterItem}>
                  <label>
                    <i className="bi bi-calendar3-range"></i>
                    Kinh nghiệm đến (năm)
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="100"
                    value={filters.maxExperience || ''} 
                    onChange={e => handleFilterChange('maxExperience', e.target.value ? Number(e.target.value) : undefined)} 
                  />
                </div>
              </>
            )}

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
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>STT</th>
                  <th style={{ width: '80px' }}>Ảnh</th>
                  <th onClick={() => handleSort('fullName')} className={styles.sortable}>
                    Họ và tên
                    {filters.sortBy === 'fullName' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('email')} className={styles.sortable}>
                    Email
                    {filters.sortBy === 'email' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('specialization')} className={styles.sortable}>
                    Chuyên khoa
                    {filters.sortBy === 'specialization' && (
                      <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  {activeTab === 'all' && (
                    <>
                      <th onClick={() => handleSort('education')} className={styles.sortable}>
                        Học vị
                        {filters.sortBy === 'education' && (
                          <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                        )}
                      </th>
                      <th onClick={() => handleSort('rating')} className={styles.sortable}>
                        Đánh giá
                        {filters.sortBy === 'rating' && (
                          <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                        )}
                      </th>
                      <th>Gói dịch vụ</th>
                      <th>Trạng thái</th>
                    </>
                  )}
                  {activeTab === 'pending' && (
                    <th onClick={() => handleSort('createdAt')} className={styles.sortable}>
                      Ngày đăng ký
                      {filters.sortBy === 'createdAt' && (
                        <i className={`bi bi-arrow-${filters.sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                      )}
                    </th>
                  )}
                  <th style={{ textAlign: 'right', width: activeTab === 'pending' ? '120px' : '150px' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedItems.map((doctor, index) => (
                  <tr key={doctor.id} className={styles.tableRow}>
                    <td className={styles.indexCell}>
                      {(filters.page - 1) * filters.pageSize + index + 1}
                    </td>
                    <td>
                      <img 
                        src={doctor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=667eea&color=fff`}
                        alt={doctor.fullName}
                        className={styles.avatar}
                      />
                    </td>
                    <td>
                      <span className={styles.doctorName}>{doctor.fullName}</span>
                    </td>
                    <td className={styles.emailCell}>{doctor.email}</td>
                    <td>
                      <span className={styles.specialtyBadge}>{doctor.specialization}</span>
                    </td>
                    {activeTab === 'all' && (
                      <>
                        <td>
                          <span className={styles.educationBadge}>
                            {getEducationLabel(doctor.education)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.ratingCell}>
                            <span className={styles.ratingStars}>{getRatingStars(doctor.rating || 0)}</span>
                            <span className={styles.ratingValue}>{(doctor.rating || 0).toFixed(1)}</span>
                            <span className={styles.reviewCount}>({doctor.reviewCount || 0})</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.serviceTierBadge}>
                            {doctor.serviceTier || 'Chưa có'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${doctor.statusCode === 1 ? styles.statusActive : styles.statusInactive}`}>
                            <i className={`bi bi-${doctor.statusCode === 1 ? 'check-circle-fill' : 'x-circle-fill'}`}></i>
                            {doctor.statusCode === 1 ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === 'pending' && (
                      <td>{new Date(doctor.createdAt).toLocaleDateString('vi-VN')}</td>
                    )}
                    <td>
                      <div className={styles.actions}>
                        <button 
                          onClick={() => handleViewDetails(doctor)} 
                          title="Xem chi tiết" 
                          className={styles.actionBtn}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {activeTab === 'pending' && (
                          <button 
                            onClick={() => handleReview(doctor)} 
                            title="Phê duyệt" 
                            className={`${styles.actionBtn} ${styles.actionReview}`}
                          >
                            <i className="bi bi-clipboard-check"></i>
                          </button>
                        )}
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
            <p>Không tìm thấy bác sĩ nào</p>
          </div>
        )}

        {/* Pagination */}
        {processedItems.length > 0 && (
          <div className={styles.pagination}>
            <div className={styles.paginationInfo}>
              Hiển thị {(filters.page - 1) * filters.pageSize + 1} - {Math.min(filters.page * filters.pageSize, currentList.length)} trong tổng số {currentList.length} kết quả
            </div>

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

      {/* Modals */}
      {viewing && (
        <DoctorDetails 
          doctor={viewing} 
          onClose={() => setViewing(null)} 
          isLoading={loadingDetails}
          isPending={activeTab === 'pending'}
        />
      )}

      {reviewing && (
        <DoctorReviewModal
          doctor={reviewing}
          degrees={degrees}
          onClose={() => setReviewing(null)}
          onSubmit={handleReviewSubmit}
          isLoading={loadingDetails}
        />
      )}
    </div>
  );
}