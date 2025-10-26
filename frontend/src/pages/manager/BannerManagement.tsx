import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bannerService } from '../../services/bannerService'
import { BannerDTO } from '../../types/banner.types'
import BannerDetails from './BannerDetails'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/BannerList.module.css'

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

export default function BannerManagement() {
  const SESSION_STORAGE_KEY = 'bannerListState';

  const getInitialState = () => {
    try {
      const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse saved state for banners:", error);
    }
    return {
      banners: [],
      loading: true,
      searchTerm: '',
      sortField: 'createdAt',
      sortDirection: 'desc' as 'asc' | 'desc',
      currentPage: 1,
      itemsPerPage: 10,
      selectedBanner: null,
      showDetails: false,
      showLockConfirm: false,
      bannerToLock: null,
      showImagePopup: false,
      selectedImageUrl: '',
      selectedImageTitle: ''
    };
  };

  const [state, setState] = useState(getInitialState);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state for banners:", error);
    }
  }, [state]);

  // Load banners on component mount
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const banners = await bannerService.getAll();
      setState(prev => ({ ...prev, banners, loading: false }));
    } catch (error) {
      console.error('Error loading banners:', error);
      setState(prev => ({ ...prev, loading: false }));
      showToast('Không thể tải danh sách banner', 'error');
    }
  };

  const handleSearch = (searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm, currentPage: 1 }));
  };

  const handleSort = (field: string) => {
    setState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      currentPage: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setState(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  };

  const handleViewDetails = (banner: BannerDTO) => {
    setState(prev => ({ ...prev, selectedBanner: banner, showDetails: true }));
  };

  const handleCloseDetails = () => {
    setState(prev => ({ ...prev, showDetails: false, selectedBanner: null }));
  };

  const handleEdit = (banner: BannerDTO) => {
    navigate(`/manager/banners/edit/${banner.id}`);
  };

  const handleLock = (banner: BannerDTO) => {
    setState(prev => ({ ...prev, showLockConfirm: true, bannerToLock: banner }));
  };

  const confirmLock = async () => {
    if (!state.bannerToLock) return;

    try {
      if (state.bannerToLock.isLocked) {
        await bannerService.unlock(state.bannerToLock.id);
        showToast('Mở khóa banner thành công!', 'success');
      } else {
        await bannerService.lock(state.bannerToLock.id);
        showToast('Khóa banner thành công!', 'success');
      }
      await loadBanners();
    } catch (error) {
      console.error('Error locking/unlocking banner:', error);
      showToast('Không thể thay đổi trạng thái banner', 'error');
    } finally {
      setState(prev => ({ ...prev, showLockConfirm: false, bannerToLock: null }));
    }
  };

  const cancelLock = () => {
    setState(prev => ({ ...prev, showLockConfirm: false, bannerToLock: null }));
  };

  const handleImageClick = (imageUrl: string, imageTitle: string) => {
    setState(prev => ({ 
      ...prev, 
      showImagePopup: true, 
      selectedImageUrl: imageUrl, 
      selectedImageTitle: imageTitle 
    }));
  };

  const closeImagePopup = () => {
    setState(prev => ({ 
      ...prev, 
      showImagePopup: false, 
      selectedImageUrl: '', 
      selectedImageTitle: '' 
    }));
  };

  const handleCreateNew = () => {
    navigate('/manager/banners/new');
  };

  // Filter and sort banners
  const filteredAndSortedBanners = useMemo(() => {
    let filtered = state.banners.filter(banner =>
      banner.bannerTitle.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (banner.bannerUrl && banner.bannerUrl.toLowerCase().includes(state.searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aValue: any = a[state.sortField as keyof BannerDTO];
      let bValue: any = b[state.sortField as keyof BannerDTO];

      if (state.sortField === 'createdAt' || state.sortField === 'startDate' || state.sortField === 'endDate') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (aValue < bValue) return state.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [state.banners, state.searchTerm, state.sortField, state.sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBanners.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const paginatedBanners = filteredAndSortedBanners.slice(startIndex, startIndex + state.itemsPerPage);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean, isLocked: boolean) => {
    if (isLocked) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusLocked}`}>
          Đã khóa
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
        {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
      </span>
    );
  };

  if (state.loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải danh sách banner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Banner</h1>
          <p className={styles.subtitle}>Quản lý và theo dõi các banner quảng cáo</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.createButton} onClick={handleCreateNew}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tạo Banner mới
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
              placeholder="Tìm kiếm theo tiêu đề hoặc đường dẫn..."
              value={state.searchTerm}
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21,15 16,10 5,21"></polyline>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số Banner</div>
            <div className={styles.statValue}>{state.banners.length}</div>
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
            <div className={styles.statValue}>{state.banners.filter(b => b.isActive).length}</div>
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
            <div className={styles.statValue}>{state.banners.filter(b => !b.isActive).length}</div>
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
            <div className={styles.statValue}>{filteredAndSortedBanners.length}</div>
          </div>
        </div>
      </div>

      {/* Banners Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Danh sách Banner</h3>
          <div className={styles.tableActions}>
            <span className={styles.resultsCount}>
              Hiển thị {startIndex + 1}-{Math.min(startIndex + state.itemsPerPage, filteredAndSortedBanners.length)} trong tổng số {filteredAndSortedBanners.length} banner
            </span>
          </div>
        </div>

        {paginatedBanners.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
              </svg>
            </div>
            <h3>Không tìm thấy banner nào</h3>
            <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo banner mới</p>
            <button className={styles.createButton} onClick={handleCreateNew}>
              Tạo Banner đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.sortable} onClick={() => handleSort('bannerTitle')}>
                      Tiêu đề
                      <SortIcon direction={state.sortField === 'bannerTitle' ? state.sortDirection : undefined} />
                    </th>
                    <th>Ảnh</th>
                    <th className={styles.sortable} onClick={() => handleSort('bannerUrl')}>
                      Đường dẫn
                      <SortIcon direction={state.sortField === 'bannerUrl' ? state.sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('displayOrder')}>
                      Thứ tự
                      <SortIcon direction={state.sortField === 'displayOrder' ? state.sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('isActive')}>
                      Trạng thái
                      <SortIcon direction={state.sortField === 'isActive' ? state.sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('startDate')}>
                      Ngày bắt đầu
                      <SortIcon direction={state.sortField === 'startDate' ? state.sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('endDate')}>
                      Ngày kết thúc
                      <SortIcon direction={state.sortField === 'endDate' ? state.sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('createdAt')}>
                      Ngày tạo
                      <SortIcon direction={state.sortField === 'createdAt' ? state.sortDirection : undefined} />
                    </th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBanners.map((banner) => (
                    <tr key={banner.id}>
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
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.noImage}>Không có ảnh</div>
                        )}
                      </td>
                      <td>
                        <div className={styles.linkCell}>
                          {banner.bannerUrl ? (
                            <a href={banner.bannerUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                              {banner.bannerUrl.length > 30 ? `${banner.bannerUrl.substring(0, 30)}...` : banner.bannerUrl}
                            </a>
                          ) : (
                            <span className={styles.noLink}>Không có</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={styles.orderBadge}>{banner.displayOrder || 'N/A'}</span>
                      </td>
                      <td>{getStatusBadge(banner.isActive, banner.isLocked)}</td>
                      <td>{formatDate(banner.startDate)}</td>
                      <td>{formatDate(banner.endDate)}</td>
                      <td>{formatDate(banner.createdAt)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleViewDetails(banner)}
                            title="Xem chi tiết"
                          >
                            <ViewIcon />
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleEdit(banner)}
                            title="Chỉnh sửa"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={`${styles.actionButton} ${banner.isLocked ? styles.unlockButton : styles.lockButton}`}
                            onClick={() => handleLock(banner)}
                            title={banner.isLocked ? "Mở khóa" : "Khóa"}
                          >
                            {banner.isLocked ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <circle cx="12" cy="16" r="1"></circle>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                              </svg>
                            )}
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
                    value={state.itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className={styles.pageSizeSelect}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>banner mỗi trang</span>
                </div>

                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(state.currentPage - 1)}
                    disabled={state.currentPage === 1}
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= state.currentPage - 2 && page <= state.currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          className={`${styles.paginationButton} ${page === state.currentPage ? styles.active : ''}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === state.currentPage - 3 || page === state.currentPage + 3) {
                      return <span key={page} className={styles.paginationEllipsis}>...</span>;
                    }
                    return null;
                  })}

                  <button
                    className={styles.paginationButton}
                    onClick={() => handlePageChange(state.currentPage + 1)}
                    disabled={state.currentPage === totalPages}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Banner Details Modal */}
      {state.showDetails && state.selectedBanner && (
        <BannerDetails banner={state.selectedBanner} onClose={handleCloseDetails} />
      )}

      {/* Lock Confirmation Modal */}
      {state.showLockConfirm && state.bannerToLock && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{state.bannerToLock.isLocked ? 'Mở khóa banner' : 'Khóa banner'}</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn {state.bannerToLock.isLocked ? 'mở khóa' : 'khóa'} banner <strong>"{state.bannerToLock.bannerTitle}"</strong>?</p>
              <p className={styles.warningText}>
                {state.bannerToLock.isLocked 
                  ? 'Banner sẽ hiển thị lại trên trang chủ và trang bài viết.' 
                  : 'Banner sẽ không hiển thị trên trang chủ và trang bài viết.'
                }
              </p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={cancelLock}>
                Hủy
              </button>
              <button className={state.bannerToLock.isLocked ? styles.unlockButton : styles.lockButton} onClick={confirmLock}>
                {state.bannerToLock.isLocked ? 'Mở khóa' : 'Khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Popup Modal */}
      {state.showImagePopup && (
        <div className={styles.imageModalOverlay} onClick={closeImagePopup}>
          <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.imageModalHeader}>
              <h3>{state.selectedImageTitle}</h3>
              <button className={styles.closeButton} onClick={closeImagePopup}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.imageModalBody}>
              <img src={state.selectedImageUrl} alt={state.selectedImageTitle} className={styles.popupImage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
