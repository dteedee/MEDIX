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
            const data = await medicalRecordService.getMedicalRecordsOfPatient(query);
            setList(data);

            // Update pagination state
        } catch (error: any) {
            if (error.response?.status === 404) {
                setListError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
            } else {
                setListError('Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.');
            }
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
            filename: 'page.pdf',
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
            <div ref={contentRef} className={styles["container"]}>
                <h1 className="page-title mb-3">Hồ sơ Y tế</h1>
                {basicInfoError ? (
                    <div className={styles.errorMessage}>
                        <i className="bi bi-exclamation-triangle"></i>
                        {basicInfoError}
                    </div>
                ) : (
                    <>
                        <div className={styles["profile-section"]}>
                            <img className={styles["profile-image"]} src={basicInfo?.avatarUrl} />
                            <div className={styles["profile-info"]}>
                                <div className={styles["info-column"]}>
                                    <h3>Thông tin cá nhân</h3>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Họ và tên:</span> <span className={styles["info-value"]}>{basicInfo?.fullName}</span>
                                    </div>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Số CCCD/CMND:</span> <span className={styles["info-value"]}>{basicInfo?.identificationNumber}</span>
                                    </div>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Địa chỉ liên lạc:</span> <span className={styles["info-value"]}>{basicInfo?.address}</span>
                                    </div>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Email:</span> <span className={styles["info-value"]}>{basicInfo?.email}</span>
                                    </div>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Số điện thoại:</span> <span className={styles["info-value"]}>{basicInfo?.phoneNumber}</span>
                                    </div>
                                    <h3 style={{ marginTop: '30px' }}>Người liên hệ khẩn cấp</h3>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Họ tên người liên hệ:</span> <span className={styles["info-value"]}>{basicInfo?.emergencyContactName}</span>
                                    </div>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Số điện thoại liên hệ:</span> <span className={styles["info-value"]}>{basicInfo?.emergencyContactPhone}</span>
                                    </div>
                                </div>
                                <div className={styles["info-column"]}>
                                    <h3>Thông tin Y tế &amp; EMR</h3>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Ngày sinh:</span> <span className={styles["info-value"]}>{basicInfo?.dob}</span>
                                    </div>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Giới tính:</span> <span className={styles["info-value"]}>{getGenderLabel(basicInfo?.genderCode)}</span>
                                    </div>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Nhóm máu:</span> <span className={styles["info-value"]}>Nhóm máu {basicInfo?.bloodTypeCode}</span>
                                    </div>
                                    <h3 style={{ marginTop: '30px' }}>Phần 4: Tiền sử bệnh lý</h3>
                                    <div className={styles["info-item"]}>
                                        <span className={styles["info-label"]}>Dị ứng:</span> <span className={styles["info-value"]}>{basicInfo?.allergies}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {!basicInfoError && !listError && (
                            <div className={`${styles["breadcrumb"]} pdf-exclude`}>
                                <button className={styles["pdf-btn"]} onClick={handleDownload}>
                                    📄 Xuất PDF
                                </button>
                            </div>
                        )}
                    </>
                )
                }

                {/* Medical History */}
                <div className={styles["history-section"]}>
                    <h2 className={styles["section-title"]}>Lịch sử khám</h2>
                    <div className={`${styles["filter-section"]} pdf-exclude`}>
                        <div className={styles["date-filter"]}>
                            <div className={styles["date-input-group"]}>
                                <label htmlFor="dateFrom">Từ ngày:</label>
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
                            <div className={styles["date-input-group"]}>
                                <label htmlFor="dateTo">Đến ngày:</label>
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
                            <div className={styles["button-group"]}>
                                <button
                                    className={styles["filter-button"]}
                                    onClick={handleSubmitDateRange}
                                >
                                    Tìm kiếm
                                </button>
                                <button
                                    className={styles["clear-button"]}
                                    onClick={handleClearDateRange}
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                        {dateRangeError && (
                            <div className={styles.errorMessage}>
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
                    ) : (
                        <div className={styles["timeline"]}>
                            {list.map((item) => (
                                <div
                                    key={item.id}
                                    className={styles["timeline-item"]}>
                                    <div className={styles["timeline-dot"]} />
                                    <div className={styles["timeline-date"]}>{item.date}</div>
                                    <div className={styles["record-detail"]}>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Bác sĩ phụ trách:</span>
                                            <span className={styles["record-value"]}>{item.doctor}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Lý do khám &amp; Triệu chứng:</span>
                                            <span className={styles["record-value"]}>{item.chiefComplaint}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Chẩn đoán:</span>
                                            <span className={styles["record-value"]}>{item.diagnosis}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Kế hoạch điều trị:</span>
                                            <span className={styles["record-value"]}>{item.treatmentPlan}</span>
                                        </div>
                                        <div className={`${styles["record-row"]} pdf-exclude`}>
                                            <span className={styles["record-label"]}>Kết quả cận lâm sàng:</span>
                                            <div className={styles["attachment-links"]}>
                                                {item.attatchments.map((attatchment) => (
                                                    <a key={attatchment.id} href={attatchment.fileUrl} className={styles["attachment-link"]}
                                                        rel="noopener noreferrer" target="_blank">📄 {attatchment.fileName}</a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button className={`${styles["view-emr-link"]} pdf-exclude`} onClick={() => handleShowDetails(item.id)}>Xem EMR chi tiết</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div >

            {showDetails && (
                <>
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <div className={styles.modalHeader}>
                                <h3>Chi tiết hồ sơ khám bệnh</h3>
                                <button onClick={handleCloseDetails} className={styles.closeButton}>&times;</button>
                            </div>
                            <div className={styles.modalBody}>
                                {!recordDetails && detailsError ? (
                                    <div className={styles.errorMessage}>
                                        <i className="bi bi-exclamation-triangle"></i>
                                        {detailsError}
                                    </div>
                                ) : (
                                    <div className={styles["record-detail"]}>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Ngày khám:</span>
                                            <span className={styles["record-value"]}>{recordDetails?.date}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Bác sĩ phụ trách:</span>
                                            <span className={styles["record-value"]}>{recordDetails?.doctor}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Lý do khám &amp; Triệu chứng:</span>
                                            <span className={styles["record-value"]}>{recordDetails?.chiefComplaint}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Chẩn đoán:</span>
                                            <span className={styles["record-value"]}>{recordDetails?.diagnosis}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Kế hoạch điều trị:</span>
                                            <span className={styles["record-value"]}>{recordDetails?.treatmentPlan}</span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Đơn thuốc:</span>
                                            <span className={styles["record-value"]}>
                                                {recordDetails?.prescription.map((medication) => (
                                                    <div key={medication.id}>
                                                        {medication.medicationName} - {medication.instructions}
                                                    </div>
                                                ))}
                                            </span>
                                        </div>
                                        <div className={styles["record-row"]}>
                                            <span className={styles["record-label"]}>Kết quả cận lâm sàng:</span>
                                            <div className={styles["attachment-links"]}>
                                                {recordDetails?.attatchments.map((attatchment) => (
                                                    <a key={attatchment.id} href={attatchment.fileUrl} className={styles["attachment-link"]}
                                                        rel="noopener noreferrer" target="_blank">📄 {attatchment.fileName}</a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </>
    )
}
