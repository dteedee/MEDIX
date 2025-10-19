import styles from '../../styles/doctor-register.module.css'

import { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Swal from 'sweetalert2';
import DoctorService from '../../services/doctorService';
import { DoctorRegisterMetadata } from '../../types/doctor.types';
import { PageLoader } from '../../components/ui';

function DoctorRegister() {
    const [metadata, setMetadata] = useState<DoctorRegisterMetadata>();

    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState<any>({});
    const [formData, setFormData] = useState<any>({});
    const [touched, setTouched] = useState<{ licenseImage?: boolean }>({});

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const data = await DoctorService.getMetadata();
                setMetadata(data);
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
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

        setErrors({});
        setLoading(true);
        try {
            await DoctorService.registerDoctor(formData);

            console.log('Registration successful');
            setLoading(false);
            Swal.fire({
                title: 'Đăng ký thành công!',
                text: 'Bạn sẽ được chuyển về trang chủ',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/';
            });
        } catch (error) {
            setLoading(false);
            console.error('Registration failed');
            const errorData = error.response.data;
            setErrors(errorData.errors);
            console.log(errorData.errors);
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
                if (!value.trim()) {
                    newErrors.UserName = ['Vui lòng nhập tên đăng nhập'];
                } else {
                    newErrors.UserName = [''];
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


        }

        setErrors((prev: any) => ({ ...prev, ...newErrors }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        const file = files?.[0];

        setTouched((prev) => ({ ...prev, [name]: true }));

        if (!file) {
            setErrors((prev: any) => ({
                ...prev,
                [name === 'licenseImage' ? 'LicenseImage' : name]: ['Vui lòng chọn một tệp hình ảnh'],
            }));
        } else if (!file.type.startsWith('image/')) {
            setErrors((prev: any) => ({
                ...prev,
                [name === 'licenseImage' ? 'LicenseImage' : name]: ['Tệp phải là hình ảnh (jpg, png, gif...)'],
            }));
        } else {
            setErrors((prev: any) => ({
                ...prev,
                [name === 'licenseImage' ? 'LicenseImage' : name]: [],
            }));
        }
        setFormData((prev: any) => ({ ...prev, [name]: file }));
    };

    return (
        <div>
            <Header />
            <main className={styles["main-container"]}>
                <div className={styles["form-container"]}>
                    <form id="registrationForm" encType='multipart/form-data' onSubmit={handleSubmit}>
                        {/* Row 1 */}
                        <div className={styles["form-row"]}>
                            {/* Left Column: Personal Info & Login */}
                            <div className={styles["form-section"]}>
                                <h2 className={styles["section-title"]}>Phần 1: Thông tin cá nhân &amp; đăng nhập</h2>
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
                                        onChange={handleChange} placeholder="drhao" name='userName' />
                                    {errors.UserName?.[0] && (
                                        <div className="text-danger">{errors.UserName[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Ngày sinh</label>
                                    <input type="date"
                                        className={`${styles["form-input"]} form-control ${errors.Dob?.[0]
                                            ? 'is-invalid'
                                            : formData.dob?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        placeholder="mm/dd/yyyy" name='dob' />
                                    {errors.Dob?.[0] && (
                                        <div className="text-danger">{errors.Dob[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Giới tính</label>
                                    <div className={styles["radio-group"]}>
                                        <div className={styles["radio-option"]}>
                                            <input type="radio" name="gender" id="male" defaultValue="Male" />
                                            <label htmlFor="male">Nam</label>
                                        </div>
                                        <div className={styles["radio-option"]}>
                                            <input type="radio" name="gender" id="female" defaultValue="Female" />
                                            <label htmlFor="female">Nữ</label>
                                        </div>
                                        <div className={styles["radio-option"]}>
                                            <input type="radio" name="gender" id="other" defaultValue="Other" />
                                            <label htmlFor="other">Khác</label>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số CCCD <span className={styles["required"]}>*</span></label>
                                    <input type="number"
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
                                        onChange={handleChange}
                                        placeholder="Nhập số căn cước công dân 12 số"
                                        name='identificationNumber' />
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
                                    <input type="number" name='phoneNumber'
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
                                        onChange={handleChange}
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
                                    <select className={styles["form-select"]} name='specializationId'>
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
                                    <label htmlFor="licenseImage" className={styles["form-label"]}>
                                        Chứng chỉ làm việc <span className={styles["required"]}>*</span>
                                    </label>

                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="file"
                                            id="licenseImage"
                                            name="licenseImage"
                                            accept="image/*"
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
                                    <input type="number"
                                        className={`${styles["form-input"]} form-control ${errors.YearsOfExperience?.[0]
                                            ? 'is-invalid'
                                            : formData.yearsOfExperience?.trim()
                                                ? 'is-valid'
                                                : ''
                                            }`}
                                        onChange={handleChange}
                                        name='yearsOfExperience' />
                                    {errors.YearsOfExperience?.[0] && (
                                        <div className="text-danger">{errors.YearsOfExperience[0]}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Terms & Conditions */}
                        {/*  
                        <div className="terms-section">
                            <div className="checkbox-wrapper">
                                <input type="checkbox" id="terms" />
                                <label htmlFor="terms" className="terms-text">
                                    Tôi đồng ý <a href="#" className="terms-link">Điều khoản dịch vụ</a> và <a href="#" className="terms-link">Chính sách bảo mật</a> của MEDIX. Thông tin y tế của bạn được mã hóa
                                    và tuân thủ chuẩn bảo mật y tế.
                                </label>
                            </div>
                        </div>
                        */}
                        {/* Submit Button */}
                        <div className={styles["submit-section"]}>
                            <button type="submit" className={styles["btn-submit"]}>ĐĂNG KÝ TÀI KHOẢN</button>
                            <div className={styles["login-link-section"]}>
                                Bạn đã có tài khoản? <a href="#" className={styles["login-link"]}>Đăng nhập ngay</a>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    )
}
export default DoctorRegister;
