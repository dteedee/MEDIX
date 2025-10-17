import styles from '../../styles/doctor-register.module.css'

import { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Swal from 'sweetalert2';
import DoctorService from '../../services/doctorService';
import { DoctorRegisterMetadata } from '../../types/doctor.types';

function DoctorRegister() {
    const [metadata, setMetadata] = useState<DoctorRegisterMetadata>();
    const [errors, setErrors] = useState<any>({});

    //const [password, setPassword] = useState('');
    //const [confirmPassword, setConfirmPassword] = useState('');

    const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);

    /*
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    */

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

        /* try {
            const response = await fetch('/api/doctor/register', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                console.log('Registration successful');
                setErrors({});
            } else {
                console.error('Registration failed');
                const errorData = await response.json();
                setErrors(errorData.errors);
                console.log(errorData.errors);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        } */

        setErrors({});
        try {
            await DoctorService.registerDoctor(formData);

            console.log('Registration successful');
            Swal.fire({
                title: 'Đăng ký thành công!',
                text: 'Bạn sẽ được chuyển về trang chủ',
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.href = '/';
            });
        } catch (error) {
            console.error('Registration failed');
            const errorData = error.response.data;
            setErrors(errorData.errors);
            console.log(errorData.errors);
        }

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
                                    <input type="text" className={styles["form-input"]} placeholder="Nguyễn Văn A" name='fullName' />
                                    {errors.FullName?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.FullName[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Tên đăng nhập <span className={styles["required"]}>*</span></label>
                                    <input type="text" className={styles["form-input"]} placeholder="drhao" name='userName' />
                                    {errors.UserName?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.UserName[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Ngày sinh</label>
                                    <input type="date" className={styles["form-input"]} placeholder="mm/dd/yyyy" name='dob' />
                                    {errors.Dob?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.Dob[0]}</div>
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
                                    <label className={styles["form-label"]}>Số CCCD/CMND <span className={styles["required"]}>*</span></label>
                                    <input type="text" className={styles["form-input"]} placeholder="Nhập số căn cước công dân 12 số"
                                        name='identificationNumber' />
                                    {errors.IdentificationNumber?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.IdentificationNumber[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Email <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='email' className={styles["form-input"]} placeholder="Email@example.com" />
                                    {errors.Email?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.Email[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số điện thoại <span className={styles["required"]}>*</span></label>
                                    <input type="tel" name='phoneNumber' className={styles["form-input"]} placeholder="09xxxxxxxx" />
                                    {errors.PhoneNumber?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.PhoneNumber[0]}</div>
                                    )}
                                </div>
                                {/* 
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Mật khẩu</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className={styles["form-input"]}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <div className="password-requirements">
                                        <div className="requirement-item">
                                            <span className="check-icon" style={{ color: hasMinLength ? 'green' : 'red' }}>
                                                {hasMinLength ? '✓' : '✗'}
                                            </span>
                                            <span className="requirement-text">Ít nhất 8 ký tự</span>
                                        </div>
                                        <div className="requirement-item">
                                            <span className="check-icon" style={{ color: hasUppercase ? 'green' : 'red' }}>
                                                {hasUppercase ? '✓' : '✗'}
                                            </span>
                                            <span className="requirement-text">Có chữ hoa (A, B, C)</span>
                                        </div>
                                        <div className="requirement-item">
                                            <span className="check-icon" style={{ color: hasNumber ? 'green' : 'red' }}>
                                                {hasNumber ? '✓' : '✗'}
                                            </span>

                                            <span className="requirement-text">Có số (1, 2, 3...)</span>
                                        </div>
                                        <div className="requirement-item">
                                            <span className="check-icon" style={{ color: hasSymbol ? 'green' : 'red' }}>
                                                {hasSymbol ? '✓' : '✗'}
                                            </span>

                                            <span className="requirement-text">Biểu tượng (*#@...)</span>
                                        </div>
                                    </div>

                                </div>

                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Xác nhận mật khẩu</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        className={styles["form-input"]}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <div className="password-match">
                                        {passwordsMatch ? (
                                            <span className="match-success">Mật khẩu khớp</span>
                                        ) : (
                                            <span className="match-error">Mật khẩu không khớp</span>
                                        )}
                                    </div>
                                </div>
                                */}
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
                                        <div className={styles["text-danger"]}>{errors.SpecializationId[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Chứng chỉ làm việc <span className={styles["required"]}>*</span></label>
                                    <input type="file" className={styles["form-file"]} accept="image/*" name='licenseImage' />
                                    {errors.LicenseImage?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.LicenseImage[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số chứng chỉ <span className={styles["required"]}>*</span></label>
                                    <input type="text" name='licenseNumber' className={styles["form-input"]} />
                                    {errors.LicenseNumber?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.LicenseNumber[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Thông tin bác sĩ</label>
                                    <textarea className={styles["form-input"]} name='bio' defaultValue={""} />
                                    {errors.Bio?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.Bio[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Trình độ học vấn</label>
                                    <textarea className={styles["form-input"]} name='education' defaultValue={""} />
                                    {errors.Education?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.Education[0]}</div>
                                    )}
                                </div>
                                <div className={styles["form-group"]}>
                                    <label className={styles["form-label"]}>Số năm kinh nghiệm <span className={styles["required"]}>*</span></label>
                                    <input type="text" className={styles["form-input"]} name='yearsOfExperience' />
                                    {errors.YearsOfExperience?.[0] && (
                                        <div className={styles["text-danger"]}>{errors.YearsOfExperience[0]}</div>
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