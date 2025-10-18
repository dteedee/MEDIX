import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
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

  const errorTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  // prevent showing login page when already logged in
  const [checkingAuth, setCheckingAuth] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const currentUser = localStorage.getItem('currentUser');
    if (token && currentUser) {
      // already logged in -> go to homepage (which should show logged-in UI)
      navigate('/');
      return;
    }
    setCheckingAuth(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          context: 'signin',
        });

        // render button if element exists
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
      // clear timers on unmount
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // auto-clear error after 5s
    if (!error) return;
    if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setError(null), 5000);
    return () => {
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
    };
  }, [error]);

  useEffect(() => {
    // auto-clear success after 5s
    if (!successMsg) return;
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    successTimerRef.current = window.setTimeout(() => setSuccessMsg(null), 5000);
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    };
  }, [successMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGoogleError(null);

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });

      // lưu tokens vào api client
      apiClient.setTokens(response.accessToken, response.refreshToken);

      // lưu thông tin user + tokens vào localStorage để header và kiểm tra auth dùng
      try {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
        if (response.expiresAt) localStorage.setItem('expiresAt', response.expiresAt);
      } catch {
        // ignore storage errors
      }

      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      // notify others (Header, other tabs)
      window.dispatchEvent(new Event('authChanged'));

      // show green success popup then navigate to welcome/home
      setSuccessMsg('Đăng nhập thành công');

      // delay nhỏ để người dùng thấy popup rồi chuyển đi
      setTimeout(() => navigate('/'), 800);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.message || '';
      // If backend returned unauthorized -> show specific message for 5s
      if (status === 401 || message.includes('Email hoặc mật khẩu') || message.toLowerCase().includes('unauthorized')) {
        setError('Sai gmail hoặc mật khẩu, vui lòng kiểm tra lại');
        // don't navigate away on failure
      } else {
        setError(message || 'Đăng nhập thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    if (!response || !response.credential) {
      setGoogleError('Không lấy được credential từ Google.');
      return;
    }

    try {
      setIsLoading(true);
      const idToken = response.credential;
      const auth = await authService.loginWithGoogle(idToken);
      apiClient.setTokens(auth.accessToken, auth.refreshToken);

      try {
        localStorage.setItem('currentUser', JSON.stringify(auth.user));
        localStorage.setItem('accessToken', auth.accessToken);
        if (auth.refreshToken) localStorage.setItem('refreshToken', auth.refreshToken);
        if (auth.expiresAt) localStorage.setItem('expiresAt', auth.expiresAt);
      } catch {}

      // notify header/other tabs
      window.dispatchEvent(new Event('authChanged'));

      setSuccessMsg('Đăng nhập bằng Google thành công');
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      console.error('Google login error:', err);
      setGoogleError(err?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    // tránh flash UI khi đang kiểm tra auth
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Body */}
      <main className="flex-1 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12 items-start">
          {/* Left content */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black">
              MEDIX - HỆ THỐNG Y TẾ<br />THÔNG MINH TÍCH HỢP AI
            </h1>
            <p className="text-gray-700">
              Chào mừng bạn đã quay trở lại, hãy đăng nhập vào tài khoản y tế của bạn
            </p>
            <p className="text-gray-600">
              Bạn chưa có tài khoản? <a href="/register" className="text-[#0A66C2] font-medium hover:underline">Đăng ký ngay</a>
            </p>
          </div>

          {/* Right form */}
          <Card className="w-full p-6 shadow-[0_1px_0_#e6e9f0]">
            <h2 className="text-2xl font-semibold mb-4">Đăng nhập</h2>

            {/* Error alert (red) */}
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2" role="alert">
                {error}
              </div>
            )}

            {/* Google error */}
            {googleError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2" role="alert">
                {googleError}
              </div>
            )}

            {/* Success popup (green) */}
            {successMsg && (
              <div className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded p-2" role="status">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm mb-1">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm mb-1">Mật khẩu</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? (
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
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Ghi nhớ đăng nhập
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