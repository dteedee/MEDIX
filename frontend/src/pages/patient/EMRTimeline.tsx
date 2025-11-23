import { useEffect, useState, useRef } from 'react'
import styles from '../../styles/patient/emrTimeline.module.css'
import { LoadingSpinner } from '../../components/ui';
import PatientService from '../../services/patientService';
import { BasicEMRInfo } from '../../types/patient.types';
import { MedicalRecordDetail, MedicalRecordDto, MedicalRecordQuery } from '../../types/medicalRecord.types';
import { medicalRecordService } from '../../services/medicalRecordService';
import { useAuth } from '../../contexts/AuthContext';
import html2pdf from 'html2pdf.js';

export default function EMRTimeline() {
    const { user } = useAuth();
    const [pageLoading, setPageLoading] = useState(true);
    const [basicInfoError, setBasicInfoError] = useState<string | null>(null);
    const [listError, setListError] = useState<string | null>(null);
    const [avatarUpdateKey, setAvatarUpdateKey] = useState(0);

    const [showDetails, setshowDetails] = useState(false);
    const [recordDetails, setRecordDetails] = useState<MedicalRecordDetail | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const [basicInfo, setBasicInfo] = useState<BasicEMRInfo | null>(null);
    const [list, setList] = useState<MedicalRecordDto[]>([]);
    const [filteredList, setFilteredList] = useState<MedicalRecordDto[]>([]);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [dateRangeError, setDateRangeError] = useState<string | null>(null);
    const [isFiltering, setIsFiltering] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'doctor'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
    const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const recordContentRef = useRef<HTMLDivElement>(null);

    const handleClearDateRange = () => {
        setDateFrom('');
        setDateTo('');
        setDateRangeError(null);
        const query: MedicalRecordQuery = {
            dateFrom: null,
            dateTo: null
        };
        fetchMedicalRecordList(query);
    };

    const getTotalRecords = () => filteredList.length;
    const getTotalAttachments = () => filteredList.reduce((sum, record) => sum + (record.attatchments?.length || 0), 0);
    const getUniqueDoctors = () => {
        const doctors = new Set(filteredList.map(record => record.doctor).filter(Boolean));
        return doctors.size;
    };

    const handleSubmitDateRange = () => {
        setDateRangeError(null);

        if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
            setDateRangeError('Ngày bắt đầu không thể sau ngày kết thúc');
            return;
        }
        const query: MedicalRecordQuery = {
            dateFrom: dateFrom || null,
            dateTo: dateTo || null
        };
        fetchMedicalRecordList(query);
    };

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

    const fetchBasicInfo = async () => {
        try {
            const data = await PatientService.getBasicEMRInfo();
            setBasicInfo(data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                setBasicInfoError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            } else {
                setBasicInfoError('Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.');
            }
        }
    }

    const fetchMedicalRecordList = async (query: MedicalRecordQuery) => {
        try {
            setIsFiltering(true);
            const data = await medicalRecordService.getMedicalRecordsOfPatient(query);
            setList(data);
            setFilteredList(data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                setListError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            } else {
                setListError('Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.');
            }
        } finally {
            setIsFiltering(false);
        }
    }

    // Get unique doctors from list
    const getUniqueDoctorsList = () => {
        const doctors = Array.from(new Set(list.map(record => record.doctor).filter(Boolean)));
        return doctors.sort();
    };

    // Filter and sort records
    useEffect(() => {
        let filtered = [...list];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(record => 
                record.doctor?.toLowerCase().includes(query) ||
                record.chiefComplaint?.toLowerCase().includes(query) ||
                record.diagnosis?.toLowerCase().includes(query) ||
                record.treatmentPlan?.toLowerCase().includes(query)
            );
        }

        // Filter by doctor
        if (selectedDoctor !== 'all') {
            filtered = filtered.filter(record => record.doctor === selectedDoctor);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortBy === 'doctor') {
                const doctorA = a.doctor || '';
                const doctorB = b.doctor || '';
                if (sortOrder === 'asc') {
                    return doctorA.localeCompare(doctorB);
                } else {
                    return doctorB.localeCompare(doctorA);
                }
            }
            return 0;
        });

        setFilteredList(filtered);
    }, [list, searchQuery, selectedDoctor, sortBy, sortOrder]);

    const handleDownloadRecord = (record: MedicalRecordDto) => {
        // Create a temporary div with record content
        const tempDiv = document.createElement('div');
        tempDiv.style.padding = '20px';
        tempDiv.style.background = 'white';
        tempDiv.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 20px;">Hồ sơ khám bệnh</h2>
            <div style="margin-bottom: 15px;">
                <strong>Ngày khám:</strong> ${record.date}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Bác sĩ phụ trách:</strong> ${record.doctor || 'N/A'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Lý do khám & Triệu chứng:</strong> ${record.chiefComplaint || 'N/A'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Chẩn đoán:</strong> ${record.diagnosis || 'N/A'}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Kế hoạch điều trị:</strong> ${record.treatmentPlan || 'N/A'}
            </div>
        `;
        document.body.appendChild(tempDiv);

        const opt = {
            margin: 0.5,
            filename: `EMR_${record.date}_${record.doctor?.replace(/\s+/g, '_') || 'record'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(tempDiv).save().then(() => {
            document.body.removeChild(tempDiv);
        });
    };

    const handlePrintRecord = (record: MedicalRecordDto) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Hồ sơ khám bệnh - ${record.date}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            h2 { text-align: center; color: #333; }
                            .info-row { margin-bottom: 15px; }
                            .label { font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <h2>Hồ sơ khám bệnh</h2>
                        <div class="info-row">
                            <span class="label">Ngày khám:</span> ${record.date}
                        </div>
                        <div class="info-row">
                            <span class="label">Bác sĩ phụ trách:</span> ${record.doctor || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Lý do khám & Triệu chứng:</span> ${record.chiefComplaint || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Chẩn đoán:</span> ${record.diagnosis || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="label">Kế hoạch điều trị:</span> ${record.treatmentPlan || 'N/A'}
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    useEffect(() => {
        const query: MedicalRecordQuery = {
            dateFrom: null,
            dateTo: null
        }
        let isMounted = true;
        setBasicInfoError(null);
        setListError(null);

        (async () => {
            if (isMounted) {
                await fetchBasicInfo();
                await fetchMedicalRecordList(query);
                if (isMounted) {
                    setPageLoading(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        }
    }, []);

    // Update avatar when user avatar changes
    useEffect(() => {
        if (user?.avatarUrl) {
            setAvatarUpdateKey(prev => prev + 1);
            // Reload basicInfo to sync avatar from backend
            const reloadBasicInfo = async () => {
                try {
                    const updatedBasicInfo = await PatientService.getBasicEMRInfo();
                    setBasicInfo(updatedBasicInfo);
                } catch (error) {
                    console.warn('Failed to reload basicInfo after avatar update:', error);
                }
            };
            reloadBasicInfo();
        }
    }, [user?.avatarUrl]);

    const fetchMedicalRecordDetail = async (id: string) => {
        try {
            const data = await medicalRecordService.getMedicalRecordDetails(id);
            setRecordDetails(data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                setDetailsError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            } else if (error.response?.status === 403) {
                setDetailsError('Bạn không có quyền truy cập nội dung này.');
            } else {
                setDetailsError('Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.');
            }
        }
    }

    const handleShowDetails = async (id: string) => {
        setDetailsError(null);
        setRecordDetails(null);
        await fetchMedicalRecordDetail(id);
        setshowDetails(true);
    }

    const handleCloseDetails = () => {
        setshowDetails(false);
        setDetailsError(null);
        setRecordDetails(null);
    }

    const handleDownload = () => {
        if (!contentRef.current) return;

        const excludedElements = contentRef.current.querySelectorAll('.pdf-exclude');
        excludedElements.forEach(el => (el as HTMLElement).style.display = 'none');

        const opt = {
            margin: 0.5,
            filename: `${basicInfo?.fullName}_EMR.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(contentRef.current).save().then(() => {
            excludedElements.forEach(el => (el as HTMLElement).style.display = '');
        });
    };

    if (pageLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <>
            <div ref={contentRef} className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.pageTitle}>
                            <i className="bi bi-file-medical-fill"></i>
                            Hồ sơ Y tế
                        </h1>
                        <p className={styles.pageSubtitle}>Quản lý và xem lịch sử khám bệnh của bạn</p>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.dateTime}>
                            <i className="bi bi-calendar3"></i>
                            <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
                
                {basicInfoError ? (
                    <div className={styles.errorMessage}>
                        <i className="bi bi-exclamation-triangle"></i>
                        {basicInfoError}
                    </div>
                ) : (
                    <>
                        <div className={styles.profileCard}>
                            <div className={styles.profileSection}>
                                <div className={styles.profileImageWrapper}>
                                    <img 
                                        key={avatarUpdateKey}
                                        className={styles.profileImage} 
                                        src={
                                            (user?.avatarUrl || basicInfo?.avatarUrl) 
                                                ? `${(user?.avatarUrl || basicInfo?.avatarUrl)}?v=${avatarUpdateKey || Date.now()}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(basicInfo?.fullName || user?.fullName || 'Patient')}&background=667eea&color=fff`
                                        }
                                        alt={basicInfo?.fullName || user?.fullName || 'Patient'}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(basicInfo?.fullName || user?.fullName || 'Patient')}&background=667eea&color=fff`;
                                        }}
                                    />
                                </div>
                                <div className={styles.profileInfo}>
                                    <div className={styles.infoColumn}>
                                        <h3>Thông tin cá nhân</h3>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Họ và tên</span>
                                            <span className={styles.infoValue}>{basicInfo?.fullName || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Số CCCD/CMND</span>
                                            <span className={styles.infoValue}>{basicInfo?.identificationNumber || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Địa chỉ liên lạc</span>
                                            <span className={styles.infoValue}>{basicInfo?.address || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Email</span>
                                            <span className={styles.infoValue}>{basicInfo?.email || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Số điện thoại</span>
                                            <span className={styles.infoValue}>{basicInfo?.phoneNumber || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.infoColumn}>
                                        <h3>Thông tin Y tế</h3>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Mã số EMR</span>
                                            <span className={styles.infoValue}>{basicInfo?.emrNumber || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Ngày sinh</span>
                                            <span className={styles.infoValue}>{basicInfo?.dob || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Giới tính</span>
                                            <span className={styles.infoValue}>{getGenderLabel(basicInfo?.genderCode) || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Nhóm máu</span>
                                            <span className={styles.infoValue}>{basicInfo?.bloodTypeCode ? `Nhóm máu ${basicInfo.bloodTypeCode}` : 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Dị ứng</span>
                                            <span className={styles.infoValue}>{basicInfo?.allergies || 'Không có'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.emergencyContactSection}>
                                <h3>Người liên hệ khẩn cấp</h3>
                                <div className={styles.emergencyContactGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Họ tên người liên hệ</span>
                                        <span className={styles.infoValue}>{basicInfo?.emergencyContactName || 'N/A'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Số điện thoại liên hệ</span>
                                        <span className={styles.infoValue}>{basicInfo?.emergencyContactPhone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {list.length > 0 && (
                                <div className={styles.medicalRecordStats}>
                                    <h3>Thống kê Hồ sơ Y tế</h3>
                                    <div className={styles.statsGrid}>
                                        <div className={styles.statItem}>
                                            <div className={styles.statIcon}>
                                                <i className="bi bi-clipboard-data"></i>
                                            </div>
                                            <div className={styles.statInfo}>
                                                <div className={styles.statValue}>{getTotalRecords()}</div>
                                                <div className={styles.statLabel}>
                                                    {searchQuery || selectedDoctor !== 'all' ? 'Kết quả tìm kiếm' : 'Tổng số lần khám'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.statItem}>
                                            <div className={styles.statIcon}>
                                                <i className="bi bi-person-badge"></i>
                                            </div>
                                            <div className={styles.statInfo}>
                                                <div className={styles.statValue}>{getUniqueDoctors()}</div>
                                                <div className={styles.statLabel}>Bác sĩ đã khám</div>
                                            </div>
                                        </div>
                                        <div className={styles.statItem}>
                                            <div className={styles.statIcon}>
                                                <i className="bi bi-file-earmark-medical"></i>
                                            </div>
                                            <div className={styles.statInfo}>
                                                <div className={styles.statValue}>{getTotalAttachments()}</div>
                                                <div className={styles.statLabel}>Tệp đính kèm</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!basicInfoError && !listError && (
                                <div className="pdf-exclude" style={{ marginTop: '24px', textAlign: 'right' }}>
                                    <button className={styles.pdfButton} onClick={handleDownload}>
                                        <i className="bi bi-file-earmark-pdf" style={{ marginRight: '8px' }}></i>
                                        Xuất PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className={styles.historyCard}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionHeaderLeft}>
                            <h2 className={styles.sectionTitle}>
                                <i className="bi bi-clock-history"></i>
                                Lịch sử khám
                            </h2>
                            <p className={styles.sectionSubtitle}>Xem chi tiết các lần khám bệnh của bạn</p>
                        </div>
                        <div className={styles.sectionHeaderRight}>
                            <div className={styles.viewModeToggle}>
                                <button
                                    className={`${styles.viewModeBtn} ${viewMode === 'timeline' ? styles.active : ''}`}
                                    onClick={() => setViewMode('timeline')}
                                    title="Xem dạng timeline"
                                >
                                    <i className="bi bi-list-ul"></i>
                                </button>
                                <button
                                    className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.active : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="Xem dạng danh sách"
                                >
                                    <i className="bi bi-grid"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Unified Filter Section */}
                    <div className={`${styles.filterCard} pdf-exclude`}>
                        <div className={styles.filterHeader}>
                            <div className={styles.filterTitle}>
                                <i className="bi bi-funnel"></i>
                                <span>Bộ lọc tìm kiếm</span>
                            </div>
                            {(searchQuery || selectedDoctor !== 'all' || dateFrom || dateTo) && (
                                <button
                                    className={styles.clearFilterButton}
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedDoctor('all');
                                        handleClearDateRange();
                                    }}
                                >
                                    <i className="bi bi-x"></i>
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                        
                        <div className={styles.searchBar} style={{ marginBottom: '16px' }}>
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo bác sĩ, chẩn đoán, triệu chứng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button
                                    className={styles.clearSearchBtn}
                                    onClick={() => setSearchQuery('')}
                                >
                                    <i className="bi bi-x"></i>
                                </button>
                            )}
                        </div>

                        <div className={styles.quickFilters} style={{ marginBottom: '16px' }}>
                            <div className={styles.quickFilterItem}>
                                <label>
                                    <i className="bi bi-funnel"></i>
                                    Bác sĩ:
                                </label>
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                    className={styles.quickFilterSelect}
                                >
                                    <option value="all">Tất cả bác sĩ</option>
                                    {getUniqueDoctorsList().map(doctor => (
                                        <option key={doctor} value={doctor}>{doctor}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.quickFilterItem}>
                                <label>
                                    <i className="bi bi-sort-down"></i>
                                    Sắp xếp:
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'date' | 'doctor')}
                                    className={styles.quickFilterSelect}
                                >
                                    <option value="date">Theo ngày</option>
                                    <option value="doctor">Theo bác sĩ</option>
                                </select>
                            </div>
                            <button
                                className={styles.sortOrderBtn}
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
                            >
                                <i className={`bi bi-sort-${sortOrder === 'asc' ? 'alpha-down' : 'alpha-up'}`}></i>
                            </button>
                        </div>

                        <div className={styles.dateFilter}>
                            <div className={styles.dateInputGroup}>
                                <label htmlFor="dateFrom">
                                    <i className="bi bi-calendar-event"></i>
                                    Từ ngày
                                </label>
                                <input
                                    type="date"
                                    id="dateFrom"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        setDateRangeError(null);
                                    }}
                                />
                            </div>
                            <div className={styles.dateInputGroup}>
                                <label htmlFor="dateTo">
                                    <i className="bi bi-calendar-check"></i>
                                    Đến ngày
                                </label>
                                <input
                                    type="date"
                                    id="dateTo"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value);
                                        setDateRangeError(null);
                                    }}
                                />
                            </div>
                            <button
                                className={styles.filterButton}
                                onClick={handleSubmitDateRange}
                                disabled={isFiltering}
                            >
                                {isFiltering ? (
                                    <>
                                        <i className="bi bi-arrow-clockwise" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }}></i>
                                        Đang tìm...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-search" style={{ marginRight: '8px' }}></i>
                                        Tìm kiếm
                                    </>
                                )}
                            </button>
                        </div>
                        {dateRangeError && (
                            <div className={styles.errorMessage} style={{ marginTop: '16px', marginBottom: '0' }}>
                                <i className="bi bi-exclamation-triangle"></i>
                                {dateRangeError}
                            </div>
                        )}
                    </div>

                    {listError ? (
                        <div className={styles.errorMessage}>
                            <i className="bi bi-exclamation-triangle"></i>
                            {listError}
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className={`bi bi-clipboard-x ${styles.emptyStateIcon}`}></i>
                            <p className={styles.emptyStateText}>
                                {searchQuery || selectedDoctor !== 'all' 
                                    ? 'Không tìm thấy kết quả phù hợp' 
                                    : 'Chưa có lịch sử khám'}
                            </p>
                        </div>
                    ) : viewMode === 'timeline' ? (
                        <div className={styles.timeline}>
                            {filteredList.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={styles.timelineItem}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className={styles.timelineConnector}>
                                        <div className={styles.timelineDot} />
                                        {index < list.length - 1 && <div className={styles.timelineLine} />}
                                    </div>
                                    <div className={styles.timelineContent}>
                                        <div className={styles.timelineDate}>
                                            <i className="bi bi-calendar3"></i>
                                            <span>{item.date}</span>
                                        </div>
                                        <div className={styles.recordCard}>
                                            <div className={styles.recordHeader}>
                                                <div className={styles.doctorInfo}>
                                                    <div className={styles.doctorIcon}>
                                                        <i className="bi bi-person-badge"></i>
                                                    </div>
                                                    <div>
                                                        <div className={styles.recordLabel}>Bác sĩ phụ trách</div>
                                                        <div className={styles.recordValue}>{item.doctor || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.recordBody}>
                                                <div className={styles.recordSection}>
                                                    <div className={styles.recordSectionHeader}>
                                                        <i className="bi bi-chat-left-text"></i>
                                                        <span>Lý do khám & Triệu chứng</span>
                                                    </div>
                                                    <div className={styles.recordSectionContent}>
                                                        {item.chiefComplaint || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className={styles.recordSection}>
                                                    <div className={styles.recordSectionHeader}>
                                                        <i className="bi bi-clipboard-check"></i>
                                                        <span>Chẩn đoán</span>
                                                    </div>
                                                    <div className={`${styles.recordSectionContent} ${styles.diagnosisContent}`}>
                                                        {item.diagnosis || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className={styles.recordSection}>
                                                    <div className={styles.recordSectionHeader}>
                                                        <i className="bi bi-file-medical"></i>
                                                        <span>Kế hoạch điều trị</span>
                                                    </div>
                                                    <div className={styles.recordSectionContent}>
                                                        {item.treatmentPlan || 'N/A'}
                                                    </div>
                                                </div>
                                                {item.attatchments && item.attatchments.length > 0 && (
                                                    <div className={`${styles.recordSection} pdf-exclude`}>
                                                        <div className={styles.recordSectionHeader}>
                                                            <i className="bi bi-paperclip"></i>
                                                            <span>Kết quả cận lâm sàng</span>
                                                        </div>
                                                        <div className={styles.attachmentLinks}>
                                                            {item.attatchments.map((attatchment) => (
                                                                <a 
                                                                    key={attatchment.id} 
                                                                    href={attatchment.fileUrl} 
                                                                    className={styles.attachmentLink}
                                                                    rel="noopener noreferrer" 
                                                                    target="_blank"
                                                                >
                                                                    <i className="bi bi-file-earmark-pdf"></i>
                                                                    {attatchment.fileName}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.recordFooter}>
                                                <div className={styles.recordActions}>
                                                    <button 
                                                        className={`${styles.viewEmrButton} pdf-exclude`} 
                                                        onClick={() => handleShowDetails(item.id)}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                        Xem chi tiết
                                                    </button>
                                                    <button 
                                                        className={`${styles.actionButton} ${styles.downloadButton} pdf-exclude`}
                                                        onClick={() => handleDownloadRecord(item)}
                                                        title="Tải xuống PDF"
                                                    >
                                                        <i className="bi bi-download"></i>
                                                    </button>
                                                    <button 
                                                        className={`${styles.actionButton} ${styles.printButton} pdf-exclude`}
                                                        onClick={() => handlePrintRecord(item)}
                                                        title="In"
                                                    >
                                                        <i className="bi bi-printer"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.listView}>
                            {filteredList.map((item, index) => (
                                <div key={item.id} className={styles.listItem} style={{ animationDelay: `${index * 0.05}s` }}>
                                    <div className={styles.listItemHeader}>
                                        <div className={styles.listItemDate}>
                                            <i className="bi bi-calendar3"></i>
                                            <span>{item.date}</span>
                                        </div>
                                        <div className={styles.listItemDoctor}>
                                            <i className="bi bi-person-badge"></i>
                                            <span>{item.doctor || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.listItemBody}>
                                        <div className={styles.listItemSection}>
                                            <span className={styles.listItemLabel}>Chẩn đoán:</span>
                                            <span className={styles.listItemValue}>{item.diagnosis || 'N/A'}</span>
                                        </div>
                                        <div className={styles.listItemSection}>
                                            <span className={styles.listItemLabel}>Triệu chứng:</span>
                                            <span className={styles.listItemValue}>{item.chiefComplaint || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.listItemFooter}>
                                        <button 
                                            className={`${styles.viewEmrButton} pdf-exclude`} 
                                            onClick={() => handleShowDetails(item.id)}
                                        >
                                            <i className="bi bi-eye"></i>
                                            Xem chi tiết
                                        </button>
                                        <div className={styles.listItemActions}>
                                            <button 
                                                className={`${styles.actionButton} ${styles.downloadButton} pdf-exclude`}
                                                onClick={() => handleDownloadRecord(item)}
                                                title="Tải xuống PDF"
                                            >
                                                <i className="bi bi-download"></i>
                                            </button>
                                            <button 
                                                className={`${styles.actionButton} ${styles.printButton} pdf-exclude`}
                                                onClick={() => handlePrintRecord(item)}
                                                title="In"
                                            >
                                                <i className="bi bi-printer"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showDetails && (
                <>
                    <div className={styles.modalOverlay} onClick={handleCloseDetails}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3>
                                    <i className="bi bi-file-medical-fill"></i>
                                    Chi tiết hồ sơ khám bệnh
                                </h3>
                                <button onClick={handleCloseDetails} className={styles.closeButton}>
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                {!recordDetails && detailsError ? (
                                    <div className={styles.errorMessage}>
                                        <i className="bi bi-exclamation-triangle"></i>
                                        {detailsError}
                                    </div>
                                ) : recordDetails ? (
                                    <div ref={recordContentRef}>
                                        <div className="pdf-exclude" style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'flex-end' }}>
                                            <button 
                                                className={styles.modalActionButton}
                                                onClick={() => {
                                                    if (!recordContentRef.current) return;
                                                    const excludedElements = recordContentRef.current.querySelectorAll('.pdf-exclude');
                                                    excludedElements.forEach(el => (el as HTMLElement).style.display = 'none');
                                                    const opt = {
                                                        margin: 0.5,
                                                        filename: `EMR_${recordDetails.date}_${recordDetails.doctor?.replace(/\s+/g, '_') || 'record'}.pdf`,
                                                        image: { type: 'jpeg', quality: 0.98 },
                                                        html2canvas: { scale: 2 },
                                                        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                                                    };
                                                    html2pdf().set(opt).from(recordContentRef.current).save().then(() => {
                                                        excludedElements.forEach(el => (el as HTMLElement).style.display = '');
                                                    });
                                                }}
                                            >
                                                <i className="bi bi-download"></i>
                                                Tải PDF
                                            </button>
                                            <button 
                                                className={styles.modalActionButton}
                                                onClick={() => {
                                                    const printWindow = window.open('', '_blank');
                                                    if (printWindow && recordDetails) {
                                                        printWindow.document.write(`
                                                            <html>
                                                                <head>
                                                                    <title>Hồ sơ khám bệnh - ${recordDetails.date}</title>
                                                                    <style>
                                                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                                                        h2 { text-align: center; color: #333; }
                                                                        .info-row { margin-bottom: 15px; }
                                                                        .label { font-weight: bold; }
                                                                    </style>
                                                                </head>
                                                                <body>
                                                                    <h2>Hồ sơ khám bệnh</h2>
                                                                    <div class="info-row"><span class="label">Ngày khám:</span> ${recordDetails.date}</div>
                                                                    <div class="info-row"><span class="label">Bác sĩ phụ trách:</span> ${recordDetails.doctor || 'N/A'}</div>
                                                                    <div class="info-row"><span class="label">Lý do khám & Triệu chứng:</span> ${recordDetails.chiefComplaint || 'N/A'}</div>
                                                                    <div class="info-row"><span class="label">Chẩn đoán:</span> ${recordDetails.diagnosis || 'N/A'}</div>
                                                                    <div class="info-row"><span class="label">Kế hoạch điều trị:</span> ${recordDetails.treatmentPlan || 'N/A'}</div>
                                                                    ${recordDetails.prescription && recordDetails.prescription.length > 0 ? `
                                                                        <div class="info-row">
                                                                            <span class="label">Đơn thuốc:</span>
                                                                            <ul>
                                                                                ${recordDetails.prescription.map(p => `<li>${p.medicationName} - ${p.instructions}</li>`).join('')}
                                                                            </ul>
                                                                        </div>
                                                                    ` : ''}
                                                                </body>
                                                            </html>
                                                        `);
                                                        printWindow.document.close();
                                                        printWindow.print();
                                                    }
                                                }}
                                            >
                                                <i className="bi bi-printer"></i>
                                                In
                                            </button>
                                        </div>
                                        <div className={styles.modalRecordCard}>
                                        <div className={styles.modalRecordHeader}>
                                            <div className={styles.modalDoctorInfo}>
                                                <div className={styles.modalDoctorIcon}>
                                                    <i className="bi bi-person-badge"></i>
                                                </div>
                                                <div>
                                                    <div className={styles.modalRecordLabel}>Bác sĩ phụ trách</div>
                                                    <div className={styles.modalRecordValue}>{recordDetails.doctor || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className={styles.modalDateInfo}>
                                                <i className="bi bi-calendar3"></i>
                                                <span>{recordDetails.date || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.modalRecordBody}>
                                            <div className={styles.recordSection}>
                                                <div className={styles.recordSectionHeader}>
                                                    <i className="bi bi-chat-left-text"></i>
                                                    <span>Lý do khám & Triệu chứng</span>
                                                </div>
                                                <div className={styles.recordSectionContent}>
                                                    {recordDetails.chiefComplaint || 'N/A'}
                                                </div>
                                            </div>
                                            <div className={styles.recordSection}>
                                                <div className={styles.recordSectionHeader}>
                                                    <i className="bi bi-clipboard-check"></i>
                                                    <span>Chẩn đoán</span>
                                                </div>
                                                <div className={`${styles.recordSectionContent} ${styles.diagnosisContent}`}>
                                                    {recordDetails.diagnosis || 'N/A'}
                                                </div>
                                            </div>
                                            <div className={styles.recordSection}>
                                                <div className={styles.recordSectionHeader}>
                                                    <i className="bi bi-file-medical"></i>
                                                    <span>Kế hoạch điều trị</span>
                                                </div>
                                                <div className={styles.recordSectionContent}>
                                                    {recordDetails.treatmentPlan || 'N/A'}
                                                </div>
                                            </div>
                                            {recordDetails.prescription && recordDetails.prescription.length > 0 && (
                                                <div className={styles.recordSection}>
                                                    <div className={styles.recordSectionHeader}>
                                                        <i className="bi bi-capsule"></i>
                                                        <span>Đơn thuốc</span>
                                                    </div>
                                                    <div className={styles.prescriptionList}>
                                                        {recordDetails.prescription.map((medication) => (
                                                            <div key={medication.id} className={styles.prescriptionItem}>
                                                                <div className={styles.prescriptionName}>
                                                                    <i className="bi bi-capsule-pill"></i>
                                                                    <strong>{medication.medicationName}</strong>
                                                                </div>
                                                                <div className={styles.prescriptionInstructions}>
                                                                    {medication.instructions}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {recordDetails.attatchments && recordDetails.attatchments.length > 0 && (
                                                <div className={styles.recordSection}>
                                                    <div className={styles.recordSectionHeader}>
                                                        <i className="bi bi-paperclip"></i>
                                                        <span>Kết quả cận lâm sàng</span>
                                                    </div>
                                                    <div className={styles.attachmentLinks}>
                                                        {recordDetails.attatchments.map((attatchment) => (
                                                            <a 
                                                                key={attatchment.id} 
                                                                href={attatchment.fileUrl} 
                                                                className={styles.attachmentLink}
                                                                rel="noopener noreferrer" 
                                                                target="_blank"
                                                            >
                                                                <i className="bi bi-file-earmark-pdf"></i>
                                                                {attatchment.fileName}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>
                                        <i className={`bi bi-hourglass-split ${styles.emptyStateIcon}`}></i>
                                        <p className={styles.emptyStateText}>Đang tải thông tin...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
