import { useEffect, useRef, useState } from 'react';
import styles from '../../styles/doctor/doctor-edit-profile.module.css'
import DoctorService from '../../services/doctorService';
import { DoctorProfileDetails } from '../../types/doctor.types';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '../../components/ui';
import { Header } from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export default function DoctorProfileEdit() {

    const navigate = useNavigate();

    const [pageLoading, setPageLoading] = useState(true);
    const [errorCode, setErrorCode] = useState<number | null>(null);

    const [profileDetails, setProfileDetails] = useState<DoctorProfileDetails>();
    const [errors, setErrors] = useState<any>({});

    const [formData, setFormData] = useState<any>({});

    const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null);
    const [uploadMessage, setUploadMessage] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({});

    const [uploadImageLoading, setUploadImageLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updatePasswordLoading, setUpdatePasswordLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setUploadImageLoading(true);
        try {
            const response = await DoctorService.updateAvatar(formData);
            setUploadImageLoading(false);
            console.log(response);
            const newUrl = response.avatarUrl;

            setProfileDetails((prev) => ({
                ...prev!,
                avatarUrl: newUrl,
            }));

            setUploadStatus('success');
            setUploadMessage('Ảnh đã được cập nhật thành công!');
        } catch (error: unknown) {
            setUploadImageLoading(false);
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorData = error.response?.data;

                if (status === 400 && errorData?.errors?.Avatar?.[0]) {
                    setUploadStatus('error');
                    setUploadMessage(errorData.errors.Avatar[0]); // "Vui lòng chọn một tệp hình ảnh."
                } else if (status === 500) {
                    setUploadStatus('error');
                    setUploadMessage('Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.');
                } else {
                    setUploadStatus('error');
                    setUploadMessage('Không thể tải ảnh lên. Vui lòng kiểm tra kết nối hoặc thử lại.');
                }
            } else {
                setUploadStatus('error');
                setUploadMessage('Lỗi không xác định. Vui lòng thử lại.');
            }
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await DoctorService.getDoctorProfileDetails();
                setProfileDetails(data);
                console.log(data);
            } catch (error: any) {
                console.error('Failed to fetch profile details:', error);
                setErrorCode(error?.response?.status ?? 500);
            } finally {
                setPageLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        setErrors({});
        setUpdateLoading(true);
        try {
            await DoctorService.updateDoctorProfile(formData);
            setUpdateLoading(false);
            Swal.fire({
                title: 'Cập nhật thông tin thành công!',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/';
            });
        } catch (error: unknown) {
            setUpdateLoading(false);

            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorData = error.response?.data;

                switch (status) {
                    case 400:
                        // Bad Request – likely validation errors
                        if (errorData?.errors) {
                            setErrors(errorData.errors);
                        } else {
                            setErrors({ general: 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.' });
                        }
                        break;

                    case 401:
                        // Unauthorized – user needs to log in
                        setErrors({ general: 'Bạn chưa đăng nhập hoặc phiên đã hết hạn.' });
                        // Optionally redirect to login:
                        // navigate('/login');
                        break;

                    case 500:
                        // Internal Server Error
                        setErrors({ general: 'Lỗi máy chủ. Vui lòng thử lại sau.' });
                        break;

                    default:
                        // Other unexpected errors
                        setErrors({ general: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
                        console.error('Unhandled error status:', status, errorData);
                }
            } else {
                console.error('Non-Axios error:', error);
                setErrors({ general: 'Lỗi không xác định. Vui lòng thử lại.' });
            }
        }

    }

    const handlePasswordUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        setUpdatePasswordLoading(true);
        setPasswordFieldErrors({});
        try {
            await DoctorService.updatePassword(formData);
            setUpdatePasswordLoading(false);
            Swal.fire({
                title: 'Cập nhật thông tin thành công!',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/doctor/profile/edit';
            });
            console.log("Update pasword successfully");
        } catch (error: any) {
            setUpdatePasswordLoading(false);
            if (error.response?.status === 400 && Array.isArray(error.response.data)) {
                const errors: Record<string, string> = {};
                error.response.data.forEach((item: any) => {
                    const field = item.memberNames?.[0];
                    const message = item.errorMessage;
                    if (field && message) {
                        errors[field] = message;
                    }
                });
                setPasswordFieldErrors(errors);
            } else {
                // handle 500 or other errors
                setPasswordFieldErrors({ general: 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.' });
            }
        }
    }

    const validateField = (name: string, value: string) => {
        const newErrors: Record<string, string[]> = {};

        switch (name) {
            case 'fullName':
                if (!value.trim()) {
                    newErrors.FullName = ['Vui lòng nhập họ và tên'];
                } else {
                    newErrors.FullName = [''];
                }
                break;

            case 'dob':
                if (!value) {
                    newErrors.birthdate = []; // No error if left empty
                } else {
                    const birthYear = new Date(value).getFullYear();
                    const currentYear = new Date().getFullYear();
                    const age = currentYear - birthYear;

                    if (age < 25) {
                        newErrors.Dob = ['Bạn phải đủ 25 tuổi để đăng ký'];
                    } else if (age > 150) {
                        newErrors.Dob = ['Ngày sinh không hợp lệ'];
                    } else {
                        newErrors.Dob = [];
                    }
                }
                break;

            case 'phoneNumber':
                if (!value.trim()) {
                    newErrors.PhoneNumber = ['Vui lòng nhập số điện thoại'];
                } else if (!/^0\d{9}$/.test(value)) {
                    newErrors.PhoneNumber = ['Số điện thoại phải bắt đầu bằng 0 và gồm 10 chữ số'];
                } else {
                    newErrors.PhoneNumber = [];
                }
                break;

            case 'yearsOfExperience':
                const years = Number(value);
                if (!value.trim()) {
                    newErrors.YearsOfExperience = ['Vui lòng nhập số năm kinh nghiệm'];
                } else if (isNaN(years) || years < 1 || years > 50) {
                    newErrors.YearsOfExperience = ['Số năm kinh nghiệm không hợp lệ'];
                } else {
                    newErrors.YearsOfExperience = [];
                }
                break;
        }

        setErrors((prev: any) => ({ ...prev, ...newErrors }));
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const validateNumber = (input: string) => {
        // Remove any non-digit characters
        return input.replace(/[^0-9]/g, '');
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const { name, value } = e.target;
        const sanitized = validateNumber(raw);
        setFormData((prev: any) => ({ ...prev, [name]: sanitized }));
        validateField(name, sanitized);
    };

    if (pageLoading) return <PageLoader />;

    if (errorCode) {
        navigate(`/error/${errorCode}`);
        return null;
    }

    return (
        <>
            <Header />
            <div className={styles["main-container"]}>
                {/* Content */}
                <main className={styles["content"]}>
                    <div className={styles["profile-container"]}>
                        {/* Profile Avatar */}
                        <div className={styles["profile-avatar-section"]}>
                            <div className={styles["profile-avatar"]}>
                                <img className={styles["avatar-placeholder"]} src={profileDetails?.avatarUrl} />
                            </div>
                            <button className="btn btn-primary" disabled={uploadImageLoading} onClick={handleUploadClick}>
                                {uploadImageLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Tải ảnh lên'
                                )}
                            </button>
                            {uploadMessage && (
                                <div
                                    style={{
                                        marginTop: '8px',
                                        fontSize: '14px',
                                        marginBottom: '20px',
                                        color: uploadStatus === 'success' ? 'green' : 'red',
                                        textAlign: 'center',
                                    }}>
                                    {uploadMessage}
                                </div>
                            )}
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />

                        {/* Profile Form */}
                        <form className={styles["profile-form"]} onSubmit={handleSubmit}>
                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Email</label>
                                <div className={styles["form-input-group"]}>
                                    <input
                                        type="text"
                                        className={styles["form-input-disabled"]}
                                        defaultValue={profileDetails?.email}
                                        disabled />
                                </div>
                            </div>
                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Tên đăng nhập</label>
                                <div className={styles["form-input-group"]}>
                                    <input
                                        type="text"
                                        className={styles["form-input-disabled"]}
                                        defaultValue={profileDetails?.userName}
                                        disabled />
                                </div>
                            </div>
                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Họ và tên</label>
                                <div className={styles["form-input-group"]}>
                                    <input
                                        type="text"
                                        className={`${styles["form-input"]} form-control ${errors.FullName?.[0]
                                            ? 'is-invalid'
                                            : formData.fullName?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        defaultValue={profileDetails?.fullName}
                                        name="fullName" />
                                    {errors.FullName?.[0] && (
                                        <div className={styles["form-error"]}>{errors.FullName[0]}</div>
                                    )}
                                </div>
                            </div>
                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Ngày sinh</label>
                                <div className={styles["form-input-group"]}>
                                    <input type="date"
                                        className={`${styles["form-input"]} form-control ${errors.Dob?.[0]
                                            ? 'is-invalid'
                                            : formData.dob?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        defaultValue={profileDetails?.dateOfBirth} name='dob' />
                                    {errors.Dob?.[0] && (
                                        <div className={styles["form-error"]}>{errors.Dob[0]}</div>
                                    )}
                                </div>
                            </div>
                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Số điện thoại</label>
                                <div className={styles["form-input-group"]}>
                                    <input
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.length > 10) {
                                                target.value = target.value.slice(0, 10);
                                            }
                                        }}
                                        type="text"
                                        className={`${styles["form-input"]} form-control ${errors.PhoneNumber?.[0]
                                            ? 'is-invalid'
                                            : formData.phoneNumber?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleNumberChange}
                                        defaultValue={profileDetails?.phoneNumber}
                                        name='phoneNumber'
                                        value={formData.phoneNumber} />
                                    {errors.PhoneNumber?.[0] && (
                                        <div className={styles["form-error"]}>{errors.PhoneNumber[0]}</div>
                                    )}
                                </div>
                            </div>
                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Tiểu sử</label>
                                <div className={styles["form-input-group"]}>
                                    <input
                                        type="text"
                                        className={styles["form-input"]}
                                        defaultValue={profileDetails?.bio}
                                        name="bio"
                                    />
                                    {errors.Bio?.[0] && (
                                        <div className={styles["form-error"]}>{errors.Bio[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Trình độ học vấn</label>
                                <div className={styles["form-input-group"]}>
                                    <input
                                        type="text"
                                        className={styles["form-input"]}
                                        defaultValue={profileDetails?.education}
                                        name="education"
                                    />
                                    {errors.Education?.[0] && (
                                        <div className={styles["form-error"]}>{errors.Education[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className={styles["form-row"]}>
                                <label className={styles["form-label"]}>Số năm kinh nghiệm</label>
                                <div className={styles["form-input-group"]}>
                                    <input
                                        type="text"
                                        className={`${styles["form-input"]} form-control ${errors.YearsOfExperience?.[0]
                                            ? 'is-invalid'
                                            : formData.yearsOfExperience?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleNumberChange}
                                        defaultValue={profileDetails?.yearsOfExperience}
                                        value={formData.yearsOfExperience}
                                        name="yearsOfExperience"
                                    />
                                    {errors.YearsOfExperience?.[0] && (
                                        <div className={styles["form-error"]}>{errors.YearsOfExperience[0]}</div>
                                    )}
                                </div>
                            </div>

                            {errors.general && (
                                <div className={styles["form-error"]}
                                    style={{ textAlign: 'center' }}>{errors.general}</div>
                            )}
                            {/* Action Buttons */}
                            <div className={styles["action-buttons"]}>
                                <button type="button" className="btn btn-primary" data-bs-toggle="modal"
                                    data-bs-target="#changePasswordModal">Đổi mật khẩu</button>
                                <button type="submit" disabled={updateLoading} className="btn btn-primary">
                                    {updateLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Lưu thay đổi'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
            {/* Modal */}
            <Footer />
            <div
                className="modal fade"
                id="changePasswordModal"
                tabIndex={-1}
                aria-labelledby="changePasswordModalLabel"
                aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="changePasswordModalLabel">
                                Đổi mật khẩu
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            />
                        </div>
                        <form onSubmit={handlePasswordUpdateSubmit}>
                            <div className="modal-body">
                                {/* Current Password */}
                                <div className="mb-3">
                                    <label className="form-label">Mật khẩu hiện tại</label>
                                    <div className="input-group">
                                        <input
                                            type={showCurrent ? 'text' : 'password'}
                                            className="form-control"
                                            name="currentPassword" />
                                        <span
                                            className="input-group-text"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setShowCurrent((prev) => !prev)}>
                                            <i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </span>
                                    </div>
                                    {passwordFieldErrors.CurrentPassword && (
                                        <div className="text-danger mt-1">{passwordFieldErrors.CurrentPassword}</div>
                                    )}
                                </div>

                                {/* New Password */}
                                <div className="mb-3">
                                    <label className="form-label">Mật khẩu mới</label>
                                    <div className="input-group">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            className="form-control"
                                            name="newPassword" />
                                        <span
                                            className="input-group-text"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setShowNew((prev) => !prev)}>
                                            <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </span>
                                    </div>
                                    {passwordFieldErrors.NewPassword && (
                                        <div className="text-danger mt-1">{passwordFieldErrors.NewPassword}</div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="mb-3">
                                    <label className="form-label">Xác nhận mật khẩu mới</label>
                                    <div className="input-group">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            className="form-control"
                                            name="confirmNewPassword" />
                                        <span
                                            className="input-group-text"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setShowConfirm((prev) => !prev)}>
                                            <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </span>
                                    </div>
                                    {passwordFieldErrors.ConfirmNewPassword && (
                                        <div className="text-danger mt-1">{passwordFieldErrors.ConfirmNewPassword}</div>
                                    )}
                                </div>

                                {passwordFieldErrors.general && (
                                    <div className="text-danger mt-1">{passwordFieldErrors.general}</div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                                    Đóng
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={updatePasswordLoading}>
                                    {updatePasswordLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Cập nhật mật khẩu'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}