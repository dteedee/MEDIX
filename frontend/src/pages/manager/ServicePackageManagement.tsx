import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Calendar } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/ServicePackageManagement.module.css'
import { servicePackageService } from '../../services/servicePackageService'
import { DoctorServiceTier, DoctorServiceTierUpdateRequest } from '../../types/doctor-service-tier.types'
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

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: 4, color: direction ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
    {direction === 'asc' && <path d="M18 15l-6-6-6 6" />}
    {direction === 'desc' && <path d="M6 9l6 6 6-6" />}
  </svg>
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
      console.error('Failed to load service packages', error);
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
      console.error('Failed to load service package detail', error);
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
      console.error('Failed to load service package detail', error);
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
      await loadPackages(); // Tải lại toàn bộ danh sách
      handleCloseEdit();
    } catch (error) {
      console.error('Failed to update service package', error);
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

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPackages.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPackages = filteredAndSortedPackages.slice(startIndex, startIndex + itemsPerPage);
  const resultCount = filteredAndSortedPackages.length;
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
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
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
              <i className="bi bi-box-seam" style={{ fontSize: '28px' }}></i>
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

      <div className={styles.actionsBar}>
        <div className={styles.searchInput}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mô tả..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <button className={styles.refreshButton} onClick={handleRefresh} disabled={loading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10m-2.51 5a9 9 0 0 1-14.13 3.36L1 14"></path>
          </svg>
          Làm mới
        </button>
      </div>

      <div className={styles.tableCard}>

        {fetchError && renderErrorState()}
        {!fetchError && paginatedPackages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
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
                        <span className={styles.priceText}>{formatCurrency(pkg.monthlyPrice)}</span>
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
                            <ViewIcon />
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.editButton}`}
                            onClick={() => handleOpenEdit(pkg)}
                            title="Chỉnh sửa tên & giá"
                          >
                            <EditIcon />
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
              <button onClick={handleCloseDetails} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.packageDetails}>
                <div className={styles.packageHeader}>
                  <h4>{viewPackage.name}</h4>                  
                </div>
                <div className={styles.packageInfo}>
                  <p><strong>Mô tả:</strong> {viewPackage.description || 'Chưa có mô tả'}</p>
                  <p><strong>Phí hàng tháng:</strong> {formatCurrency(viewPackage.monthlyPrice)}</p>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
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
              <button onClick={handleCloseEdit} className={styles.closeButton}>&times;</button>
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
