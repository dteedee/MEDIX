import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from '../../styles/auth/login.module.css';

const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);

  // Regex kiểm tra email hợp lệ
  const isValidEmail = (text: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text);

  // Parse lockout message để lấy thời gian còn lại
  const parseLockoutMessage = (message: string) => {
    const timeMatch = message.match(/Thời gian còn lại: (\d+) phút (\d+) giây/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      return { minutes, seconds };
    }
    return null;
  };

  // Countdown timer effect
  useEffect(() => {
    if (!lockoutTimeLeft) return;

    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (!prev) return null;
        
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          // Hết thời gian khóa
          setLockoutMessage('');
          return null;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  // Lấy thông tin ghi nhớ từ localStorage
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

  // Khởi tạo Google Sign-In
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

        const container = document.getElementById('googleSignInDiv');
        if (container) {
          google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 380,
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
  }, []);

  // Xử lý đăng nhập Google
  const handleGoogleResponse = async (response: any) => {
    if (!response || !response.credential) {
      showToast('Không lấy được credential từ Google', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const idToken = response.credential;
      const auth = await authService.loginWithGoogle(idToken);
      apiClient.setTokens(auth.accessToken, auth.refreshToken);
      localStorage.setItem('userData', JSON.stringify(auth.user));
      localStorage.setItem('currentUser', JSON.stringify(auth.user));
      window.dispatchEvent(new Event('authChanged'));
      
      if (auth.user.isTemporaryUsername) {
        showToast('Đăng nhập Google thành công! Vui lòng cập nhật tên đăng nhập trong trang profile để hoàn thiện tài khoản.', 'success');
      } else {
        showToast('Đăng nhập Google thành công! Chào mừng bạn đến với MEDIX.', 'success');
      }
    } catch (err: any) {
      const message = err?.message || 'Đăng nhập Google thất bại';
      
      if (message.includes('Tài khoản bị khóa vĩnh viễn')) {
        showToast('Tài khoản bị khóa vĩnh viễn, vui lòng liên hệ bộ phận hỗ trợ', 'error');
      } else if (message.includes('Tài khoản của bạn đã bị khóa trong')) {
        // Xử lý thông báo khóa tạm thời cho Google login
        setLockoutMessage(message);
        const timeLeft = parseLockoutMessage(message);
        if (timeLeft) {
          setLockoutTimeLeft(timeLeft);
        }
        showToast(message, 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Nếu còn lỗi, không cho gửi
    if (emailError || passwordError) {
      showToast('Vui lòng kiểm tra lại thông tin nhập', 'error');
      return;
    }

    if (!identifier) {
      showToast('Vui lòng nhập email hoặc tên đăng nhập', 'error');
      return;
    }

    if (identifier.includes('@') && !isValidEmail(identifier)) {
      showToast('Email không hợp lệ', 'error');
      return;
    }

    if (!password) {
      showToast('Vui lòng nhập mật khẩu', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: identifier, password });

      if (rememberMe) {
        localStorage.setItem('rememberEmail', identifier);
        localStorage.setItem('rememberPassword', password);
      } else {
        localStorage.removeItem('rememberEmail');
        localStorage.removeItem('rememberPassword');
      }

      showToast('Đăng nhập thành công! Chào mừng bạn đến với MEDIX', 'success');
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.message || '';
      
      if (
        status === 401 ||
        message.includes('Email hoặc mật khẩu') ||
        message.includes('Tên đăng nhập/Email hoặc mật khẩu') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        if (message.includes('Tài khoản bị khóa vĩnh viễn')) {
          showToast('Tài khoản bị khóa vĩnh viễn, vui lòng liên hệ bộ phận hỗ trợ', 'error');
        } else if (message.includes('Tài khoản của bạn đã bị khóa trong')) {
          // Xử lý thông báo khóa tạm thời
          setLockoutMessage(message);
          const timeLeft = parseLockoutMessage(message);
          if (timeLeft) {
            setLockoutTimeLeft(timeLeft);
          }
          showToast(message, 'error');
        } else {
          showToast('Sai tên đăng nhập/email hoặc mật khẩu, vui lòng kiểm tra lại', 'error');
        }
      } else {
        showToast(message || 'Đăng nhập thất bại', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["login-page"]}>
      {/* Background animation */}
      <div className={styles["bg-decoration"]}>
        <div className={styles["shape"]} style={{ top: '10%', left: '5%' }}></div>
        <div className={styles["shape"]} style={{ top: '60%', left: '10%' }}></div>
        <div className={styles["shape"]} style={{ top: '20%', right: '8%' }}></div>
        <div className={styles["shape"]} style={{ bottom: '15%', right: '5%' }}></div>
      </div>

      <div className={styles["login-container"]}>
        {/* Left side */}
        <div className={styles["brand-section"]}>
          <div className={styles["brand-content"]}>
            <div className={styles["brand-logo"]}>
              <img src="/images/medix-logo.png" alt="MEDIX" />
            </div>

            <h1 className={styles["brand-heading"]}>MEDIX</h1>
            <p className={styles["brand-tagline"]}>Hệ thống Y tế Thông minh Tích hợp AI</p>

            <div className={styles["brand-stats"]}>
              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>500+</div>
                <div className={styles["stat-label"]}>Bác sĩ</div>
              </div>
              <div className={styles["stat-divider"]}></div>
              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>95%</div>
                <div className={styles["stat-label"]}>Độ chính xác AI</div>
              </div>
              <div className={styles["stat-divider"]}></div>
              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]}>10k+</div>
                <div className={styles["stat-label"]}>Người dùng</div>
              </div>
            </div>

            <div className={styles["brand-features"]}>
              <div className={styles["brand-feature"]}>
                <i className="bi bi-check-circle-fill"></i>
                <span>Chẩn đoán AI thông minh</span>
              </div>
              <div className={styles["brand-feature"]}>
                <i className="bi bi-check-circle-fill"></i>
                <span>Đặt lịch nhanh chóng</span>
              </div>
              <div className={styles["brand-feature"]}>
                <i className="bi bi-check-circle-fill"></i>
                <span>Bảo mật tuyệt đối</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className={styles["form-section"]}>
          <div className={styles["form-container"]}>
            <div className={styles["form-header"]}>
              <h2>Đăng nhập</h2>
              <p>Chào mừng bạn trở lại!</p>
            </div>

            {/* Lockout Message */}
            {lockoutMessage && (
              <div className={styles["lockout-message"]}>
                <div className={styles["lockout-icon"]}>
                  <i className="bi bi-shield-exclamation"></i>
                </div>
                <div className={styles["lockout-content"]}>
                  <p className={styles["lockout-text"]}>
                    {lockoutMessage.split('. Hãy thử lại')[0]}.
                  </p>
                  {lockoutTimeLeft && (
                    <div className={styles["countdown-timer"]}>
                      <span className={styles["countdown-label"]}>Thời gian còn lại:</span>
                      <span className={styles["countdown-time"]}>
                        {lockoutTimeLeft.minutes.toString().padStart(2, '0')}:
                        {lockoutTimeLeft.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <p className={styles["lockout-help"]}>
                    Hãy thử lại sau khoảng thời gian này hoặc liên hệ hỗ trợ.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email / Username */}
              <div className={styles["input-group"]}>
                <label htmlFor="identifier">
                  <i className="bi bi-envelope"></i>
                  Email hoặc tên đăng nhập
                </label>
                <input
                  id="identifier"
                  type="text"
                  placeholder="Nhập email hoặc tên đăng nhập"
                  value={identifier}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIdentifier(value);

                    if (value.trim() === '') {
                      setEmailError('');
                      return;
                    }

                    if (value.includes('@')) {
                      if (!isValidEmail(value)) {
                        setEmailError('Email không hợp lệ');
                      } else {
                        setEmailError('');
                      }
                    } else if (value.length < 4) {
                      setEmailError('Tên đăng nhập quá ngắn');
                    } else {
                      setEmailError('');
                    }
                  }}
                  className={emailError ? styles['input-error'] : ''}
                />
                {emailError && (
                  <p style={{ color: 'red', fontSize: '13px', marginTop: '4px' }}>{emailError}</p>
                )}
              </div>

              {/* Password */}
              <div className={styles["input-group"]}>
                <label htmlFor="password">
                  <i className="bi bi-lock"></i>
                  Mật khẩu
                </label>
                <div className={styles["password-wrapper"]}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPassword(value);
                      if (value.length > 0 && value.length < 6) {
                        setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
                      } else {
                        setPasswordError('');
                      }
                    }}
                    className={passwordError ? styles['input-error'] : ''}
                  />
                  <button
                    type="button"
                    className={styles["password-toggle"]}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </button>
                </div>
                {passwordError && (
                  <p style={{ color: 'red', fontSize: '13px', marginTop: '4px' }}>{passwordError}</p>
                )}
              </div>

              {/* Remember + Forgot */}
              <div className={styles["form-extras"]}>
                <label className={styles["remember-me"]}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className={styles["forgot-password"]}>
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" className={styles["btn-login"]} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="bi bi-arrow-clockwise"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className={styles["divider"]}>
              <span>hoặc</span>
            </div>

            {/* Google Sign In */}
            <div id="googleSignInDiv" className={styles["google-btn-wrapper"]}></div>

            <div className={styles["signup-link"]}>
              Chưa có tài khoản? 
              <div className="dropdown">
                <a href="#" className={styles["btn-register"]} data-bs-toggle="dropdown" aria-expanded="false">
                  {t('header.register')}
                </a>
                <ul className={`dropdown-menu ${styles["register-dropdown"]}`}>
                  <li><a className="dropdown-item" href="/patient-register">{t('header.register.patient')}</a></li>
                  <li><a className="dropdown-item" href="/doctor/register">{t('header.register.doctor')}</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
