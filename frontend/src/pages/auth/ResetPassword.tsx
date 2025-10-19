import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword: React.FC = () => {
  const query = useQuery();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // show / hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // live validation state
  const [touched, setTouched] = useState({ pw: false, confirm: false });

  useEffect(() => {
    const t = query.get('token');
    if (t) setToken(t);
    const e = query.get('email');
    if (e) setEmail(e);
    else setError('Liên kết đặt lại mật khẩu không hợp lệ');
  }, [query]);

  // password criteria helpers (kept on FE for live UX)
  const pwCriteria = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const satisfiedCount = Object.values(pwCriteria).filter(Boolean).length;
  const strength = satisfiedCount === 5 ? 'Mạnh' : satisfiedCount >= 3 ? 'Trung bình' : 'Yếu';
  const strengthColor =
    satisfiedCount === 5 ? 'bg-green-500' : satisfiedCount >= 3 ? 'bg-yellow-400' : 'bg-red-400';
  const strengthPercent = Math.round((satisfiedCount / 5) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ');
      return;
    }
    if (!email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!authService.validatePasswordComplexity(password)) {
      setError('Mật khẩu không đáp ứng yêu cầu bảo mật');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({ token, email, password, confirmPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra. Liên kết có thể đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12 items-center">
        {/* Left: bác sĩ trên nền xanh y tế */}
        <div className="flex items-center justify-center">
          <div className="w-full p-8 rounded-lg bg-[#E6F9FF] shadow-md flex items-center justify-center">
            <img
              src="/images/doctor-left.png"
              alt="Bác sĩ"
              className="w-full h-auto max-h-[640px] object-cover rounded-md shadow-lg"
            />
          </div>
        </div>

        {/* Right: form */}
        <Card className="w-full p-8">
          <h1 className="text-2xl font-semibold text-center mb-1">Đặt lại mật khẩu</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Nhập mật khẩu mới cho tài khoản của bạn</p>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
              )}
              <div>
                <label htmlFor="new-password" className="block text-sm mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setTouched((s) => ({ ...s, pw: true })); }}
                    placeholder="Nhập mật khẩu mới"
                    disabled={isLoading || !token}
                    aria-describedby="pw-help pw-strength"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? (
                      // eye-off
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                      </svg>
                    ) : (
                      // eye
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                <div id="pw-strength" className="mt-3">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-medium">Độ mạnh:</span>
                    <span className={`${satisfiedCount === 5 ? 'text-green-600' : satisfiedCount >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>{strength}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                      <div style={{ width: `${strengthPercent}%` }} className={`h-full ${strengthColor}`} />
                    </div>
                  </div>

                  {/* Criteria list */}
                  <div id="pw-help" className="text-sm text-gray-700 space-y-1">
                    <div className="flex items-center gap-2">
                      {pwCriteria.lower ? (
                        <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 10-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd"/></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="3"/></svg>
                      )}
                      <span>In thường (a, b, c)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pwCriteria.upper ? (
                        <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 10-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd"/></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="3"/></svg>
                      )}
                      <span>In hoa (A, B, C)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pwCriteria.number ? (
                        <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 10-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd"/></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="3"/></svg>
                      )}
                      <span>Chữ số (0, 1, 2,...)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pwCriteria.symbol ? (
                        <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 10-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd"/></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="3"/></svg>
                      )}
                      <span>Biểu tượng (!@#...)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pwCriteria.length ? (
                        <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 10-1.414-1.414L8 11.172 4.707 7.879A1 1 0 003.293 9.293l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd"/></svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="3"/></svg>
                      )}
                      <span>Độ dài ≥ 8 ký tự</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm mb-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setTouched((s) => ({ ...s, confirm: true })); }}
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={isLoading || !token}
                    aria-describedby="confirm-help"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-pressed={showConfirmPassword}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {touched.confirm && (
                  <p id="confirm-help" className={`text-sm mt-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {password === confirmPassword ? 'Mật khẩu khớp' : 'Mật khẩu không khớp'}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isLoading || !token} className="w-full">
                {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </Button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-blue-600 hover:underline">Quay lại đăng nhập</Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                Mật khẩu đã được đặt lại thành công!
              </div>
              <p className="text-sm text-gray-600 text-center">Bạn có thể đăng nhập với mật khẩu mới của mình.</p>
              <div>
                <Link to="/login" className="block w-full">
                  <Button className="w-full">Đăng nhập ngay</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;




