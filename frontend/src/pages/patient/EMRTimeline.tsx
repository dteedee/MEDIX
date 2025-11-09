import { useEffect, useState, useRef } from 'react'
import styles from '../../styles/patient/emrTimeline.module.css'
import { LoadingSpinner } from '../../components/ui';
import PatientService from '../../services/patientService';
import { BasicEMRInfo } from '../../types/patient.types';
import { MedicalRecordDetail, MedicalRecordDto, MedicalRecordQuery } from '../../types/medicalRecord.types';
import { medicalRecordService } from '../../services/medicalRecordService';
import html2pdf from 'html2pdf.js';

export default function EMRTimeline() {
    const [pageLoading, setPageLoading] = useState(true);
    const [basicInfoError, setBasicInfoError] = useState<string | null>(null);
    const [listError, setListError] = useState<string | null>(null);

    const [showDetails, setshowDetails] = useState(false);
    const [recordDetails, setRecordDetails] = useState<MedicalRecordDetail | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const [basicInfo, setBasicInfo] = useState<BasicEMRInfo | null>(null);
    const [list, setList] = useState<MedicalRecordDto[]>([]);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [dateRangeError, setDateRangeError] = useState<string | null>(null);
    const [isFiltering, setIsFiltering] = useState<boolean>(false);

    const contentRef = useRef<HTMLDivElement>(null);

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

    const getTotalRecords = () => list.length;
    const getTotalAttachments = () => list.reduce((sum, record) => sum + (record.attatchments?.length || 0), 0);
    const getUniqueDoctors = () => {
        const doctors = new Set(list.map(record => record.doctor).filter(Boolean));
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
                <h1 className={styles.pageTitle}>Hồ sơ Y tế</h1>
                
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
                                        className={styles.profileImage} 
                                        src={basicInfo?.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(basicInfo?.fullName || '') + '&background=667eea&color=fff'} 
                                        alt={basicInfo?.fullName}
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
                                                <div className={styles.statLabel}>Tổng số lần khám</div>
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
                    <h2 className={styles.sectionTitle}>Lịch sử khám</h2>
                    
                    <div className={`${styles.filterCard} pdf-exclude`}>
                        <div className={styles.filterHeader}>
                            <div className={styles.filterTitle}>
                                <i className="bi bi-funnel"></i>
                                <span>Bộ lọc tìm kiếm</span>
                            </div>
                            {(dateFrom || dateTo) && (
                                <button
                                    className={styles.clearFilterButton}
                                    onClick={handleClearDateRange}
                                >
                                    <i className="bi bi-x"></i>
                                    Xóa bộ lọc
                                </button>
                            )}
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
                    ) : list.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className={`bi bi-clipboard-x ${styles.emptyStateIcon}`}></i>
                            <p className={styles.emptyStateText}>Chưa có lịch sử khám</p>
                        </div>
                    ) : (
                        <div className={styles.timeline}>
                            {list.map((item) => (
                                <div
                                    key={item.id}
                                    className={styles.timelineItem}
                                >
                                    <div className={styles.timelineDot} />
                                    <div className={styles.timelineDate}>{item.date}</div>
                                    <div className={styles.recordCard}>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Bác sĩ phụ trách</span>
                                            <span className={styles.recordValue}>{item.doctor || 'N/A'}</span>
                                        </div>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Lý do khám &amp; Triệu chứng</span>
                                            <span className={styles.recordValue}>{item.chiefComplaint || 'N/A'}</span>
                                        </div>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Chẩn đoán</span>
                                            <span className={styles.recordValue}>{item.diagnosis || 'N/A'}</span>
                                        </div>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Kế hoạch điều trị</span>
                                            <span className={styles.recordValue}>{item.treatmentPlan || 'N/A'}</span>
                                        </div>
                                        {item.attatchments && item.attatchments.length > 0 && (
                                            <div className={`${styles.recordRow} pdf-exclude`}>
                                                <span className={styles.recordLabel}>Kết quả cận lâm sàng</span>
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
                                    <button 
                                        className={`${styles.viewEmrButton} pdf-exclude`} 
                                        onClick={() => handleShowDetails(item.id)}
                                    >
                                        <i className="bi bi-eye"></i>
                                        Xem EMR chi tiết
                                    </button>
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
                                <h3>Chi tiết hồ sơ khám bệnh</h3>
                                <button onClick={handleCloseDetails} className={styles.closeButton}>
                                    <i className="bi bi-x"></i>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                {!recordDetails && detailsError ? (
                                    <div className={styles.errorMessage}>
                                        <i className="bi bi-exclamation-triangle"></i>
                                        {detailsError}
                                    </div>
                                ) : recordDetails ? (
                                    <div className={styles.recordCard}>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Ngày khám</span>
                                            <span className={styles.recordValue}>{recordDetails.date || 'N/A'}</span>
                                        </div>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Bác sĩ phụ trách</span>
                                            <span className={styles.recordValue}>{recordDetails.doctor || 'N/A'}</span>
                                        </div>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Lý do khám &amp; Triệu chứng</span>
                                            <span className={styles.recordValue}>{recordDetails.chiefComplaint || 'N/A'}</span>
                                        </div>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Chẩn đoán</span>
                                            <span className={styles.recordValue}>{recordDetails.diagnosis || 'N/A'}</span>
                                        </div>
                                        <div className={styles.recordRow}>
                                            <span className={styles.recordLabel}>Kế hoạch điều trị</span>
                                            <span className={styles.recordValue}>{recordDetails.treatmentPlan || 'N/A'}</span>
                                        </div>
                                        {recordDetails.prescription && recordDetails.prescription.length > 0 && (
                                            <div className={styles.recordRow}>
                                                <span className={styles.recordLabel}>Đơn thuốc</span>
                                                <div className={styles.recordValue}>
                                                    {recordDetails.prescription.map((medication) => (
                                                        <div key={medication.id} style={{ marginBottom: '8px', padding: '8px', background: '#f7fafc', borderRadius: '8px' }}>
                                                            <strong>{medication.medicationName}</strong> - {medication.instructions}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {recordDetails.attatchments && recordDetails.attatchments.length > 0 && (
                                            <div className={styles.recordRow}>
                                                <span className={styles.recordLabel}>Kết quả cận lâm sàng</span>
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
