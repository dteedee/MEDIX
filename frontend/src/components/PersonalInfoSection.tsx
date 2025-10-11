import React from 'react';

interface PersonalInfoProps {
  formData: {
    email: string;
    password: string;
    confirmPassword: string;
    fullname: string;
    phoneNumber: string;
    identificationNumber: string;
    address: string;
    dateOfBirth: string;
  };
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  emailVerified: boolean;
  emailVerificationSent: boolean;
  verificationCode: string;
  isVerifyingCode: boolean;
  isResendingCode: boolean;
  onEmailVerification: () => void;
  onVerifyCode: () => void;
  onResendCode: () => void;
  onVerificationCodeChange: (code: string) => void;
  passwordStrength: {
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    isLongEnough: boolean;
    score: number;
  };
}

export function PersonalInfoSection({ 
  formData, 
  onInputChange, 
  errors, 
  emailVerified,
  emailVerificationSent,
  verificationCode,
  isVerifyingCode,
  isResendingCode,
  onEmailVerification,
  onVerifyCode,
  onResendCode,
  onVerificationCodeChange,
  passwordStrength 
}: PersonalInfoProps) {
  return (
    <div className="form-section">
      <h2 className="section-title">Phần 1: Thông tin cá nhân & đăng nhập</h2>
      
      <div className="form-group">
        <label htmlFor="fullname" className="required">Họ và tên</label>
        <input
          type="text"
          id="fullname"
          placeholder="Họ và tên của bạn"
          value={formData.fullname}
          onChange={(e) => onInputChange('fullname', e.target.value)}
          className={errors.fullname ? 'error' : (formData.fullname && !errors.fullname ? 'success' : '')}
          required
        />
        {errors.fullname && <span className="error-message">{errors.fullname}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="identificationNumber" className="required">Số CCCD/CMND</label>
        <input
          type="text"
          id="identificationNumber"
          placeholder="Nhập số chứng minh thư của bạn"
          value={formData.identificationNumber}
          onChange={(e) => onInputChange('identificationNumber', e.target.value)}
          className={errors.identificationNumber ? 'error' : (formData.identificationNumber && !errors.identificationNumber ? 'success' : '')}
          required
        />
        {errors.identificationNumber && <span className="error-message">{errors.identificationNumber}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="address" className="required">Địa chỉ liên lạc</label>
        <textarea
          id="address"
          placeholder="Nhập địa chỉ liên lạc của bạn"
          value={formData.address}
          onChange={(e) => onInputChange('address', e.target.value)}
          className={errors.address ? 'error' : (formData.address && !errors.address ? 'success' : '')}
          rows={3}
          required
        />
        {errors.address && <span className="error-message">{errors.address}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="required">Email</label>
        <div className="email-input-group">
          <input
            type="email"
            id="email"
            placeholder="example@example.com"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className={errors.email ? 'error' : (formData.email && !errors.email ? 'success' : '')}
            required
          />
          <button
            type="button"
            onClick={onEmailVerification}
            disabled={!formData.email || !!errors.email || emailVerificationSent}
            className={`verify-email-btn ${emailVerified ? 'verified' : ''} ${emailVerificationSent ? 'sent' : ''}`}
          >
            {emailVerified ? '✓ Đã xác nhận' : emailVerificationSent ? 'Đã gửi' : 'Xác nhận'}
          </button>
        </div>
        {errors.email && <span className="error-message">{errors.email}</span>}
        {emailVerified && (
          <div className="email-verified-message">
            <span className="success-text">✓ Email đã được xác nhận</span>
          </div>
        )}
        
        {emailVerificationSent && !emailVerified && (
          <div className="verification-code-section">
            <div className="verification-info">
              <span className="info-text">📧 Mã xác nhận đã được gửi đến email: <strong>{formData.email}</strong></span>
            </div>
            <div className="verification-input-group">
              <input
                type="text"
                placeholder="Nhập mã xác nhận 6 chữ số"
                value={verificationCode}
                onChange={(e) => onVerificationCodeChange(e.target.value)}
                className="verification-code-input"
                maxLength={6}
                pattern="[0-9]{6}"
              />
              <button
                type="button"
                onClick={onVerifyCode}
                disabled={!verificationCode.trim() || isVerifyingCode}
                className="verify-code-btn"
              >
                {isVerifyingCode ? 'Đang xác nhận...' : 'Xác nhận mã'}
              </button>
            </div>
            <div className="resend-section">
              <span className="resend-text">Không nhận được mã? </span>
              <button
                type="button"
                onClick={onResendCode}
                disabled={isResendingCode}
                className="resend-btn"
              >
                {isResendingCode ? 'Đang gửi...' : 'Gửi lại'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="phoneNumber" className="required">Số điện thoại</label>
        <input
          type="tel"
          id="phoneNumber"
          placeholder="0868585858"
          value={formData.phoneNumber}
          onChange={(e) => onInputChange('phoneNumber', e.target.value)}
          className={errors.phoneNumber ? 'error' : (formData.phoneNumber && !errors.phoneNumber ? 'success' : '')}
          required
        />
        {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="password" className="required">Mật khẩu</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••••"
            value={formData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            className={errors.password ? 'error' : (formData.password && !errors.password ? 'success' : '')}
            required
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
          <div className="password-strength">
            <div className="strength-indicator">
              <div className={`strength-bar ${passwordStrength.score >= 1 ? 'filled' : ''}`}></div>
              <div className={`strength-bar ${passwordStrength.score >= 2 ? 'filled' : ''}`}></div>
              <div className={`strength-bar ${passwordStrength.score >= 3 ? 'filled' : ''}`}></div>
              <div className={`strength-bar ${passwordStrength.score >= 4 ? 'filled' : ''}`}></div>
              <div className={`strength-bar ${passwordStrength.score >= 5 ? 'filled' : ''}`}></div>
            </div>
            <span className={`strength-text ${
              passwordStrength.score >= 4 ? 'strong' : 
              passwordStrength.score >= 3 ? 'medium' : 
              passwordStrength.score >= 1 ? 'weak' : 'very-weak'
            }`}>
              {passwordStrength.score >= 4 ? 'Rất mạnh' : 
               passwordStrength.score >= 3 ? 'Mạnh' : 
               passwordStrength.score >= 1 ? 'Yếu' : 'Rất yếu'}
            </span>
          </div>
          
          {formData.password && (
            <div className="password-requirements">
              <h4>Các kiểu ký tự:</h4>
              <div className="requirement-list">
                <div className={`requirement ${passwordStrength.hasLowercase ? 'met' : ''}`}>
                  <span className="check-icon">{passwordStrength.hasLowercase ? '✓' : '✗'}</span>
                  In thường (a, b, c)
                </div>
                <div className={`requirement ${passwordStrength.hasUppercase ? 'met' : ''}`}>
                  <span className="check-icon">{passwordStrength.hasUppercase ? '✓' : '✗'}</span>
                  In hoa (A, B, C)
                </div>
                <div className={`requirement ${passwordStrength.hasNumbers ? 'met' : ''}`}>
                  <span className="check-icon">{passwordStrength.hasNumbers ? '✓' : '✗'}</span>
                  Chữ số (0, 1, 2,...)
                </div>
                <div className={`requirement ${passwordStrength.hasSpecialChars ? 'met' : ''}`}>
                  <span className="check-icon">{passwordStrength.hasSpecialChars ? '✓' : '✗'}</span>
                  Biểu tượng (?#@...)
                </div>
                <div className={`requirement ${passwordStrength.isLongEnough ? 'met' : ''}`}>
                  <span className="check-icon">{passwordStrength.isLongEnough ? '✓' : '✗'}</span>
                  Ít nhất 8 ký tự
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="required">Xác nhận mật khẩu</label>
          <input
            type="password"
            id="confirmPassword"
            placeholder="••••••••••"
            value={formData.confirmPassword}
            onChange={(e) => onInputChange('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? 'error' : (formData.confirmPassword && !errors.confirmPassword ? 'success' : '')}
            required
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
            <div className="password-match">
              <span className="match-text">✓ Mật khẩu khớp</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}