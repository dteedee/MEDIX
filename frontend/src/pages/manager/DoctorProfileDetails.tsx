import { useEffect, useState } from 'react';
import styles from '../../styles/doctor-profile-details.module.css'
import { DoctorRegisterProfileDetails } from '../../types/doctor.types';
import DoctorProfileService from '../../services/doctorProfileService';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLoader } from '../../components/ui';
import { DoctorDegree } from '../../types/education.types';
import doctorDegreeService from '../../services/doctorDegreeService';
import React from 'react';
import Swal from 'sweetalert2';

function DoctorProfileDetails() {
    const [pageLoading, setPageLoading] = useState(true);
    const [statusCode, setStatusCode] = useState<number | null>(null);
    const [errors, setErrors] = useState<any>();
    const [tabIndex, setTabIndex] = useState<number>(0);

    const [formData, setFormData] = useState({
        rejectReason: "",
        education: ""
    });

    const [profile, setProfile] = useState<DoctorRegisterProfileDetails>();
    const [degrees, setDegrees] = useState<DoctorDegree[]>();

    const { id } = useParams();
    const navigate = useNavigate();

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

    const fetchProfile = async () => {
        try {
            if (!id) {
                setStatusCode(400);
                return;
            }
            const data = await DoctorProfileService.getDetails(id);
            setProfile(data);
        } catch (error: any) {
            const status = error?.response?.status ?? 500;
            setStatusCode(status);
        }
    }

    const fetchDoctorDegress = async () => {
        try {
            const data = await doctorDegreeService.getAll();
            setDegrees(data);
        } catch (error) {
            setStatusCode(500);
        }
    }

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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        validateField(name, value);
    };

    // Render tab contents as plain JSX values (avoid defining inner component types which get a new
    // function identity every render and cause React to remount children like the textarea).
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
                <button className='btn btn-success' onClick={() => handleSubmit(true)}>Duyệt hồ sơ</button>
            </div>
        </>
    );

    const rejectTabContent = (
        <>
            <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>Lí do từ chối <span className={styles["required"]}>*</span></label>
                <textarea className={styles["form-input"]} style={{ border: '1px solid black' }} name='rejectReason'
                    onChange={handleChange} value={formData.rejectReason} />
                {errors?.rejectError && (
                    <div className="text-danger">{errors.rejectError}</div>
                )}
            </div>
            <button className='btn btn-danger' onClick={() => handleSubmit(false)}>Từ chối hồ sơ</button>
        </>
    );

    const tabContents = [acceptTabContent, rejectTabContent];

    const handleSubmit = async (approved: boolean) => {
        try {
            const payload = {
                isApproved: approved,
                education: approved ? formData.education : undefined,
                rejectionReason: !approved ? formData.rejectReason : undefined
            };
            if (!id) {
                console.error("Doctor ID is missing");
                return;
            }

            setPageLoading(true);
            await DoctorProfileService.reviewProfile(payload, id);
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


    useEffect(() => {
        fetchDoctorDegress();
        fetchProfile();
        setPageLoading(false);
    }, []);

    if (pageLoading) return <PageLoader />;

    if (statusCode) {
        navigate(`/error/${statusCode}`);
        return null;
    }

    return (
        <div>
            <main className={styles["main-container"]}>
                <div className={styles["form-container"]}>
                    <form id="registrationForm">
                        {/* Row 1 */}
                        <div>
                            <div className={styles["form-row"]}>
                                {/* Left Column: Personal Info & Login */}
                                <div className={styles["form-section"]}>
                                    <h2 className={styles["section-title"]}>Phần 1: Thông tin cá nhân &amp; đăng nhập</h2>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Họ và tên</label>
                                        <input
                                            disabled
                                            type="text"
                                            className={`${styles["form-input"]}`}
                                            name="fullName"
                                            placeholder="Nguyễn Văn A"
                                            value={profile?.fullName} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Tên đăng nhập</label>
                                        <input type="text" disabled
                                            className={`${styles["form-input"]}`}
                                            placeholder="drhao" name='userName'
                                            value={profile?.userName} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Ngày sinh</label>
                                        <input type="text" disabled
                                            className={`${styles["form-input"]}`} name='dob'
                                            value={profile?.dob} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Giới tính</label>
                                        <input
                                            type="text"
                                            disabled
                                            className={styles["form-input"]}
                                            name="gender"
                                            value={getGenderLabel(profile?.gender)} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Số CCCD</label>
                                        <input type="text" disabled
                                            className={`${styles["form-input"]}`}
                                            placeholder="Nhập số căn cước công dân 12 số"
                                            name='identificationNumber'
                                            value={profile?.identificationNumber} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Email</label>
                                        <input type="text" name='email' disabled
                                            className={`${styles["form-input"]}`}
                                            placeholder="Email@example.com"
                                            value={profile?.email} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Số điện thoại</label>
                                        <input type="text" name='phoneNumber' disabled
                                            className={`${styles["form-input"]}`}
                                            placeholder="09xxxxxxxx"
                                            value={profile?.phoneNumber} />
                                    </div>
                                </div>
                                {/* Right Column: Medical Info & Emergency Contact */}
                                <div className={styles["form-section"]}>
                                    <h2 className={styles["section-title"]}>Phần 2: Thông tin bác sĩ</h2>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Chuyên khoa</label>
                                        <input type="text" name='specialization' disabled
                                            className={`${styles["form-input"]}`}
                                            placeholder="09xxxxxxxx"
                                            value={profile?.specialization} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label htmlFor="licenseImage" className={styles["form-label"]}>
                                            Chứng chỉ làm việc
                                        </label>

                                        <div className="d-flex align-items-center gap-2">
                                            <a
                                                href={profile?.licenseUrl}
                                                className={`btn btn-outline-primary`}
                                                download>
                                                Tải file
                                            </a>
                                        </div>
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Số chứng chỉ</label>
                                        <input type="text" name='licenseNumber' disabled
                                            className={`${styles["form-input"]}`} />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Tiểu sử</label>
                                        <textarea className={styles["form-input"]} name='bio' value={profile?.bio} disabled />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Trình độ học vấn</label>
                                        <textarea className={styles["form-input"]} name='education' value={profile?.education} disabled />
                                    </div>
                                    <div className={styles["form-group"]}>
                                        <label className={styles["form-label"]}>Số năm kinh nghiệm</label>
                                        <input type="number"
                                            className={`${styles["form-input"]}`}
                                            name='yearsOfExperience'
                                            disabled
                                            value={profile?.yearsOfExperience} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className={`${styles["submit-section"]} mb-3`}>
                        <button className='btn btn-success mr-2' onClick={() => setTabIndex(0)}>Chấp nhận hồ sơ</button>
                        <button className='btn btn-danger' onClick={() => setTabIndex(1)}>Từ chối hồ sơ</button>
                    </div>
                    {tabContents[tabIndex]}
                </div>
            </main>
        </div>
    )
}

export default DoctorProfileDetails;