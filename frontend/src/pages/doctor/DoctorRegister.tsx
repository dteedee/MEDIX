import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface SpecializationDto {
  id: string;
  name: string;
}



export const DoctorRegister: React.FC = () => {
    const [specializations, setSpecializations] = useState<SpecializationDto[]>([]);
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
        axios.get('/api/doctor/register-metadata')
            .then(response => {
                setSpecializations(response.data.specializations);
            })
            .catch(error => {
                console.error('Error fetching specializations:', error);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        /*
        if (!hasMinLength || !hasUppercase || !hasNumber || !hasSymbol || !passwordsMatch) {
            return;
        }
            */

        try {
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
        }
    };

    return (
        <div>
            <main className="main-container">
                <div className="form-container">
                    <form id="registrationForm" encType='multipart/form-data' onSubmit={handleSubmit}>
                        {/* Row 1 */}
                        <div className="form-row">
                            {/* Left Column: Personal Info & Login */}
                            <div className="form-section">
                                <h2 className="section-title">Phần 1: Thông tin cá nhân &amp; đăng nhập</h2>
                                <div className="form-group">
                                    <label className="form-label">Họ và tên <span className="required">*</span></label>
                                    <input type="text" className="form-input" placeholder="Nguyễn Văn A" name='fullName' />
                                    {errors.FullName?.[0] && (
                                        <div className="text-danger">{errors.FullName[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Ngày sinh</label>
                                    <input type="date" className="form-input" placeholder="mm/dd/yyyy" name='dob' />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Giới tính</label>
                                    <div className="radio-group">
                                        <div className="radio-option">
                                            <input type="radio" name="gender" id="male" defaultValue="Male" />
                                            <label htmlFor="male">Nam</label>
                                        </div>
                                        <div className="radio-option">
                                            <input type="radio" name="gender" id="female" defaultValue="Female" />
                                            <label htmlFor="female">Nữ</label>
                                        </div>
                                        <div className="radio-option">
                                            <input type="radio" name="gender" id="other" defaultValue="Other" />
                                            <label htmlFor="other">Khác</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số CCCD/CMND <span className="required">*</span></label>
                                    <input type="text" className="form-input" placeholder="Nhập số căn cước công dân 12 số"
                                        name='identificationNumber' />
                                    {errors.IdentificationNumber?.[0] && (
                                        <div className="text-danger">{errors.IdentificationNumber[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email <span className="required">*</span></label>
                                    <input type="text" name='email' className="form-input" placeholder="Email@example.com" />
                                    {errors.Email?.[0] && (
                                        <div className="text-danger">{errors.Email[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số điện thoại <span className="required">*</span></label>
                                    <input type="tel" name='phoneNumber' className="form-input" placeholder="09xxxxxxxx" />
                                    {errors.PhoneNumber?.[0] && (
                                        <div className="text-danger">{errors.PhoneNumber[0]}</div>
                                    )}
                                </div>
                                {/* 
                                <div className="form-group">
                                    <label className="form-label">Mật khẩu</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="form-input"
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

                                <div className="form-group">
                                    <label className="form-label">Xác nhận mật khẩu</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        className="form-input"
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
                            <div className="form-section">
                                <h2 className="section-title">Phần 2: Thông tin bác sĩ</h2>
                                <div className="form-group">
                                    <label className="form-label">Chuyên khoa <span className="required">*</span></label>
                                    <select className="form-select" name='specializationId'>
                                        <option value="">Chọn chuyên khoa</option>
                                        {specializations.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                    {errors.SpecializationId?.[0] && (
                                        <div className="text-danger">{errors.SpecializationId[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Chứng chỉ làm việc <span className="required">*</span></label>
                                    <input type="file" className="form-file" accept="image/*" name='licenseImage' />
                                    {errors.LicenseImage?.[0] && (
                                        <div className="text-danger">{errors.LicenseImage[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số chứng chỉ <span className="required">*</span></label>
                                    <input type="text" name='licenseNumber' className="form-input" />
                                    {errors.LicenseNumber?.[0] && (
                                        <div className="text-danger">{errors.LicenseNumber[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Thông tin bác sĩ</label>
                                    <textarea className="form-input" name='bio' defaultValue={""} />
                                    {errors.Bio?.[0] && (
                                        <div className="text-danger">{errors.Bio[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Trình độ học vấn</label>
                                    <textarea className="form-input" name='education' defaultValue={""} />
                                    {errors.Education?.[0] && (
                                        <div className="text-danger">{errors.Education[0]}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số năm kinh nghiệm <span className="required">*</span></label>
                                    <input type="text" className="form-input" name='yearsOfExperience' />
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
                        <div className="submit-section">
                            <button type="submit" className="btn-submit">ĐĂNG KÝ TÀI KHOẢN</button>
                            <div className="login-link-section">
                                Bạn đã có tài khoản? <a href="#" className="login-link">Đăng nhập ngay</a>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
