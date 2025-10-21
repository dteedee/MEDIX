import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Load remembered email and password on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    const rememberedPassword = localStorage.getItem('rememberPassword');
    
    if (rememberedEmail) {
      setIdentifier(rememberedEmail);
      setRememberMe(true);
    }
    
    if (rememberedPassword) {
      setPassword(rememberedPassword);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('⚠️ Google Client ID chưa được cấu hình');
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      // Use AuthContext.login so it updates central auth state, saves currentUser
      await login({ email: identifier, password });

      // remember email and password
      if (rememberMe) {
        localStorage.setItem('rememberEmail', identifier);
        localStorage.setItem('rememberPassword', password);
      } else {
        localStorage.removeItem('rememberEmail');
        localStorage.removeItem('rememberPassword');
      }

      // Show success toast
      showToast('Đăng nhập thành công! Chào mừng bạn đến với MEDIX', 'success');
      
      // Redirect will be handled by PublicRoute when auth state updates
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.message || '';
      
      // If backend returned unauthorized -> show specific message
      if (status === 401 || message.includes('Email hoặc mật khẩu') || message.includes('Tên đăng nhập/Email hoặc mật khẩu') || message.toLowerCase().includes('unauthorized')) {
        showToast('Sai tên đăng nhập/email hoặc mật khẩu, vui lòng kiểm tra lại', 'error');
      } else {
        showToast(message || 'Đăng nhập thất bại', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleResponse = async (response: any) => {
    if (!response || !response.credential) {
      showToast('Không lấy được credential từ Google', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const idToken = response.credential;
      const auth = await authService.loginWithGoogle(idToken);
      
      // Store tokens and user data like AuthContext.login does
      apiClient.setTokens(auth.accessToken, auth.refreshToken);
      localStorage.setItem('userData', JSON.stringify(auth.user));
      localStorage.setItem('currentUser', JSON.stringify(auth.user));
      
      // Force trigger auth state update for Google login
      window.dispatchEvent(new Event('authChanged'));
      
      // Show success toast
      showToast('Đăng nhập Google thành công! Chào mừng bạn đến với MEDIX', 'success');
      
    } catch (err: any) {
      const message = err?.message || 'Đăng nhập Google thất bại';
      showToast(message, 'error');
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-sm mb-1">Tên đăng nhập hoặc Email</label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Tên đăng nhập hoặc Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm mb-1">Mật khẩu</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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