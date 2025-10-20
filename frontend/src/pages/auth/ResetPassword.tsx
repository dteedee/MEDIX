import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';
import { validatePassword, getPasswordStrength } from '../../utils/validation';
import { PasswordRequirements } from '../../types/auth.types';
// @ts-ignore: allow importing CSS without type declarations
import '../../style/RegistrationPage.css';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    passwordConfirmation: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  // Get email and code from URL parameters
  const email = searchParams.get('email');
  const code = searchParams.get('code');

  // Redirect if no email or code
  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password');
    }
  }, [email, code, navigate]);

  // Update password requirements when password changes
  useEffect(() => {
    if (formData.password) {
      const requirements = validatePassword(formData.password);
      setPasswordRequirements(requirements);
      setPasswordStrength(getPasswordStrength(formData.password));
    }
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const passwordsMatch = formData.password === formData.passwordConfirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (!formData.passwordConfirmation) {
      setError('Vui lòng xác nhận mật khẩu');
      return;
    }

    if (!passwordsMatch) {
      setError('Mật khẩu và xác nhận không khớp');
      return;
    }

    // Check password requirements
    const requirements = validatePassword(formData.password);
    const allRequirementsMet = Object.values(requirements).every(Boolean);
    
    if (!allRequirementsMet) {
      setError('Mật khẩu không đáp ứng yêu cầu bảo mật');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call reset password API
      const response = await authService.resetPassword({
        email: email!,
        code: code!,
        password: formData.password,
        confirmPassword: formData.passwordConfirmation
      });

      if (response.success) {
        setSuccess('Mật khẩu đã được đặt lại thành công!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.error || 'Không thể đặt lại mật khẩu');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email || !code) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <div className="w-full max-w-3xl px-6 py-12">
        <div className="mx-auto" style={{ width: '60%' }}>
          <Card className="w-full p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-600/10 rounded-full">🔒</div>
            </div>
            <h1 className="text-2xl font-semibold text-center mb-1">Đặt lại mật khẩu</h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>
            </p>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="required">Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: '#6c757d',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                
                {/* Password Requirements */}
                <div className="password-requirements mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</h4>
                  <div className="requirement-list space-y-1">
                    <div className={`flex items-center text-xs ${passwordRequirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="check-icon mr-2">{passwordRequirements.minLength ? '✓' : '✗'}</span>
                      Ít nhất 6 ký tự
                    </div>
                    <div className={`flex items-center text-xs ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="check-icon mr-2">{passwordRequirements.hasUppercase ? '✓' : '✗'}</span>
                      Có chữ hoa (A, B, C)
                    </div>
                    <div className={`flex items-center text-xs ${passwordRequirements.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="check-icon mr-2">{passwordRequirements.hasLowercase ? '✓' : '✗'}</span>
                      Có chữ thường (a, b, c)
                    </div>
                    <div className={`flex items-center text-xs ${passwordRequirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="check-icon mr-2">{passwordRequirements.hasNumber ? '✓' : '✗'}</span>
                      Có số (1, 2, 3)
                    </div>
                    <div className={`flex items-center text-xs ${passwordRequirements.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="check-icon mr-2">{passwordRequirements.hasSpecialChar ? '✓' : '✗'}</span>
                      Có ký tự đặc biệt (!@#$%)
                    </div>
                  </div>
                  {formData.password && (
                    <div className="password-strength mt-2">
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>Độ mạnh:</span>
                      <span className={`strength-text ml-2 ${passwordStrength.label.toLowerCase()}`} style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
      
              <div className="form-group">
                <label className="required">Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPasswordConfirmation ? "text" : "password"}
                    name="passwordConfirmation"
                    value={formData.passwordConfirmation}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: '#6c757d',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPasswordConfirmation ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                  >
                    {showPasswordConfirmation ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formData.passwordConfirmation && (
                  <div className="password-match mt-2">
                    {passwordsMatch ? (
                      <span className="text-green-600 text-xs">✓ Mật khẩu khớp</span>
                    ) : (
                      <span className="text-red-600 text-xs">✗ Mật khẩu không khớp</span>
                    )}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !passwordsMatch || !formData.password || !formData.passwordConfirmation} 
                className="w-full"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600">Quay lại đăng nhập</Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
