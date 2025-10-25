import { useEffect, useState } from 'react';
import styles from '../../styles/doctor-profile-list.module.css'
import { DoctorProfileQuery, DoctorRegisterProfileList } from '../../types/doctor.types';
import DoctorProfileService from '../../services/doctorProfileService';
import { PageLoader } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/layout/Pagination';

function DoctorProfileList() {
    const [pageLoading, setPageLoading] = useState(true);
    const [list, setList] = useState<DoctorRegisterProfileList>();
    const [errorCode, setErrorCode] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const navigate = useNavigate();

    const fetchList = async (query: DoctorProfileQuery) => {
        try {
            const data = await DoctorProfileService.getAll(query);
            setList(data);
        } catch (error : any) {
            console.error('Error fetching doctor profiles:', error);
            setErrorCode(error.response?.status || 500);
        } finally {
            setPageLoading(false);
        }
    }

    const handlePageChange = async (page: number) => {
        setCurrentPage(page);
        setPageLoading(true);
        const query: DoctorProfileQuery = {
            page: page,
            searchTerm: '',
        };
        await fetchList(query);
        setPageLoading(false);
    };

    useEffect(() => {
        const query: DoctorProfileQuery = {
            page: 1,
            searchTerm: '',
        };
        fetchList(query);
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const query: DoctorProfileQuery = {
                page: 1,
                searchTerm,
            };
            setPageLoading(true);
            fetchList(query);
            setPageLoading(false);
            setCurrentPage(1); // reset to first page on new search
        }, 500); // 500ms debounce

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);


    if (pageLoading) return <PageLoader />;

    if (errorCode) {
        navigate(`/error/${errorCode}`);
        return null;
    }

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Quản lý hồ sơ bác sĩ</h1>
            </div>

            {/* Filter Section */}
            <div className={styles.filterContainer}>
                <div className={styles.filterGrid}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Tìm kiếm</label>
                        <input
                            className={styles.filterInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm bác sĩ..." />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.th}>Họ và tên</th>
                            <th className={styles.th}>Email</th>
                            <th className={styles.th}>Chuyên khoa</th>
                            <th className={styles.th}>Ngày đăng kí</th>
                            <th className={styles.th} style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list?.doctors && list.doctors.length ?
                            (list?.doctors.map((doctor) => (
                                <tr>
                                    <td className={`${styles.td}`}>{doctor.fullName}</td>
                                    <td className={styles.td}>
                                        {doctor.email}
                                    </td>
                                    <td className={styles.td}>{doctor.specialization}</td>
                                    <td className={styles.td}>{doctor.createdAt}</td>
                                    <td className={`${styles.td} ${styles.actions}`}>
                                        <i
                                            className="bi bi-eye-fill"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`details/${doctor.id}`)}
                                        ></i>
                                    </td>
                                </tr>
                            ))) : (
                                <tr><td colSpan={6} className={`${styles.td} ${styles.center}`}>Không có kết quả nào</td></tr>
                            )
                        }
                    </tbody>
                </table>
                {/* {1 > 0 ? (
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th className={styles.th} style={{ width: '50px' }}>STT</th>
                                <th className={styles.th}>Họ và tên</th>
                                <th className={styles.th}>Email</th>
                                <th className={styles.th}>Chuyên khoa</th>
                                <th className={styles.th}>Ngày đăng kí</th>
                                <th className={styles.th} style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={`${styles.td} ${styles.center}`}>
                                    1
                                </td>
                                <td className={`${styles.td}`}>a</td>
                                <td className={styles.td}>
                                    a
                                </td>
                                <td className={styles.td}>a</td>
                                <td className={styles.td}>a</td>
                                <td className={`${styles.td} ${styles.actions}`}>
                                    a
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.noResults}>
                        Không tìm thấy kết quả
                    </div>
                )} */}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={list?.totalPages ?? 1}
                onPageChange={handlePageChange}
            />
        </div>
    )
}

export default DoctorProfileList;