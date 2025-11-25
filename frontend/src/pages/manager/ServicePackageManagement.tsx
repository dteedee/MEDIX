import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/ServicePackageManagement.module.css'
import { servicePackageService } from '../../services/servicePackageService'
import { ServicePackageModel } from '../../types/service-package.types'

// SVG Icons for actions
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: 4, color: direction ? '#111827' : '#9ca3af' }}>
    {direction === 'asc' && <path d="M18 15l-6-6-6 6" />}
    {direction === 'desc' && <path d="M6 9l6 6 6-6" />}
  </svg>
);

type ServicePackage = ServicePackageModel;
type SortableFields = 'name' | 'monthlyFee' | 'displayOrder' | 'isActive' | 'createdAt';

const MAX_FETCH_LIMIT = 50;

export default function ServicePackageManagement() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortableFields>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { showToast } = useToast();

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await servicePackageService.getTop(MAX_FETCH_LIMIT);
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

  const handleViewDetails = async (pkg: ServicePackage) => {
    setDetailLoading(true);
    try {
      const latest = await servicePackageService.getById(pkg.id);
      setSelectedPackage(latest);
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
    setSelectedPackage(null);
  };

  const filteredAndSortedPackages = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const filtered = packages.filter(pkg => {
      if (!keyword) return true;
      const source = [
        pkg.name,
        pkg.description ?? '',
        pkg.featuresList.join(' '),
        pkg.displayOrder.toString(),
      ]
        .join(' ')
        .toLowerCase();
      return source.includes(keyword);
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'isActive') {
        aValue = a.isActive ? 1 : 0;
        bValue = b.isActive ? 1 : 0;
      } else if (typeof aValue === 'string') {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
        {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
      </span>
    );
  };

  const renderFeaturesPreview = (pkg: ServicePackage) => {
    if (!pkg.featuresList.length) {
      return <span className={styles.emptyFeature}>Chưa cấu hình</span>;
    }

    const preview = pkg.featuresList.slice(0, 2);
    const remaining = pkg.featuresList.length - preview.length;

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

  const getDescriptionPreview = (pkg: ServicePackage) => {
    const description = (pkg.description ?? '').trim();
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
          <h1 className={styles.title}>Gói dịch vụ</h1>
          <p className={styles.subtitle}>Danh sách gói đang cung cấp trong hệ thống</p>
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

      <div className={styles.listCard}>
        <div className={styles.tableHeader}>
          <h3>Danh sách Gói Dịch vụ</h3>
          <div className={styles.tableActions}>
            <span className={styles.resultsCount}>
              Hiển thị {startRange}-{endRange} trong tổng số {resultCount} gói
            </span>
          </div>
        </div>

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
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th className={styles.sortable} onClick={() => handleSort('name')}>
                      Tên gói
                      <SortIcon direction={sortField === 'name' ? sortDirection : undefined} />
                    </th>
                    <th>Mô tả</th>
                    <th className={styles.sortable} onClick={() => handleSort('monthlyFee')}>
                      Phí hàng tháng
                      <SortIcon direction={sortField === 'monthlyFee' ? sortDirection : undefined} />
                    </th>
                    <th>Tính năng chính</th>
                    <th className={styles.sortable} onClick={() => handleSort('displayOrder')}>
                      Thứ tự hiển thị
                      <SortIcon direction={sortField === 'displayOrder' ? sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('isActive')}>
                      Trạng thái
                      <SortIcon direction={sortField === 'isActive' ? sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('createdAt')}>
                      Ngày tạo
                      <SortIcon direction={sortField === 'createdAt' ? sortDirection : undefined} />
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPackages.map((pkg, index) => {
                    const rowNumber = startIndex + index + 1;
                    return (
                    <tr key={pkg.id}>
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
                          <span className={styles.descriptionText}>
                            {getDescriptionPreview(pkg)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.priceText}>{formatCurrency(pkg.monthlyFee)}</span>
                      </td>
                      <td>{renderFeaturesPreview(pkg)}</td>
                      <td>
                        <span className={styles.displayOrderText}>{pkg.displayOrder}</span>
                      </td>
                      <td>{getStatusBadge(pkg.isActive)}</td>
                      <td>{formatDate(pkg.createdAt)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleViewDetails(pkg)}
                            title="Xem chi tiết"
                          >
                            <ViewIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <div className={styles.paginationInfo}>
                  <span>Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className={styles.pageSizeSelect}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>gói mỗi trang</span>
                </div>

                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          className={`${styles.paginationButton} ${page === currentPage ? styles.active : ''}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className={styles.paginationEllipsis}>...</span>;
                    }
                    return null;
                  })}

                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Package Details Modal */}
      {showDetails && selectedPackage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết Gói Dịch vụ</h3>
              <button onClick={handleCloseDetails} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.packageDetails}>
                <div className={styles.packageHeader}>
                  <h4>{selectedPackage.name}</h4>
                  <span className={styles.orderBadge}>Display #{selectedPackage.displayOrder}</span>
                </div>
                <div className={styles.packageInfo}>
                  <p><strong>Mô tả:</strong> {selectedPackage.description || 'Chưa có mô tả'}</p>
                  <p><strong>Phí hàng tháng:</strong> {formatCurrency(selectedPackage.monthlyFee)}</p>
                  <p><strong>Thứ tự hiển thị:</strong> {selectedPackage.displayOrder}</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedPackage.isActive)}</p>
                  <p><strong>Ngày tạo:</strong> {formatDate(selectedPackage.createdAt)}</p>
                </div>
                <div className={styles.featuresSection}>
                  <h5>Tính năng:</h5>
                  <ul className={styles.featuresList}>
                    {selectedPackage.featuresList.length === 0 && (
                      <li className={styles.featureItemMuted}>Chưa cấu hình tính năng</li>
                    )}
                    {selectedPackage.featuresList.map((feature, index) => (
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
              {detailLoading && (
                <div className={styles.modalLoading}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCloseDetails}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
