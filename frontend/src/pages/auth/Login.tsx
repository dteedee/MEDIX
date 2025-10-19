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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const errorTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

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
      const response = await authService.login({ email: identifier, password });
      apiClient.setTokens(response.accessToken, response.refreshToken);
      if (rememberMe) {
        localStorage.setItem('rememberEmail', identifier);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      // show green success popup then navigate
      setSuccessMsg('Đăng nhập thành công');
      // navigate after short delay so user sees popup
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.message || '';
      // If backend returned unauthorized -> show specific message for 5s
      if (status === 401 || message.includes('Email hoặc mật khẩu') || message.includes('Tên đăng nhập/Email hoặc mật khẩu') || message.toLowerCase().includes('unauthorized')) {
        setError('Sai tên đăng nhập/email hoặc mật khẩu, vui lòng kiểm tra lại');
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

      setSuccessMsg('Đăng nhập bằng Google thành công');
      setTimeout(() => navigate('/'), 1200);
    } catch (err: any) {
      console.error('Google login error:', err);
      setGoogleError(err?.message || 'Đăng nhập Google thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

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
                <label htmlFor="identifier" className="block text-sm mb-1">Tên đăng nhập hoặc Email</label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Tên đăng nhập hoặc Email@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm mb-1">Mật khẩu</label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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