import { useEffect, useState } from "react";
import { PageLoader } from "../../../components/ui";
import { DoctorList, DoctorQuery } from "../../../types/doctor.types";
import DoctorService from "../../../services/doctorService";
import { useNavigate } from "react-router-dom";
import styles from '../../../styles/manager/DoctorManagement.module.css'
import { set } from "date-fns";

const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const AllDoctorList: React.FC = () => {
    const [pageLoading, setPageLoading] = useState<boolean>(false);
    const [list, setList] = useState<DoctorList>();
    const [itemsPerPage, setItemsPerPage] = useState<number>(5);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [errorCode, setErrorCode] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [doctorDetails, setDoctorDetails] = useState<any>(null);

    const navigate = useNavigate();

    const fetchList = async (query: DoctorQuery) => {
        try {
            const data = await DoctorService.getAll(query);
            console.log('Fetched doctor profiles:', data);
            setList(data);
        } catch (error: any) {
            console.error('Error fetching doctor profiles:', error);
            setErrorCode(error.response?.status || 500);
        }
    }

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const query: DoctorQuery = {
                page: 1,
                searchTerm: searchTerm,
                pageSize: itemsPerPage,
            };
            setPageLoading(true);
            fetchList(query);
            setPageLoading(false);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    const getRatingStars = (rating: number) => {
        return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    };

    const getStatusBadge = (isActive: boolean) => {
        return (
            <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </span>
        );
    };

    const handlePageChange = async (page: number) => {
        setCurrentPage(page);
        setPageLoading(true);
        const query: DoctorQuery = {
            page: page,
            searchTerm: '',
            pageSize: itemsPerPage,
        };
        await fetchList(query);
        setPageLoading(false);
    };

    const handleItemsPerPageChange = async (itemsPerPage: number) => {
        setItemsPerPage(itemsPerPage);
        setCurrentPage(1);
        setPageLoading(true);
        const query: DoctorQuery = {
            page: 1,
            searchTerm: searchTerm,
            pageSize: itemsPerPage,
        };
        await fetchList(query);
        setPageLoading(false);
    };

    const fetchDetails = async (id: string) => {
        setDoctorDetails(null);
        try {
            if (!id) {
                return;
            }
            const data = await DoctorService.getById(id);
            setDoctorDetails(data);
        } catch (error: any) {
            console.error('Error fetching doctor details:', error);
        }
    }

    const handleViewDetails = (id: string) => {
        setShowDetails(true);
        fetchDetails(id);
    }

    const handleCloseDetails = () => {
        setShowDetails(false);
        setDoctorDetails(undefined);
    }

    if (pageLoading) return <PageLoader />;

    if (errorCode) {
        navigate(`/error/${errorCode}`);
        return null;
    }

    return (
        <>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Quản lý Bác sĩ</h1>
                    <p className={styles.subtitle}>Quản lý thông tin và trạng thái bác sĩ</p>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Doctors Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <h3>Danh sách Bác sĩ</h3>
                </div>

                {!list?.items?.length ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <h3>Không tìm thấy bác sĩ nào</h3>
                        <p>Hãy thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Ảnh</th>
                                        <th>Tên bác sĩ</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Chuyên khoa</th>
                                        <th>Học vị</th>
                                        <th>Kinh nghiệm</th>
                                        <th>Đánh giá</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list?.items.map((doctor) => (
                                        <tr key={doctor.id}>
                                            <td>
                                                <div className={styles.avatarCell}>
                                                    <img
                                                        src={doctor.avatarUrl}
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
                                                <span className={styles.specialtyBadge}>{doctor.specialization}</span>
                                            </td>
                                            <td>
                                                <span className={styles.degreeText}>{doctor.education}</span>
                                            </td>
                                            <td>
                                                <span className={styles.experienceText}>{doctor.yearsOfExperience} năm</span>
                                            </td>
                                            <td>
                                                <div className={styles.ratingCell}>
                                                    <span className={styles.ratingStars}>{getRatingStars(doctor.rating)}</span>
                                                    <span className={styles.ratingValue}>
                                                        {doctor.rating.toFixed(1)}
                                                    </span>
                                                    <span className={styles.reviewCount}>({doctor.reviewCount})</span>
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(doctor.statusCode === 1)}</td>
                                            <td>{doctor.createdAt}</td>
                                            <td>
                                                <div className={styles.actionButtons}>
                                                    <button
                                                        className={styles.actionButton}
                                                        onClick={() => handleViewDetails(doctor.id)}
                                                        title="Xem chi tiết">
                                                        <ViewIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                <span>Hiển thị</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className={styles.pageSizeSelect}>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>bác sĩ mỗi trang</span>
                            </div>
                            {/* Pagination */}
                            {(list?.totalPages ?? 0) > 1
                                && (
                                    <div className={styles.paginationControls}>
                                        <button
                                            className={styles.paginationButton}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}>
                                            Trước
                                        </button>

                                        {Array.from({ length: list.totalPages }, (_, i) => i + 1).map((page) => {
                                            if (
                                                page === 1 ||
                                                page === list.totalPages ||
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
                                            disabled={currentPage === list.totalPages}>
                                            Sau
                                        </button>
                                    </div>
                                )}
                        </div>
                    </>
                )}
            </div>

            {showDetails && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        {doctorDetails ? (
                            <>
                                <div className={styles.modalHeader}>
                                    <h3>Chi tiết Bác sĩ</h3>
                                    <button onClick={handleCloseDetails} className={styles.closeButton}>&times;</button>
                                </div>
                                <div className={styles.modalBody}>
                                    <div className={styles.doctorDetails}>
                                        <div className={styles.doctorAvatar}>
                                            <img
                                                src={doctorDetails.avatarUrl}
                                                alt={doctorDetails.fullName} />
                                        </div>
                                        <div className={styles.doctorInfo}>
                                            <h4>{doctorDetails.fullName}</h4>
                                            <p><strong>Email:</strong> {doctorDetails.email}</p>
                                            <p><strong>Số điện thoại:</strong> {doctorDetails.phoneNumber}</p>
                                            <p><strong>Chuyên khoa:</strong> {doctorDetails.specialization}</p>
                                            <p><strong>Học vị:</strong> {doctorDetails.education}</p>
                                            <p><strong>Kinh nghiệm:</strong> {doctorDetails.yearsOfExperience} năm</p>
                                            <p><strong>Đánh giá:</strong> {getRatingStars(doctorDetails.rating)} {doctorDetails.rating} ({doctorDetails.reviewCount} đánh giá)</p>
                                            <p><strong>Trạng thái:</strong> {getStatusBadge(doctorDetails.statusCode)}</p>
                                            <p><strong>Ngày tạo:</strong> {doctorDetails.createdAt}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.modalActions}>
                                    <button className={styles.cancelButton} onClick={handleCloseDetails}>
                                        Đóng
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.modalBody} style={{ textAlign: 'center' }}>
                                <span className="text-danger">Đã có lỗi xảy ra, vui lòng thử lại sau</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}