import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';
import registrationService from '../../services/registrationService';
// @ts-ignore: allow importing CSS without type declarations
import '../../style/ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendEndTime, setResendEndTime] = useState<number | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const navigate = useNavigate();

  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Countdown timer for resend functionality
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Check if email exists and send verification code
  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setIsCheckingEmail(true);
    setError('');

    try {
      // Check if email exists
      const checkRes = await registrationService.checkEmailExists(email);
      
      if (!checkRes.success || !checkRes.data.exists) {
        setError('Email không tồn tại trong hệ thống');
        setIsCheckingEmail(false);
        return;
      }

      setEmailExists(true);

      // Send verification code
      const code = await authService.sendForgotPasswordCode(email);
      
      if (code) {
        setEmailVerificationSent(true);
        setResendCountdown(60); // 60 seconds countdown
        setResendEndTime(Date.now() + 60000);
        setError('');
      } else {
        setError('Không thể gửi mã xác thực. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi mã xác thực');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Verify the entered code
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Vui lòng nhập mã xác thực');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Mã xác thực phải có 6 chữ số');
      return;
    }

    setIsVerifyingCode(true);
    setError('');

    try {
      const result = await authService.verifyForgotPasswordCode(email, verificationCode);
      
      if (result.success) {
        setEmailVerified(true);
        // Navigate to reset password page with email and code
        navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(verificationCode)}`);
      } else {
        setError(result.message || 'Mã xác thực không đúng');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError('Có lỗi xảy ra khi xác thực mã');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    try {
      const code = await authService.resendForgotPasswordCode(email);
      
      if (code) {
        setResendCountdown(60);
        setResendEndTime(Date.now() + 60000);
        setError('');
        setVerificationCode(''); // Clear the input field
      } else {
        setError('Không thể gửi lại mã xác thực');
      }
    } catch (error: any) {
      console.error('Error resending code:', error);
      setError('Có lỗi xảy ra khi gửi lại mã xác thực');
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <Card className="forgot-password-card">
          <div className="forgot-password-header">
            <h1 className="forgot-password-title">Quên mật khẩu?</h1>
            <p className="forgot-password-subtitle">
              Nhập email của bạn để nhận mã xác nhận.
            </p>
          </div>

          <div className="forgot-password-form">
            {/* Email Input Section */}
            {!emailVerificationSent && (
              <div className="email-input-section">
                <div className="email-input-group">
                  <Input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className="email-input"
                  />
                  <Button
                    onClick={handleSendVerificationCode}
                    disabled={isCheckingEmail || !email}
                    className="send-code-btn"
                  >
                    {isCheckingEmail ? 'Đang gửi...' : 'Gửi mã xác thực'}
                  </Button>
                </div>

                {/* Error message */}
                {error && (
                  <div className="error-message" style={{ 
                    marginTop: '8px', 
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderLeft: '3px solid #e74c3c',
                    backgroundColor: '#fdf2f2',
                    color: '#e74c3c'
                  }}>
                    ❌ {error}
                  </div>
                )}
              </div>
            )}

            {/* Success message when email is sent */}
            {emailVerificationSent && !emailVerified && emailExists && (
              <div className="success-message" style={{
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                color: '#155724',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✅ Mã xác thực đã được gửi đến email của bạn!
              </div>
            )}

            {/* OTP Input Section */}
            {emailVerificationSent && !emailVerified && emailExists && (
              <div className="verification-code-section">
                <div className="verification-info">
                  <p className="info-text">
                    📧 Mã xác nhận đã được gửi đến email <strong>{email}</strong>
                  </p>
                </div>
                
                <div className="verification-input-group">
                  <input
                    type="text"
                    className="verification-code-input"
                    placeholder="Nhập mã"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      // Xóa thông báo lỗi khi người dùng nhập lại
                      if (error) setError('');
                    }}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isVerifyingCode || !verificationCode}
                    className="verify-code-btn"
                  >
                    {isVerifyingCode ? 'Đang kiểm tra...' : 'Xác nhận'}
                  </button>
                </div>

                {/* Hiển thị lỗi xác thực mã */}
                {error && (
                  <div className="error-message" style={{ 
                    marginTop: '8px', 
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderLeft: '3px solid #e74c3c',
                    backgroundColor: '#fdf2f2',
                    color: '#e74c3c'
                  }}>
                    ❌ {error}
                  </div>
                )}

                <div className="resend-section">
                  <span className="resend-text">
                    Không nhận được mã? 
                  </span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCountdown > 0}
                    className="resend-btn"
                  >
                    {resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại'}
                  </button>
                </div>
              </div>
            )}

            {/* Back to login link */}
            <div className="forgot-password-footer">
              <Link to="/login" className="back-to-login-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;