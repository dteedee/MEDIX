import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/ServicePackageManagement.module.css'

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

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: 4, color: direction ? '#111827' : '#9ca3af' }}>
    {direction === 'asc' && <path d="M18 15l-6-6-6 6" />}
    {direction === 'desc' && <path d="M6 9l6 6 6-6" />}
  </svg>
);

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in months
  features: string[];
  isActive: boolean;
  maxBookings: number;
  discountPercent: number;
  createdAt: string;
  tier: 'Basic' | 'Professional' | 'Premium' | 'VIP';
}

export default function ServicePackageManagement() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<ServicePackage | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockPackages: ServicePackage[] = [
      {
        id: '1',
        name: 'Gói Basic',
        description: 'Gói khám cơ bản, phù hợp cho các nhu cầu tư vấn và khám tổng quát.',
        price: 0,
        duration: 1,
        features: ['Tư vấn trực tuyến', 'Khám tổng quát', 'Kê đơn thuốc cơ bản'],
        isActive: true,
        maxBookings: 10,
        discountPercent: 0,
        createdAt: '2024-01-15T08:00:00Z',
        tier: 'Basic'
      },
      {
        id: '2',
        name: 'Gói Professional',
        description: 'Gói khám chuyên sâu, dành cho các trường hợp cần chẩn đoán và điều trị chi tiết hơn.',
        price: 100000,
        duration: 1,
        features: ['Tư vấn chuyên sâu', 'Chẩn đoán hình ảnh', 'Xét nghiệm cơ bản', 'Hỗ trợ 24/7'],
        isActive: true,
        maxBookings: 7,
        discountPercent: 5,
        createdAt: '2024-01-10T10:30:00Z',
        tier: 'Professional'
      },
      {
        id: '3',
        name: 'Gói Premium',
        description: 'Gói cao cấp, cung cấp dịch vụ y tế toàn diện với các bác sĩ hàng đầu.',
        price: 250000,
        duration: 1,
        features: ['Bác sĩ chuyên khoa đầu ngành', 'Phẫu thuật nhỏ', 'Tư vấn dinh dưỡng', 'Ưu tiên đặt lịch'],
        isActive: true,
        maxBookings: 5,
        discountPercent: 10,
        createdAt: '2024-01-05T14:20:00Z',
        tier: 'Premium'
      },
      {
        id: '4',
        name: 'Gói VIP',
        description: 'Dịch vụ y tế đẳng cấp nhất, chăm sóc sức khỏe cá nhân hóa với đội ngũ chuyên gia.',
        price: 500000,
        duration: 1,
        features: ['Bác sĩ riêng', 'Chăm sóc tại nhà', 'Hỗ trợ y tế toàn cầu', 'Gói khám sức khỏe định kỳ'],
        isActive: false,
        maxBookings: 3,
        discountPercent: 15,
        createdAt: '2024-01-01T09:15:00Z',
        tier: 'VIP'
      }
    ];

    setTimeout(() => {
      setPackages(mockPackages);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
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

  const handleViewDetails = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedPackage(null);
  };

  const handleEdit = (pkg: ServicePackage) => {
    navigate(`/manager/services/edit/${pkg.id}`);
  };

  const handleDelete = (pkg: ServicePackage) => {
    setPackageToDelete(pkg);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;

    try {
      // Mock delete - replace with actual API call
      setPackages(prev => prev.filter(p => p.id !== packageToDelete.id));
      showToast('Xóa gói dịch vụ thành công!', 'success');
    } catch (error) {
      console.error('Error deleting package:', error);
      showToast('Không thể xóa gói dịch vụ', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setPackageToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPackageToDelete(null);
  };

  const handleCreateNew = () => {
    navigate('/manager/services/new');
  };

  // Filter and sort packages
  const filteredAndSortedPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.tier.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    let aValue: any = a[sortField as keyof ServicePackage];
    let bValue: any = b[sortField as keyof ServicePackage];

    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPackages = filteredAndSortedPackages.slice(startIndex, startIndex + itemsPerPage);

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

  const getTierBadge = (tier: string) => {
    const tierColors = {
      Basic: '#6b7280',
      Professional: '#3b82f6',
      Premium: '#8b5cf6',
      VIP: '#f59e0b'
    };
    
    return (
      <span 
        className={styles.tierBadge}
        style={{ backgroundColor: tierColors[tier as keyof typeof tierColors] }}
      >
        {tier}
      </span>
    );
  };

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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Gói Dịch vụ</h1>
          <p className={styles.subtitle}>Quản lý các gói dịch vụ y tế</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.createButton} onClick={handleCreateNew}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tạo Gói mới
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchFilterSection}>
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mô tả hoặc tier..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số Gói</div>
            <div className={styles.statValue}>{packages.length}</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Đang hoạt động</div>
            <div className={styles.statValue}>{packages.filter(p => p.isActive).length}</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard3}`}>
          <div className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Ngừng hoạt động</div>
            <div className={styles.statValue}>{packages.filter(p => !p.isActive).length}</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCard4}`}>
          <div className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Kết quả tìm kiếm</div>
            <div className={styles.statValue}>{filteredAndSortedPackages.length}</div>
          </div>
        </div>
      </div>

      {/* Packages Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Danh sách Gói Dịch vụ</h3>
          <div className={styles.tableActions}>
            <span className={styles.resultsCount}>
              Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedPackages.length)} trong tổng số {filteredAndSortedPackages.length} gói
            </span>
          </div>
        </div>

        {paginatedPackages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3>Không tìm thấy gói dịch vụ nào</h3>
            <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo gói mới</p>
            <button className={styles.createButton} onClick={handleCreateNew}>
              Tạo Gói đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.sortable} onClick={() => handleSort('name')}>
                      Tên gói
                      <SortIcon direction={sortField === 'name' ? sortDirection : undefined} />
                    </th>
                    <th>Tier</th>
                    <th>Mô tả</th>
                    <th className={styles.sortable} onClick={() => handleSort('price')}>
                      Giá
                      <SortIcon direction={sortField === 'price' ? sortDirection : undefined} />
                    </th>
                    <th>Thời hạn</th>
                    <th>Số lịch tối đa</th>
                    <th>Giảm giá</th>
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
                  {paginatedPackages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>
                        <div className={styles.nameCell}>
                          <span className={styles.nameText}>{pkg.name}</span>
                        </div>
                      </td>
                      <td>{getTierBadge(pkg.tier)}</td>
                      <td>
                        <div className={styles.descriptionCell}>
                          <span className={styles.descriptionText}>
                            {pkg.description.length > 50 
                              ? `${pkg.description.substring(0, 50)}...` 
                              : pkg.description
                            }
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.priceText}>{formatCurrency(pkg.price)}</span>
                      </td>
                      <td>
                        <span className={styles.durationText}>{pkg.duration} tháng</span>
                      </td>
                      <td>
                        <span className={styles.maxBookingsText}>{pkg.maxBookings} lịch</span>
                      </td>
                      <td>
                        <span className={styles.discountText}>
                          {pkg.discountPercent > 0 ? `${pkg.discountPercent}%` : 'Không có'}
                        </span>
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
                          <button
                            className={styles.actionButton}
                            onClick={() => handleEdit(pkg)}
                            title="Chỉnh sửa"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => handleDelete(pkg)}
                            title="Xóa"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  {getTierBadge(selectedPackage.tier)}
                </div>
                <div className={styles.packageInfo}>
                  <p><strong>Mô tả:</strong> {selectedPackage.description}</p>
                  <p><strong>Giá:</strong> {formatCurrency(selectedPackage.price)}</p>
                  <p><strong>Thời hạn:</strong> {selectedPackage.duration} tháng</p>
                  <p><strong>Số lịch tối đa:</strong> {selectedPackage.maxBookings} lịch</p>
                  <p><strong>Giảm giá:</strong> {selectedPackage.discountPercent > 0 ? `${selectedPackage.discountPercent}%` : 'Không có'}</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedPackage.isActive)}</p>
                  <p><strong>Ngày tạo:</strong> {formatDate(selectedPackage.createdAt)}</p>
                </div>
                <div className={styles.featuresSection}>
                  <h5>Tính năng:</h5>
                  <ul className={styles.featuresList}>
                    {selectedPackage.features.map((feature, index) => (
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
              <button className={styles.editButton} onClick={() => handleEdit(selectedPackage)}>
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && packageToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận xóa gói dịch vụ</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa gói dịch vụ <strong>"{packageToDelete.name}"</strong>?</p>
              <p className={styles.warningText}>Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={cancelDelete}>
                Hủy
              </button>
              <button className={styles.deleteButton} onClick={confirmDelete}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
