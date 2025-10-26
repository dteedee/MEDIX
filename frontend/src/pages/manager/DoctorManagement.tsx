import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import styles from '../../styles/manager/DoctorManagement.module.css'

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

interface Doctor {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialty: string;
  degree: string;
  experience: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockDoctors: Doctor[] = [
      {
        id: '1',
        fullName: 'Phạm Quỳnh Anh',
        email: 'phamquynhanh@example.com',
        phoneNumber: '0123456789',
        specialty: 'Nội khoa',
        degree: 'Bác sĩ',
        experience: 2,
        rating: 4.5,
        reviewCount: 45,
        isActive: true,
        createdAt: '2024-01-15T08:00:00Z',
        avatarUrl: 'https://ui-avatars.com/api/?name=Pham+Quynh+Anh&background=667eea&color=fff'
      },
      {
        id: '2',
        fullName: 'Lê Thu Hằng',
        email: 'lethuhang@example.com',
        phoneNumber: '0987654321',
        specialty: 'Nhi khoa',
        degree: 'Thạc sĩ, Bác sĩ',
        experience: 6,
        rating: 4.8,
        reviewCount: 156,
        isActive: true,
        createdAt: '2024-01-10T10:30:00Z',
        avatarUrl: 'https://ui-avatars.com/api/?name=Le+Thu+Hang&background=48bb78&color=fff'
      },
      {
        id: '3',
        fullName: 'Nguyễn Thị Mai',
        email: 'nguyenthimai@example.com',
        phoneNumber: '0369852147',
        specialty: 'Sản phụ khoa',
        degree: 'Tiến sĩ, Bác sĩ',
        experience: 10,
        rating: 4.9,
        reviewCount: 300,
        isActive: true,
        createdAt: '2024-01-05T14:20:00Z',
        avatarUrl: 'https://ui-avatars.com/api/?name=Nguyen+Thi+Mai&background=f56565&color=fff'
      },
      {
        id: '4',
        fullName: 'Trần Văn Long',
        email: 'tranvanlong@example.com',
        phoneNumber: '0741258963',
        specialty: 'Ung bướu',
        degree: 'Giáo sư, Tiến sĩ, Bác sĩ',
        experience: 20,
        rating: 5.0,
        reviewCount: 500,
        isActive: false,
        createdAt: '2024-01-01T09:15:00Z',
        avatarUrl: 'https://ui-avatars.com/api/?name=Tran+Van+Long&background=ed8936&color=fff'
      }
    ];

    setTimeout(() => {
      setDoctors(mockDoctors);
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

  const handleViewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDoctor(null);
  };

  const handleEdit = (doctor: Doctor) => {
    navigate(`/manager/doctors/edit/${doctor.id}`);
  };

  const handleDelete = (doctor: Doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!doctorToDelete) return;

    try {
      // Mock delete - replace with actual API call
      setDoctors(prev => prev.filter(d => d.id !== doctorToDelete.id));
      showToast('Xóa bác sĩ thành công!', 'success');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      showToast('Không thể xóa bác sĩ', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setDoctorToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDoctorToDelete(null);
  };

  const handleCreateNew = () => {
    navigate('/manager/doctors/new');
  };

  // Filter and sort doctors
  const filteredAndSortedDoctors = useMemo(() => {
    let filtered = doctors.filter(doctor =>
      doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Doctor];
      let bValue: any = b[sortField as keyof Doctor];

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

    return filtered;
  }, [doctors, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDoctors = filteredAndSortedDoctors.slice(startIndex, startIndex + itemsPerPage);

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

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải danh sách bác sĩ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Quản lý Bác sĩ</h1>
          <p className={styles.subtitle}>Quản lý thông tin và trạng thái bác sĩ</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.createButton} onClick={handleCreateNew}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm Bác sĩ mới
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
              placeholder="Tìm kiếm theo tên, email hoặc chuyên khoa..."
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Tổng số Bác sĩ</div>
            <div className={styles.statValue}>{doctors.length}</div>
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
            <div className={styles.statValue}>{doctors.filter(d => d.isActive).length}</div>
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
            <div className={styles.statValue}>{doctors.filter(d => !d.isActive).length}</div>
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
            <div className={styles.statValue}>{filteredAndSortedDoctors.length}</div>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3>Danh sách Bác sĩ</h3>
          <div className={styles.tableActions}>
            <span className={styles.resultsCount}>
              Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedDoctors.length)} trong tổng số {filteredAndSortedDoctors.length} bác sĩ
            </span>
          </div>
        </div>

        {paginatedDoctors.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3>Không tìm thấy bác sĩ nào</h3>
            <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc thêm bác sĩ mới</p>
            <button className={styles.createButton} onClick={handleCreateNew}>
              Thêm Bác sĩ đầu tiên
            </button>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th className={styles.sortable} onClick={() => handleSort('fullName')}>
                      Tên bác sĩ
                      <SortIcon direction={sortField === 'fullName' ? sortDirection : undefined} />
                    </th>
                    <th className={styles.sortable} onClick={() => handleSort('email')}>
                      Email
                      <SortIcon direction={sortField === 'email' ? sortDirection : undefined} />
                    </th>
                    <th>Số điện thoại</th>
                    <th className={styles.sortable} onClick={() => handleSort('specialty')}>
                      Chuyên khoa
                      <SortIcon direction={sortField === 'specialty' ? sortDirection : undefined} />
                    </th>
                    <th>Học vị</th>
                    <th>Kinh nghiệm</th>
                    <th className={styles.sortable} onClick={() => handleSort('rating')}>
                      Đánh giá
                      <SortIcon direction={sortField === 'rating' ? sortDirection : undefined} />
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
                  {paginatedDoctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>
                        <div className={styles.avatarCell}>
                          <img 
                            src={doctor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName)}&background=667eea&color=fff`} 
                            alt={doctor.fullName} 
                            className={styles.avatar} 
                          />
                        </div>
                      </td>
                      <td>
                        <div className={styles.nameCell}>
                          <span className={styles.nameText}>{doctor.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.emailText}>{doctor.email}</span>
                      </td>
                      <td>
                        <span className={styles.phoneText}>{doctor.phoneNumber}</span>
                      </td>
                      <td>
                        <span className={styles.specialtyBadge}>{doctor.specialty}</span>
                      </td>
                      <td>
                        <span className={styles.degreeText}>{doctor.degree}</span>
                      </td>
                      <td>
                        <span className={styles.experienceText}>{doctor.experience} năm</span>
                      </td>
                      <td>
                        <div className={styles.ratingCell}>
                          <span className={styles.ratingStars}>{getRatingStars(doctor.rating)}</span>
                          <span className={styles.ratingValue}>{doctor.rating}</span>
                          <span className={styles.reviewCount}>({doctor.reviewCount})</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(doctor.isActive)}</td>
                      <td>{formatDate(doctor.createdAt)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleViewDetails(doctor)}
                            title="Xem chi tiết"
                          >
                            <ViewIcon />
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleEdit(doctor)}
                            title="Chỉnh sửa"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => handleDelete(doctor)}
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
                  <span>bác sĩ mỗi trang</span>
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

      {/* Doctor Details Modal */}
      {showDetails && selectedDoctor && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết Bác sĩ</h3>
              <button onClick={handleCloseDetails} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.doctorDetails}>
                <div className={styles.doctorAvatar}>
                  <img 
                    src={selectedDoctor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.fullName)}&background=667eea&color=fff`} 
                    alt={selectedDoctor.fullName} 
                  />
                </div>
                <div className={styles.doctorInfo}>
                  <h4>{selectedDoctor.fullName}</h4>
                  <p><strong>Email:</strong> {selectedDoctor.email}</p>
                  <p><strong>Số điện thoại:</strong> {selectedDoctor.phoneNumber}</p>
                  <p><strong>Chuyên khoa:</strong> {selectedDoctor.specialty}</p>
                  <p><strong>Học vị:</strong> {selectedDoctor.degree}</p>
                  <p><strong>Kinh nghiệm:</strong> {selectedDoctor.experience} năm</p>
                  <p><strong>Đánh giá:</strong> {getRatingStars(selectedDoctor.rating)} {selectedDoctor.rating} ({selectedDoctor.reviewCount} đánh giá)</p>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedDoctor.isActive)}</p>
                  <p><strong>Ngày tạo:</strong> {formatDate(selectedDoctor.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCloseDetails}>
                Đóng
              </button>
              <button className={styles.editButton} onClick={() => handleEdit(selectedDoctor)}>
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && doctorToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận xóa bác sĩ</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc chắn muốn xóa bác sĩ <strong>"{doctorToDelete.fullName}"</strong>?</p>
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
