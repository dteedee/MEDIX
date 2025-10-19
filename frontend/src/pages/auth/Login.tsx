import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { UserRole } from '../../types/common.types';

const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Helper: determine dashboard path based on role
const getDashboardPath = (role: string): string => {
  switch (role) {
    case UserRole.ADMIN:
      return '/app/admin';
    case UserRole.MANAGER:
      return '/app/manager';
    case UserRole.DOCTOR:
      return '/app/doctor/dashboard';
    case UserRole.PATIENT:
      return '/app/patient/dashboard';
    default:
      return '/';
  }
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const errorTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  // Nếu đã login thì chuyển về homepage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const currentUser = localStorage.getItem('currentUser');
    if (token && currentUser) {
      navigate('/');
      return;
    }
    setCheckingAuth(false);
  }, [navigate]);

  // Load Google script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleError('Google Client ID chưa được cấu hình. Vui lòng thêm VITE_GOOGLE_CLIENT_ID vào .env');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleReady(true);
      const google = (window as any).google;
      if (google && GOOGLE_CLIENT_ID) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        const container = document.getElementById('googleSignInDiv');
        if (container) {
          google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 330,
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    };
  }, []);

  // Auto clear error/success messages
  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setError(null), 5000);
    }
    if (successMsg) {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
      successTimerRef.current = window.setTimeout(() => setSuccessMsg(null), 5000);
    }
  }, [error, successMsg]);

  // Handle normal login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGoogleError(null);
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      apiClient.setTokens(response.accessToken, response.refreshToken);

      // save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);

      if (rememberMe) localStorage.setItem('rememberEmail', email);
      else localStorage.removeItem('rememberEmail');

      window.dispatchEvent(new Event('authChanged'));
      setSuccessMsg('Đăng nhập thành công');

      // Sau khi đăng nhập chuyển về trang chủ
      setTimeout(() => navigate('/'), 800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleResponse = async (response: any) => {
    if (!response?.credential) {
      setGoogleError('Không lấy được credential từ Google.');
      return;
    }

    try {
      setIsLoading(true);
      const idToken = response.credential;
      const auth = await authService.loginWithGoogle(idToken);

      apiClient.setTokens(auth.accessToken, auth.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(auth.user));
      localStorage.setItem('accessToken', auth.accessToken);
      if (auth.refreshToken) localStorage.setItem('refreshToken', auth.refreshToken);

      window.dispatchEvent(new Event('authChanged'));
      setSuccessMsg('Đăng nhập bằng Google thành công');

      // Sau khi đăng nhập bằng Google chuyển về trang chủ
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      console.error('Google login error:', err);
      setGoogleError(err?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12 items-start">
          {/* Left side */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-black">
              MEDIX - HỆ THỐNG Y TẾ<br />THÔNG MINH TÍCH HỢP AI
            </h1>
            <p className="text-gray-700">
              Chào mừng bạn đã quay trở lại, hãy đăng nhập vào tài khoản y tế của bạn
            </p>
            <p className="text-gray-600">
              Bạn chưa có tài khoản? <Link to="/register" className="text-[#0A66C2] font-medium hover:underline">Đăng ký ngay</Link>
            </p>
          </div>

          {/* Right side */}
          <Card className="w-full p-6 shadow-[0_1px_0_#e6e9f0]">
            <h2 className="text-2xl font-semibold mb-4">Đăng nhập</h2>

            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
            {googleError && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{googleError}</div>}
            {successMsg && <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm mb-1">Email</label>
                <Input id="email" type="email" placeholder="Email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm mb-1">Mật khẩu</label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Ghi nhớ đăng nhập
                </label>
                <Link to="/forgot-password" className="text-sm text-[#0A66C2] hover:underline">Quên mật khẩu?</Link>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Hoặc</span></div>
              </div>
              <div id="googleSignInDiv" className="flex justify-center"></div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
