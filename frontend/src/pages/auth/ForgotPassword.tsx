import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';
import { emailVerificationService } from '../../services/mailverified';
import registrationService from '../../services/registrationService';
// @ts-ignore: allow importing CSS without type declarations
import '../../style/RegistrationPage.css';

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

    setError('');
    setIsCheckingEmail(true);
    setEmailExists(false);

    try {
      // First check if email exists in the system
      const checkRes = await registrationService.checkEmailExists(email);
      if (!checkRes.success || !checkRes.data.exists) {
        setEmailExists(true);
        setIsCheckingEmail(false);
        return;
      }

      // If email exists, send forgot password OTP
      await authService.forgotPassword({ email });
      setEmailVerificationSent(true);
      setResendCountdown(60); // 60 seconds countdown
      setResendEndTime(Date.now() + 60000);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi kiểm tra email');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Verify the OTP code
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Vui lòng nhập mã xác nhận');
      return;
    }

    setError('');
    setIsVerifyingCode(true);

    try {
      // For forgot password, we don't need to verify the code here
      // Just redirect to reset password page with email and code
      setEmailVerified(true);
      navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(verificationCode)}`);
    } catch (err: any) {
      setError(err?.message || 'Không thể xác thực mã');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    setError('');
    setIsCheckingEmail(true);

    try {
      await authService.forgotPassword({ email });
      setResendCountdown(60);
      setResendEndTime(Date.now() + 60000);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi gửi lại mã');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <div className="w-full max-w-3xl px-6 py-12">
        <div className="mx-auto" style={{ width: '60%' }}>
          <Card className="w-full p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-600/10 rounded-full">📧</div>
            </div>
            <h1 className="text-2xl font-semibold text-center mb-1">Quên mật khẩu?</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Nhập email của bạn để nhận mã xác nhận.</p>

            <div className="form-group">
              <label className="required">Email</label>
              <div className="email-input-group">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email@example.com"
                  disabled={emailVerified}
                  className={emailVerified ? 'success' : emailExists ? 'error' : ''}
                  style={emailExists ? { borderColor: '#e74c3c', backgroundColor: '#fdf2f2' } : {}}
                />
                {/* Hide button when verification code is sent but not yet verified */}
                {!emailVerificationSent && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isCheckingEmail || emailVerified || !email || emailExists}
                    className={`verify-email-btn ${emailVerified ? 'verified' : ''} ${isCheckingEmail ? 'checking' : ''}`}
                  >
                    {isCheckingEmail ? 'Đang kiểm tra...' : emailVerified ? '✓ Đã xác thực' : 'Gửi mã xác thực'}
                  </button>
                )}
                {emailVerified && (
                  <button
                    type="button"
                    disabled
                    className="verify-email-btn verified"
                  >
                    ✓ Đã xác thực
                  </button>
                )}
              </div>
              {isCheckingEmail && (
                <div className="mt-1">
                  <span className="info-text" style={{ fontSize: '12px', color: '#6c757d' }}>
                    Đang kiểm tra email...
                  </span>
                </div>
              )}
              {emailExists && (
                <div className="error-message" style={{ 
                  marginTop: '4px', 
                  fontSize: '12px',
                  padding: '8px 12px',
                  borderLeft: '3px solid #e74c3c'
                }}>
                  ❌ Email này không tồn tại trong hệ thống. Vui lòng kiểm tra lại.
                </div>
              )}
              {emailVerificationSent && !emailVerified && !emailExists && (
                <div className="success-message" style={{ 
                  marginTop: '4px', 
                  fontSize: '12px',
                  padding: '8px 12px',
                  borderLeft: '3px solid #27ae60',
                  backgroundColor: '#f8fff8',
                  color: '#27ae60'
                }}>
                  ✅ Mã xác thực đã được gửi đến email của bạn!
                </div>
              )}
              {emailVerified && !emailExists && (
                <div className="email-verified-message" style={{ 
                  marginTop: '4px', 
                  fontSize: '12px',
                  padding: '8px 12px',
                  borderLeft: '3px solid #27ae60',
                  backgroundColor: '#f8f9fa',
                  color: '#27ae60'
                }}>
                  ✓ Email đã được xác thực
                </div>
              )}
            </div>

            {/* Verification Code Section - Only show if email doesn't exist */}
            {emailVerificationSent && !emailVerified && !emailExists && (
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
                    placeholder="Nhập mã xác nhận"
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

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600">Quay lại đăng nhập</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;