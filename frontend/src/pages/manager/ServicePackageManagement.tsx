import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Calendar, Eye, FilePenLine, Search, RefreshCw, Box, ChevronsUpDown, ArrowUp, ArrowDown, X, CheckCircle, AlertCircle, Package, BadgeDollarSign, BarChart3 } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/ServicePackageManagement.module.css'
import { servicePackageService } from '../../services/servicePackageService'
import { DoctorServiceTier, DoctorServiceTierUpdateRequest } from '../../types/doctor-service-tier.types'

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
    !direction ? <ChevronsUpDown size={14} style={{ marginLeft: 4, opacity: 0.5 }} /> :
    direction === 'asc' ? <ArrowUp size={14} style={{ marginLeft: 4 }} /> :
    <ArrowDown size={14} style={{ marginLeft: 4 }} />
);

type ServiceTier = DoctorServiceTier;
type SortableFields = 'name' | 'monthlyPrice' | 'consultationFeeMultiplier' | 'maxDailyAppointments';

const MAX_FETCH_LIMIT = 50;
const DESCRIPTION_CHAR_LIMIT = 500;

export default function ServicePackageManagement() {
  const [packages, setPackages] = useState<ServiceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortableFields>('monthlyPrice');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewPackage, setViewPackage] = useState<ServiceTier | null>(null);
  const [editPackage, setEditPackage] = useState<ServiceTier | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<DoctorServiceTierUpdateRequest>({ description: '', monthlyPrice: 0 });
  const [formErrors, setFormErrors] = useState<{ description?: string; monthlyPrice?: string }>({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await servicePackageService.getAllTiers();
      setPackages(data);
    } catch (error) {
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? 'Không thể tải danh sách gói dịch vụ.'
          : 'Không thể tải danh sách gói dịch vụ.';
      setFetchError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleSort = (field: SortableFields) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1);
  };

  const handleViewDetails = async (pkg: ServiceTier) => {
    setDetailLoading(true);
    try {
      const latest = await servicePackageService.getTierById(pkg.serviceTierId);
      setViewPackage(latest);
      setShowDetails(true);
    } catch (error) {
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? 'Không thể tải chi tiết gói dịch vụ.'
          : 'Không thể tải chi tiết gói dịch vụ.';
      showToast(message, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setViewPackage(null);
  };

  const handleOpenEdit = async (pkg: ServiceTier) => {
    setDetailLoading(true);
    try {
      const latest = await servicePackageService.getTierById(pkg.serviceTierId);
      setEditPackage(latest);
      setEditForm({ description: latest.description, monthlyPrice: latest.monthlyPrice });
      setFormErrors({});
      setShowEditModal(true);
    } catch (error) {
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? 'Không thể tải thông tin gói dịch vụ.'
          : 'Không thể tải thông tin gói dịch vụ.';
      showToast(message, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditPackage(null);
    setEditForm({ description: '', monthlyPrice: 0 });
    setFormErrors({});
  };

  const handleEditChange = (field: keyof DoctorServiceTierUpdateRequest, value: string) => {
    if (field === 'description') {
      const truncated = value.slice(0, DESCRIPTION_CHAR_LIMIT);
      setEditForm((prev: DoctorServiceTierUpdateRequest) => ({ ...prev, description: truncated }));
      if (formErrors.description) {
        setFormErrors((prev: any) => ({ ...prev, description: undefined }));
      }
      return;
    }

    if (field === 'monthlyPrice') {
      const sanitized = value.replace(/[^0-9]/g, '');
      setEditForm((prev: DoctorServiceTierUpdateRequest) => ({ ...prev, monthlyPrice: sanitized ? Number(sanitized) : 0 }));
      if (formErrors.monthlyPrice) {
        setFormErrors((prev: any) => ({ ...prev, monthlyPrice: undefined }));
      }
      return;
    }
  };

  const validateEditForm = () => {
    const errors: { description?: string; monthlyPrice?: string } = {};
    if (!editForm.description.trim()) {
      errors.description = 'Mô tả không được bỏ trống';
    }
    if (editForm.monthlyPrice < 0) {
      errors.monthlyPrice = 'Phí hàng tháng phải là số không âm.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBasicInfo = async () => {
    if (!editPackage) return;
    if (!validateEditForm()) return;

    setSaving(true);
    try {
      await servicePackageService.updateTier(editPackage.serviceTierId, {
        description: editForm.description.trim(),
        monthlyPrice: editForm.monthlyPrice,
      });

      showToast('Cập nhật gói dịch vụ thành công', 'success');
      await loadPackages(); 
      handleCloseEdit();
    } catch (error) {
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? 'Không thể cập nhật gói dịch vụ.'
          : 'Không thể cập nhật gói dịch vụ.';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    !!editPackage &&
    (editForm.description.trim() !== editPackage.description || editForm.monthlyPrice !== editPackage.monthlyPrice);

  const filteredAndSortedPackages = useMemo(() => {
    // We use `packages` here for stats calculation, not the filtered list
    // to show overall system stats.
    return packages;
  }, [packages]);

  const stats = useMemo(() => ({
    total: packages.length,
    free: packages.filter(p => p.monthlyPrice === 0).length,
    averagePrice: packages.length > 0 ? packages.reduce((acc, p) => acc + p.monthlyPrice, 0) / packages.length : 0,
  }), [packages]);

  const paginatedAndFilteredPackages = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const filtered = packages.filter(pkg => {
      if (!keyword) return true;
      const source = [
        pkg.name,
        pkg.description,
        pkg.monthlyPrice.toString(),
      ]
        .join(' ')
        .toLowerCase();
      return source.includes(keyword);
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [packages, searchTerm, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(paginatedAndFilteredPackages.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPackages = paginatedAndFilteredPackages.slice(startIndex, startIndex + itemsPerPage);
  const resultCount = paginatedAndFilteredPackages.length;
  const startRange = resultCount ? startIndex + 1 : 0;
  const endRange = resultCount ? Math.min(startIndex + itemsPerPage, resultCount) : 0;

  const handleRefresh = () => {
    loadPackages();
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatCurrencyCompact = (value: number): string => {
    if (value === 0) return 'Miễn phí';
    const amount = value || 0;
    const abs = Math.abs(amount);

    if (abs >= 1_000_000_000) {
      const compact = amount / 1_000_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}B VND`;
    }

    if (abs >= 1_000_000) {
      const compact = amount / 1_000_000;
      const text = compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1);
      return `${text}M VND`;
    }

    return `${amount.toLocaleString('vi-VN')} VND`;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
        <span className={styles.statusDot}></span>
        {isActive ? 'Hoạt động' : 'Không hoạt động'}
      </span>
    );
  };

  const renderFeaturesPreview = (pkg: ServiceTier) => {
    if (!pkg.featuresList?.length) {
      return <span className={styles.emptyFeature}>Chưa cấu hình</span>;
    }
    let features = [];
    try {
      features = JSON.parse(pkg.features);
    } catch (e) {
      return <span className={styles.emptyFeature}>Lỗi định dạng</span>;
    }

    if (!Array.isArray(features) || features.length === 0) return <span className={styles.emptyFeature}>Chưa cấu hình</span>;
    const preview = features.slice(0, 2);
    const remaining = features.length - preview.length;

    return (
      <div className={styles.featurePills}>
        {preview.map((feature, index) => (
          <span key={`${pkg.id}-feature-${index}`} className={styles.featurePill}>
            {feature}
          </span>
        ))}
        {remaining > 0 && <span className={styles.moreFeature}>+{remaining}</span>}
      </div>
    );
  };

  const getDescriptionPreview = (pkg: ServiceTier) => {
    const description = pkg.description.trim();
    if (!description) return 'Chưa có mô tả';
    return description.length > 50 ? `${description.substring(0, 50)}...` : description;
  };

  const renderErrorState = () => (
    <div className={styles.errorState}>
      <div className={styles.emptyIcon}>
        <AlertCircle size={48} strokeWidth={1.5} />
      </div>
      <h3>Không thể tải dữ liệu</h3>
      <p>{fetchError}</p>
      <button className={styles.refreshButton} onClick={handleRefresh}>
        Thử lại
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải danh sách gói dịch vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>              
              <Box size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className={styles.title}>Gói Dịch Vụ Bác Sĩ</h1>
              <p className={styles.subtitle}>Danh sách gói đang cung cấp trong hệ thống</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateTime}>
            <div className={styles.dateIconWrapper}>
              <Calendar size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.dateContent}>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <div className={styles.dateGlow}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
          <div className={styles.statCardContent}>
            <div className={`${styles.statIcon} ${styles.statCardPrimary}`}>
              <Package size={28} />
            </div>
            <div className={styles.statValue}>
              <div className={styles.statNumber}>{stats.total}</div>
              <div className={styles.statLabel}>Tổng số gói</div>
            </div>
          </div>
          <div className={styles.statDescription}>
            <ArrowUp size={14} className={styles.statTrendUp} />
            Trong hệ thống
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <div className={styles.statCardContent}>
            <div className={`${styles.statIcon} ${styles.statCardSuccess}`}>
              <BadgeDollarSign size={28} />
            </div>
            <div className={styles.statValue}>
              <div className={styles.statNumber}>{stats.free}</div>
              <div className={styles.statLabel}>Gói miễn phí</div>
            </div>
          </div>
          <div className={styles.statDescription}>
            <ArrowUp size={14} className={styles.statTrendUp} />
            Đang hoạt động
          </div>
        </div>
      </div>

      <div className={styles.actionsBar}>
        <div className={styles.searchInput}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mô tả..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>        
        <button className={styles.refreshButton} onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinnerIcon : ''} />
          Làm mới
        </button>
      </div>

      <div className={styles.tableCard}>

        {fetchError && renderErrorState()}
        {!fetchError && paginatedPackages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Box size={48} strokeWidth={1.5} />
            </div>
            <h3>Không tìm thấy gói dịch vụ nào</h3>
            <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc làm mới dữ liệu</p>
            <button className={styles.refreshButton} onClick={handleRefresh}>
              Làm mới danh sách
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th className={styles.sortable} onClick={() => handleSort('name')}>
                      Tên gói
                      <SortIcon direction={sortField === 'name' ? sortDirection : undefined} />
                    </th>
                    <th>Mô tả</th>
                    <th className={styles.sortable} onClick={() => handleSort('monthlyPrice')}>
                      Phí hàng tháng
                      <SortIcon direction={sortField === 'monthlyPrice' ? sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('consultationFeeMultiplier')}>
                      Hệ số phí khám
                      <SortIcon direction={sortField === 'consultationFeeMultiplier' ? sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('maxDailyAppointments')}>
                      Lịch hẹn tối đa/ngày
                      <SortIcon direction={sortField === 'maxDailyAppointments' ? sortDirection : undefined} />
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPackages.map((pkg: ServiceTier, index: number) => {
                    const rowNumber = startIndex + index + 1;
                    return (
                    <tr key={pkg.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.indexCell}>{rowNumber}</div>
                      </td>
                      <td>
                        <div className={styles.nameCell}>
                          <span className={styles.nameText}>{pkg.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.descriptionCell}>
                          <span className={styles.descriptionText} title={pkg.description}>
                            {getDescriptionPreview(pkg)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.priceText}>{formatCurrencyCompact(pkg.monthlyPrice)}</span>
                      </td>
                      <td>
                        <span className={styles.multiplierBadge}>x{pkg.consultationFeeMultiplier}</span>
                      </td>
                      <td>
                        <span className={styles.appointmentBadge}>{pkg.maxDailyAppointments}</span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={`${styles.actionButton} ${styles.viewButton}`}
                            onClick={() => handleViewDetails(pkg)}
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.editButton}`}
                            onClick={() => handleOpenEdit(pkg)}
                            title="Chỉnh sửa tên & giá"
                          >
                            <FilePenLine size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <div className={styles.resultsSummary}>
                Hiển thị {startRange}-{endRange} trong tổng số {resultCount} gói
              </div>

              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className={styles.pageSizeSelect}
                  >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                  </select>
                </div>

                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    «
                  </button>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  <span className={styles.paginationStatus}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </button>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Package Details Modal */}
      {showDetails && viewPackage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết Gói Dịch vụ</h3>
              <button onClick={handleCloseDetails} className={styles.closeButton}><X size={24} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.packageDetails}>
                <div className={styles.packageHeader}>
                  <h4>{viewPackage.name}</h4>                  
                </div>
                <div className={styles.packageInfo}>
                  <p><strong>Mô tả:</strong> {viewPackage.description || 'Chưa có mô tả'}</p>
                  <p><strong>Phí hàng tháng:</strong> {formatCurrencyCompact(viewPackage.monthlyPrice)}</p>
                  <p><strong>Hệ số phí khám:</strong> x{viewPackage.consultationFeeMultiplier}</p>
                  <p><strong>Lịch hẹn tối đa/ngày:</strong> {viewPackage.maxDailyAppointments}</p>
                </div>
                <div className={styles.featuresSection}>
                  <h5>Tính năng:</h5>
                  <ul className={styles.featuresList}>
                    {viewPackage.featuresList?.length === 0 && (
                      <li className={styles.featureItemMuted}>Chưa cấu hình tính năng</li>
                    )}
                    {JSON.parse(viewPackage.features).map((feature: string, index: number) => (
                      <li key={index} className={styles.featureItem}>
                        <CheckCircle size={16} className={styles.featureIcon} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCloseDetails}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editPackage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Chỉnh sửa gói dịch vụ</h3>
              <button onClick={handleCloseEdit} className={styles.closeButton}><X size={24} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.packageDetails}>
                <div className={styles.packageHeader}>
                  <h4>{editPackage.name}</h4>                  
                </div>
                <div className={styles.packageInfo}>
                  <label className={styles.editField}>
                    <span>Mô tả</span>
                    <textarea
                      rows={4}
                      maxLength={DESCRIPTION_CHAR_LIMIT}
                      value={editForm.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      className={formErrors.description ? styles.inputError : ''}
                    />
                    <span className={styles.charCount}>
                      {editForm.description.length}/{DESCRIPTION_CHAR_LIMIT}
                    </span>
                    {formErrors.description && <span className={styles.errorText}>{formErrors.description}</span>}
                  </label>
                  <label className={styles.editField}>
                    <span>Phí hàng tháng (VND)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"                      
                      value={editForm.monthlyPrice ? editForm.monthlyPrice.toString() : ''}
                      onChange={(e) => handleEditChange('monthlyPrice', e.target.value)}
                      className={formErrors.monthlyPrice ? styles.inputError : ''}
                    />
                    {formErrors.monthlyPrice && <span className={styles.errorText}>{formErrors.monthlyPrice}</span>}
                  </label>
                </div>
              </div>
              {detailLoading && (
                <div className={styles.modalLoading}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCloseEdit}>
                Hủy
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSaveBasicInfo}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
