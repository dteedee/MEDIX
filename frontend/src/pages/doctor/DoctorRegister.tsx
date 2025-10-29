import styles from '../../styles/doctor/doctor-register.module.css'

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { DoctorRegisterMetadata } from '../../types/doctor.types';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '../../components/ui';
import DoctorRegistrationFormService from '../../services/doctorRegistrationFormService';

function DoctorRegister() {
    const [metadata, setMetadata] = useState<DoctorRegisterMetadata>();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [errorCode, setErrorCode] = useState<number | null>(null);

    const [errors, setErrors] = useState<any>({});
    const [formData, setFormData] = useState<any>({});
    const [touched, setTouched] = useState<{
        licenseImage?: boolean,
        avatar?: boolean,
        degreeFiles?: boolean
    }>({});

    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const data = await DoctorRegistrationFormService.getMetadata();
                setMetadata(data);
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
                setErrorCode(500);
            } finally {
                setPageLoading(false);
            }
        }
        fetchMetadata();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }
        console.log(formData);

        const agreed = formData.get('agreeToTerms') === 'on'; // checkbox returns 'on' if checked

        if (!agreed) {
            setErrors((prev: any) => ({
                ...prev, AgreeToTerms: 'Vui lòng đọc và đồng ý với điều khoản trước khi đăng ký'
            }));
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await DoctorRegistrationFormService.registerDoctor(formData);
            setLoading(false);
            console.log('Registration successful');
            Swal.fire({
                title: 'Đăng ký thành công!',
                text: 'Bạn sẽ được chuyển về trang chủ',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/';
            });
        } catch (error: any) {
            setLoading(false);
            console.error('Registration failed:', error);

            const status = error?.response?.status;

            if (status === 400 || status === 422) {
                // Handle validation errors
                const errorData = error.response.data;
                setErrors(errorData.errors);
                console.log(errorData.errors);
            } else {
                // Fallback for other errors
                setErrors({ general: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
            }
        }

    };

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

            case 'userName':
                const trimmed = value.trim();

                if (!trimmed) {
                    newErrors.UserName = ['Vui lòng nhập tên đăng nhập'];
                } else if (trimmed.length < 6) {
                    newErrors.UserName = ['Tên đăng nhập phải có ít nhất 6 ký tự'];
                } else if (trimmed.length > 20) {
                    newErrors.UserName = ['Tên đăng nhập không được vượt quá 20 ký tự'];
                } else if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
                    newErrors.UserName = ['Tên đăng nhập chỉ được chứa chữ cái và số, không có khoảng trắng hoặc ký tự đặc biệt'];
                } else {
                    newErrors.UserName = [];
                }
                break;

            case 'identificationNumber':
                if (!value.trim()) {
                    newErrors.IdentificationNumber = ['Vui lòng nhập số CCCD'];
                } else if (!/^\d{12}$/.test(value)) {
                    newErrors.IdentificationNumber = ['Số CCCD phải gồm đúng 12 chữ số'];
                } else {
                    newErrors.IdentificationNumber = [];
                }
                break;

            case 'email':
                if (!value.trim()) {
                    newErrors.Email = ['Vui lòng nhập email'];
                } else if (!/^\S+@\S+\.\S+$/.test(value)) {
                    newErrors.Email = ['Email không hợp lệ'];
                }
                else {
                    newErrors.Email = [];
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

            case 'licenseNumber':
                if (!value.trim()) {
                    newErrors.LicenseNumber = ['Vui lòng nhập số giấy phép hành nghề'];
                } else {
                    newErrors.LicenseNumber = [];
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

            case 'dob':
                if (!value) {
                    newErrors.Dob = ['Vui lòng nhập ngày sinh']; // No error if left empty
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

            case 'genderCode':
                if (!value) {
                    newErrors.GenderCode = ['Vui lòng chọn giới tính'];
                } else {
                    newErrors.GenderCode = [];
                }
                break;
        }

        setErrors((prev: any) => ({ ...prev, ...newErrors }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        //setFormData((prev: any) => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        const name = e.target.name;

        setFormData((prev: any) => ({ ...prev, [name]: file }));

        switch (name) {
            case 'avatar':
                validateFile('Avatar', file, 'image');
                break;
            case 'licenseImage':
                validateFile('LicenseImage', file, 'image');
                break;
            case 'degreeFiles':
                validateFile('DegreeFiles', file, 'archive');
                break;
        }
    };

    const validateFile = (name: string, file: File | null, type: 'image' | 'archive') => {
        if (!file) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: [`Vui lòng chọn một tệp.`],
            }));
            return;
        }

        const maxSizeInMB = 3; // 3MB in bytes
        const maxSize = maxSizeInMB * 1024 * 1024;

        if (file.size > maxSize) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: [`Kích thước tệp không được vượt quá ${maxSizeInMB}MB.`],
            }))
        };

        const validArchiveExtensions = ['.zip', '.rar'];
        const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();


        switch (type) {
            case 'archive':
                if (!validArchiveExtensions.includes(fileExtension)) {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: ['Tệp phải có định dạng ZIP hoặc RAR.'],
                    }));
                } else {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: [''],
                    }));
                }
                break;
            case 'image':
                if (!validImageExtensions.includes(fileExtension)) {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: ['Tệp phải là ảnh hợp lệ (jpg, png, gif, webp).'],
                    }));
                } else {
                    setErrors((prev: any) => ({
                        ...prev,
                        [name]: [''],
                    }));
                }
                break;
        }
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Live validation
        if (!value) {
            setErrors((prev: any) => ({ ...prev, 'SpecializationId': ['Vui lòng chọn chuyên khoa'] }));
        } else {
            setErrors((prev: any) => ({ ...prev, 'SpecializationId': [''] }));
        }
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
    };


    if (pageLoading) return <PageLoader />;

    if (errorCode) {
        navigate(`/error/${errorCode}`);
        return null;
    }

    return (
        <div>
            <main className={styles["main-container"]}>
                <div className={styles["form-container"]}>
                    <div className={styles["doctor-register-title-section"]}>
                        <h1 className={styles["register-title"]}>Đăng Ký Tài Khoản Bác Sĩ</h1>
                        <div className={styles["register-desc"]}>
                            Vui lòng điền đầy đủ thông tin để tạo tài khoản
                        </div>
                    </div>
                    <form id="registrationForm" encType='multipart/form-data' onSubmit={handleSubmit}>
                        {/* Row 1 */}
                        <div className={styles["form-row"]}>
                            {/* Left Column: Personal Info & Login */}
                            <div className={styles["form-section"]}>
                                <h2 className={styles["section-title"]}>Phần 1: Thông tin cá nhân &amp; đăng nhập</h2>
                                <div className={styles["form-group"]}>
                                    <label htmlFor="avatar" className={styles["form-label"]}>
                                        Ảnh thẻ <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="avatar"
                                            name="avatar"
                                            accept=".jpg,.png,.gif,.webp,.jpeg"
                                            onChange={handleFileChange}
                                            className={`d-none`} />

                                        <label
                                            htmlFor="avatar"
                                            className={`btn btn-outline-primary ${errors.Avatar?.[0]
                                                ? 'is-invalid'
                                                : touched.avatar && formData.avatar
                                                    ? 'is-valid'
                                                    : ''
                                                }`}>
                                            Chọn file
                                        </label>

                                        <span className="ms-2">
                                            {formData.avatar?.name || 'Chưa có file nào được chọn'}
                                        </span>
                                    </div>

                                    {errors.Avatar?.[0] && (
                                        <div className="text-danger">
                                            {errors.Avatar[0]}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Họ và tên <span className={styles["required"]}>*</span></label>
                                    <input
                                        type="text"
                                        className={`${styles["form-input"]} form-control ${errors.FullName?.[0]
                                            ? 'is-invalid'
                                            : formData.fullName?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        name="fullName"
                                        placeholder="Nguyễn Văn A" />
                                    {errors.FullName?.[0] && <div className="text-danger">{errors.FullName[0]}</div>}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Tên đăng nhập <span className={styles["required"]}>*</span></label>
                                    <input type="text"
                                        className={`${styles["form-input"]} form-control ${errors.UserName?.[0]
                                            ? 'is-invalid'
                                            : formData.userName?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            target.value = target.value.slice(0, 15); // force max 15 characters
                                        }}
                                        placeholder="drhao" name='userName' />
                                    {errors.UserName?.[0] && (
                                        <div className="text-danger">{errors.UserName[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Ngày sinh <span className={styles["required"]}>*</span></label>
                                    <input type="date"
                                        className={`${styles["form-input"]} form-control ${errors.Dob?.[0]
                                            ? 'is-invalid'
                                            : formData.dob?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        placeholder="mm/dd/yyyy"
                                        name='dob'
                                        max="9999-12-31" />
                                    {errors.Dob?.[0] && (
                                        <div className="text-danger">{errors.Dob[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Giới tính <span className={styles["required"]}>*</span></label>
                                    <div className={styles["radio-group"]}>
                                        {["Male", "Female", "Other"].map((value) => (
                                            <div key={value} className={styles["radio-option"]}>
                                                <input
                                                    type="radio"
                                                    name="genderCode"
                                                    id={value.toLowerCase()}
                                                    value={value}
                                                    onChange={handleChange}
                                                />
                                                <label htmlFor={value.toLowerCase()}>
                                                    {value === "Male" ? "Nam" : value === "Female" ? "Nữ" : "Khác"}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.GenderCode?.[0] && (
                                        <div className="text-danger">{errors.GenderCode[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số CCCD <span className={styles["required"]}>*</span></label>
                                    <input type="text"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.length > 12) {
                                                target.value = target.value.slice(0, 12);
                                            }
                                        }}
                                        className={`${styles["form-input"]} form-control ${errors.IdentificationNumber?.[0]
                                            ? 'is-invalid'
                                            : formData.identificationNumber?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={(e) => { handleNumberChange(e); handleChange(e); }}
                                        placeholder="Nhập số căn cước công dân 12 số"
                                        name='identificationNumber'
                                        value={formData.identificationNumber} />
                                    {errors.IdentificationNumber?.[0] && (
                                        <div className="text-danger">{errors.IdentificationNumber[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Email <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='email'
                                        className={`${styles["form-input"]} form-control ${errors.Email?.[0]
                                            ? 'is-invalid'
                                            : formData.email?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        placeholder="Email@example.com" />
                                    {errors.Email?.[0] && (
                                        <div className="text-danger">{errors.Email[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số điện thoại <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='phoneNumber'
                                        inputMode="numeric"
                                        pattern="\d*"
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.length > 10) {
                                                target.value = target.value.slice(0, 10);
                                            }
                                        }}
                                        className={`${styles["form-input"]} form-control ${errors.PhoneNumber?.[0]
                                            ? 'is-invalid'
                                            : formData.phoneNumber?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={(e) => {
                                            handleNumberChange(e);
                                            handleChange(e);
                                        }}
                                        value={formData.phoneNumber}
                                        placeholder="09xxxxxxxx" />
                                    {errors.PhoneNumber?.[0] && (
                                        <div className="text-danger">{errors.PhoneNumber[0]}</div>
                                    )}
                                </div>
                            </div>
                            {/* Right Column: Medical Info & Emergency Contact */}
                            <div className={styles["form-section"]}>
                                <h2 className={styles["section-title"]}>Phần 2: Thông tin bác sĩ</h2>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Chuyên khoa <span className={styles["required"]}>*</span></label>
                                    <select className={`${styles["form-select"]}`} name='specializationId'
                                        onChange={handleSelectChange}>
                                        <option value="">Chọn chuyên khoa</option>
                                        {metadata?.specializations.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                    {errors.SpecializationId?.[0] && (
                                        <div className="text-danger">{errors.SpecializationId[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số chứng chỉ <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='licenseNumber'
                                        className={`${styles["form-input"]} form-control ${errors.LicenseNumber?.[0]
                                            ? 'is-invalid'
                                            : formData.licenseNumber?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange} />
                                    {errors.LicenseNumber?.[0] && (
                                        <div className="text-danger">{errors.LicenseNumber[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label htmlFor="licenseImage" className={styles["form-label"]}>
                                        Ảnh chứng chỉ <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="licenseImage"
                                            name="licenseImage"
                                            accept=".jpg,.png,.gif,.webp,.jpeg"
                                            onChange={handleFileChange}
                                            className={`d-none`} />

                                        <label
                                            htmlFor="licenseImage"
                                            className={`btn btn-outline-primary ${errors.LicenseImage?.[0]
                                                ? 'is-invalid'
                                                : touched.licenseImage && formData.licenseImage
                                                    ? 'is-valid'
                                                    : ''
                                                }`}>
                                            Chọn file
                                        </label>

                                        <span className="ms-2">
                                            {formData.licenseImage?.name || 'Chưa có file nào được chọn'}
                                        </span>
                                    </div>

                                    {errors.LicenseImage?.[0] && (
                                        <div className="text-danger">
                                            {errors.LicenseImage[0]}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label htmlFor="degreeFiles" className={styles["form-label"]}>
                                        Bằng cấp <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="degreeFiles"
                                            name="degreeFiles"
                                            accept=".zip,.rar"
                                            onChange={handleFileChange}
                                            className={`d-none`} />

                                        <label
                                            htmlFor="degreeFiles"
                                            className={`btn btn-outline-primary ${errors.DegreeFiles?.[0]
                                                ? 'is-invalid'
                                                : touched.degreeFiles && formData.degreeFiles
                                                    ? 'is-valid'
                                                    : ''
                                                }`}>
                                            Chọn file
                                        </label>

                                        <span className="ms-2">
                                            {formData.degreeFiles?.name || 'Chưa có file nào được chọn'}
                                        </span>
                                    </div>

                                    {errors.DegreeFiles?.[0] && (
                                        <div className="text-danger">
                                            {errors.DegreeFiles[0]}
                                        </div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Tiểu sử</label>
                                    <textarea className={styles["form-input"]} name='bio' defaultValue={""} />
                                    {errors.Bio?.[0] && (
                                        <div className="text-danger">{errors.Bio[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Trình độ học vấn</label>
                                    <textarea className={styles["form-input"]} name='education' defaultValue={""} />
                                    {errors.Education?.[0] && (
                                        <div className="text-danger">{errors.Education[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số năm kinh nghiệm <span className={styles["required"]}>*</span></label>
                                    <input type="text"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        className={`${styles["form-input"]} form-control ${errors.YearsOfExperience?.[0]
                                            ? 'is-invalid'
                                            : formData.yearsOfExperience?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={(e) => {
                                            handleNumberChange(e);
                                            handleChange(e);
                                        }}
                                        name='yearsOfExperience'
                                        value={formData.yearsOfExperience} />
                                    {errors.YearsOfExperience?.[0] && (
                                        <div className="text-danger">{errors.YearsOfExperience[0]}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Terms & Conditions */}
                        <div className={styles["terms-section"]}>
                            <div className={styles["checkbox-wrapper"]}>
                                <input type="checkbox" id="terms" name='agreeToTerms' />
                                <label htmlFor="terms" className={styles["terms-text"]}>
                                    Tôi đồng ý <a href="#" className={styles["terms-link"]}>Điều khoản dịch vụ</a> và <a href="#" className={styles["terms-link"]}>Chính sách bảo mật</a> của MEDIX. Thông tin y tế của bạn được mã hóa
                                    và tuân thủ chuẩn bảo mật y tế.
                                </label>
                            </div>
                            {errors.AgreeToTerms?.[0] && <div className="text-danger">{errors.AgreeToTerms}</div>}
                        </div>
                        {/* Submit Button */}
                        <div className={styles["submit-section"]}>
                            {errors.general && <div className="text-danger">{errors.general}</div>}
                            <button type="submit" disabled={loading} className={styles["btn-submit"]}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'ĐĂNG KÝ TÀI KHOẢN'
                                )}
                            </button>
                            <div className={styles["login-link-section"]}>
                                Bạn đã có tài khoản? <a href="/login" className={styles["login-link"]}>Đăng nhập ngay</a>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
export default DoctorRegister;
