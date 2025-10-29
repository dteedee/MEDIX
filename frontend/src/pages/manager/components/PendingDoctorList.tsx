import React, { useEffect, useState } from "react";
import { DoctorQuery, DoctorRegisterFormDetails, DoctorRegisterFormList } from "../../../types/doctor.types";
import { DoctorDegree } from "../../../types/education.types";
import { useNavigate } from "react-router-dom";
import { PageLoader } from '../../../components/ui';
import DoctorDegreeService from "../../../services/doctorDegreeService";
import DoctorRegistrationFormService from "../../../services/doctorRegistrationFormService";
import styles from '../../../styles/manager/DoctorManagement.module.css'
import Swal from 'sweetalert2';
import ModalImageViewer from "../../../components/layout/ModalImageViewer";

export const PendingDoctorList: React.FC = () => {
    const [pageLoading, setPageLoading] = useState(true);
    const [profileList, setProfileList] = useState<DoctorRegisterFormList>();
    const [errorCode, setErrorCode] = useState<number | null>(null);
    const [currentProfilePage, setProfileCurrentPage] = useState(1);
    const [profileSearchTerm, setProfileSearchTerm] = useState('');
    const [profileItemsPerPage, setProfileItemsPerPage] = useState(5);
    const [errors, setErrors] = useState<any>();
    const [reviewTabIndex, setReviewTabIndex] = useState<number>(0);

    const [doctorProfileDetails, setDoctorProfileDetails] = useState<DoctorRegisterFormDetails>();
    const [showProfileDetails, setShowProfileDetails] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    const [degrees, setDegrees] = useState<DoctorDegree[]>();

    const [formData, setFormData] = useState({
        rejectReason: "",
        education: ""
    });

    const navigate = useNavigate();

    const ViewIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );

    const fetchList = async (query: DoctorQuery) => {
        try {
            const data = await DoctorRegistrationFormService.getAll(query);
            console.log('Fetched doctor profiles:', data);
            setProfileList(data);
        } catch (error: any) {
            console.error('Error fetching doctor profiles:', error);
            setErrorCode(error.response?.status || 500);
        } finally {
            setPageLoading(false);
        }
    }

    const fetchProfile = async (id: string) => {
        try {
            if (!id) {
                setErrorCode(400);
                return;
            }
            const data = await DoctorRegistrationFormService.getDetails(id);
            setDoctorProfileDetails(data);
        } catch (error: any) {
            const status = error?.response?.status ?? 500;
            setErrorCode(status);
        }
    }

    const fetchDoctorDegress = async () => {
        try {
            const data = await DoctorDegreeService.getAll();
            setDegrees(data);
        } catch (error) {
            setErrorCode(500);
        }
    }

    const getGenderLabel = (gender?: string) => {
        switch (gender) {
            case "Male":
                return "Nam";
            case "Female":
                return "Nữ";
            case "Other":
                return "Khác";
            default:
                return "";
        }
    };

    const handleViewDetails = (id: string) => {
        setShowProfileDetails(true);
        fetchProfile(id);
    }

    const handleCloseDetails = () => {
        setShowProfileDetails(false);
        setDoctorProfileDetails(undefined);
    }

    const handlePageChange = async (page: number) => {
        setProfileCurrentPage(page);
        setPageLoading(true);
        const query: DoctorQuery = {
            page: page,
            searchTerm: '',
            pageSize: profileItemsPerPage,
        };
        await fetchList(query);
        setPageLoading(false);
    };

    const handleItemsPerPageChange = async (itemsPerPage: number) => {
        setProfileItemsPerPage(itemsPerPage);
        setProfileCurrentPage(1);
        setPageLoading(true);
        const query: DoctorQuery = {
            page: 1,
            searchTerm: '',
            pageSize: itemsPerPage,
        };
        await fetchList(query);
        setPageLoading(false);
    };

    // useEffect(() => {
    //     const query: DoctorQuery = {
    //         page: 1,
    //         searchTerm: '',
    //         pageSize: profileItemsPerPage,
    //     };
    //     fetchList(query);
    //     fetchDoctorDegress();
    // }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const query: DoctorQuery = {
                page: 1,
                searchTerm: profileSearchTerm,
                pageSize: profileItemsPerPage,
            };
            setPageLoading(true);
            fetchList(query);
            fetchDoctorDegress();
            setPageLoading(false);
            setProfileCurrentPage(1); // reset to first page on new search
        }, 500); // 500ms debounce

        return () => clearTimeout(delayDebounce);
    }, [profileSearchTerm]);

    const TabContent = (
        <>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Quản lý hồ sơ bác sĩ</h1>
                    <p className={styles.subtitle}>Quản lý và duyệt hồ sơ bác sĩ</p>
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
                            value={profileSearchTerm}
                            onChange={(e) => setProfileSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {/* <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.statCard1}`}>
                        <div className={styles.statIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statLabel}>Tổng số Bác sĩ</div>
                            <div className={styles.statValue}>4</div>
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
                            <div className={styles.statValue}>4</div>
                        </div>
                    </div>
                </div> */}

            {/* Doctors Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <h3>Danh sách Bác sĩ</h3>
                </div>

                {!profileList?.doctors?.length ? (
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
                                        <th>Họ và tên</th>
                                        <th>Email</th>
                                        <th>Chuyên khoa</th>
                                        <th>Ngày đăng kí</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profileList?.doctors.map((doctor) => (
                                        <tr key={doctor.id}>
                                            <td>
                                                <div className={styles.nameCell}>
                                                    <span className={styles.nameText}>{doctor.fullName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.emailText}>{doctor.email}</span>
                                            </td>
                                            <td>
                                                <span className={styles.specialtyBadge}>{doctor.specialization}</span>
                                            </td>
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
                                    value={profileItemsPerPage}
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
                            {(profileList?.totalPages ?? 0) > 1
                                && (
                                    <div className={styles.paginationControls}>
                                        <button
                                            className={styles.paginationButton}
                                            onClick={() => handlePageChange(currentProfilePage - 1)}
                                            disabled={currentProfilePage === 1}>
                                            Trước
                                        </button>

                                        {Array.from({ length: profileList.totalPages }, (_, i) => i + 1).map((page) => {
                                            if (
                                                page === 1 ||
                                                page === profileList.totalPages ||
                                                (page >= currentProfilePage - 2 && page <= currentProfilePage + 2)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        className={`${styles.paginationButton} ${page === currentProfilePage ? styles.active : ''}`}
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (page === currentProfilePage - 3 || page === currentProfilePage + 3) {
                                                return <span key={page} className={styles.paginationEllipsis}>...</span>;
                                            }
                                            return null;
                                        })}

                                        <button
                                            className={styles.paginationButton}
                                            onClick={() => handlePageChange(currentProfilePage + 1)}
                                            disabled={currentProfilePage === profileList.totalPages}
                                        >
                                            Sau
                                        </button>
                                    </div>
                                )}
                        </div>
                    </>
                )}
            </div>
        </>
    );

    const emptyTabContent = (
        <div></div>
    );

    const acceptTabContent = (
        <>
            <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>Trình độ học vấn bác sĩ: <span className={styles["required"]}>*</span></label>
                {/* Submit Button */}
                <div className={`${styles["submit-section"]} mb-3`}>
                    {degrees?.map((degree) => (
                        <React.Fragment key={degree.code}>
                            <input
                                type="radio"
                                name="education"
                                value={degree.code}
                                className="btn-check"
                                id={`btn-check-outlined-${degree.code}`}
                                autoComplete="off"
                                checked={formData.education === degree.code}
                                onChange={(e) => {
                                    setFormData((prev) => ({ ...prev, education: e.target.value }));
                                    setErrors((prev: any) => ({ ...prev, acceptError: "" }));
                                }}
                            />
                            <label className="btn btn-outline-primary mr-2 mb-2" htmlFor={`btn-check-outlined-${degree.code}`}>{degree.description}</label>
                        </React.Fragment>
                    ))}
                    {errors?.acceptError && (
                        <div className="text-danger">{errors.acceptError}</div>
                    )}
                </div>
                <button className='btn btn-success' onClick={() => {
                    if (doctorProfileDetails) {
                        handleSubmit(true, doctorProfileDetails.id);
                    }
                }}>Duyệt hồ sơ</button>
            </div>
        </>
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        validateField(name, value);
    };

    const rejectTabContent = (
        <>
            <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>Lí do từ chối <span className={styles["required"]}>*</span></label>
                <textarea className={styles['form-input']} style={{ border: '1px solid black' }} name='rejectReason'
                    onChange={handleChange} value={formData.rejectReason} />
                {errors?.rejectError && (
                    <div className="text-danger">{errors.rejectError}</div>
                )}
            </div>
            <button className='btn btn-danger' onClick={() => {
                if (doctorProfileDetails) {
                    handleSubmit(false, doctorProfileDetails.id);
                }
            }}>Từ chối hồ sơ</button>
        </>
    );

    const reviewTabContents = [emptyTabContent, acceptTabContent, rejectTabContent];

    const handleSubmit = async (approved: boolean, id: string) => {
        try {
            const payload = {
                isApproved: approved,
                education: approved ? formData.education : undefined,
                rejectReason: !approved ? formData.rejectReason : undefined
            };
            if (!id) {
                console.error("ID is missing");
                return;
            }

            setPageLoading(true);
            await DoctorRegistrationFormService.reviewProfile(payload, id);
            setPageLoading(false);
            Swal.fire({
                title: 'Duyệt thành công!',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/app/manager/doctor-profiles';
            });
        } catch (error: any) {
            setPageLoading(false);
            console.error("Review failed", error);
            setErrors(error.response.data);
        }
    };

    const validateField = (name: string, value: string) => {
        const newErrors: Record<string, string> = {};

        switch (name) {
            case 'rejectReason':
                if (!value.trim()) {
                    newErrors.rejectError = 'Vui lòng nhập lí do từ chối';
                } else {
                    newErrors.rejectError = '';
                }
                break;
        }

        setErrors((prev: any) => ({ ...prev, ...newErrors }));
    };

    if (pageLoading) return <PageLoader />;

    if (errorCode) {
        navigate(`/error/${errorCode}`);
        return null;
    }

    return (
        <>
            {TabContent}

            {/* Doctor Details Modal */}
            {showProfileDetails && doctorProfileDetails && (
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
                                        src={doctorProfileDetails.avatarUrl}
                                        alt={doctorProfileDetails.fullName}
                                    />
                                </div>
                                <div className={styles.doctorInfo}>
                                    <h4>{doctorProfileDetails.fullName}</h4>
                                    <p><strong>Tên đăng nhập:</strong> {doctorProfileDetails.userName}</p>
                                    <p><strong>Ngày sinh:</strong> {doctorProfileDetails.dob}</p>
                                    <p><strong>Giới tính:</strong> {getGenderLabel(doctorProfileDetails.gender)}</p>
                                    <p><strong>Số CMND/CCCD:</strong> {doctorProfileDetails.identificationNumber}</p>
                                    <p><strong>Email:</strong> {doctorProfileDetails.email}</p>
                                    <p><strong>Số điện thoại:</strong> {doctorProfileDetails.phoneNumber}</p>
                                    <p><strong>Chuyên khoa:</strong> {doctorProfileDetails.specialization}</p>
                                    <p>
                                        <strong>Ảnh chứng chỉ hành nghề:</strong>
                                        <button className="btn btn-outline-primary btn-sm ml-2" onClick={() => setShowImageModal(true)}>Xem ảnh</button>
                                    </p>
                                    <p><strong>Số giấy phép hành nghề:</strong> {doctorProfileDetails.licenseNumber}</p>
                                    <p>
                                        <strong>Tệp bằng cấp:</strong>
                                        <a href={doctorProfileDetails.degreeFilesUrl} download className="btn btn-outline-primary btn-sm ml-2">Tải về</a>
                                    </p>
                                    {doctorProfileDetails.bio && <p><strong>Tiểu sử:</strong> {doctorProfileDetails.bio}</p>}
                                    {doctorProfileDetails.education && <p><strong>Học vị:</strong> {doctorProfileDetails.education}</p>}
                                    <p><strong>Kinh nghiệm:</strong> {doctorProfileDetails.yearsOfExperience} năm</p>
                                </div>
                            </div>
                            <hr />
                            <div style={{ marginTop: '20px' }}>
                                {reviewTabContents[reviewTabIndex]}
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={handleCloseDetails}>
                                Đóng
                            </button>
                            <button className={`btn ${(reviewTabIndex === 1) ? 'btn-primary' : 'btn-outline-primary'
                                }`} onClick={() => setReviewTabIndex(1)}>
                                Chấp nhận hồ sơ
                            </button>
                            <button className={`btn ${(reviewTabIndex === 2) ? 'btn-primary' : 'btn-outline-primary'
                                }`} onClick={() => setReviewTabIndex(2)}>
                                Từ chối hồ sơ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showImageModal && (
                <ModalImageViewer
                    src={doctorProfileDetails?.licenseImageUrl || ''}
                    alt={doctorProfileDetails?.fullName}
                    onClose={() => setShowImageModal(false)}
                />
            )}
        </>
    )
}