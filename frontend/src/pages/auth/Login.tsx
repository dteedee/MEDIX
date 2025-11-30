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

  const isValidEmail = (text: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text);

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
          
          const updateGoogleButtonText = () => {
            const googleButton = container.querySelector('div[role="button"]');
            if (googleButton) {
              const spans = googleButton.querySelectorAll('span');
              spans.forEach((span) => {
                const text = span.textContent || '';
                if (text.includes('Sign in with Google') || text.includes('Sign in')) {
                  span.textContent = 'Đăng nhập với Google';
                  span.style.fontFamily = "'Be Vietnam Pro', sans-serif";
                }
              });
            }
          };
          
          setTimeout(updateGoogleButtonText, 100);
          setTimeout(updateGoogleButtonText, 300);
          setTimeout(updateGoogleButtonText, 500);
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    if (!response || !response.credential) {
      showToast('Không lấy được credential từ Google', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const idToken = response.credential;
      const auth = await authService.loginWithGoogle(idToken);
      apiClient.setTokens(auth.accessToken, auth.refreshToken, auth.expiresAt);
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
      
      if (message.includes('Tài khoản bị khóa')) {
        showToast('Tài khoản bị khóa, vui lòng liên hệ bộ phận hỗ trợ', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        if (message.includes('Tài khoản bị khóa')) {
          showToast('Tài khoản bị khóa, vui lòng liên hệ bộ phận hỗ trợ', 'error');
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
      <div className={styles["bg-decoration"]}>
        <div className={styles["shape"]} style={{ top: '10%', left: '5%' }}></div>
        <div className={styles["shape"]} style={{ top: '60%', left: '10%' }}></div>
        <div className={styles["shape"]} style={{ top: '20%', right: '8%' }}></div>
        <div className={styles["shape"]} style={{ bottom: '15%', right: '5%' }}></div>
      </div>

      <div className={styles["login-container"]}>
        <div className={styles["brand-section"]}>
          <div className={styles["brand-content"]}>
            <Link to="/" className={styles["brand-logo"]} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/images/medix-logo.png" 
                alt="MEDIX" 
                style={{ 
                  display: 'block',
                  width: '85%',
                  height: '85%',
                  objectFit: 'contain',
                  visibility: 'visible',
                  opacity: 1
                }}
              />
            </Link>

            <Link to="/" className={styles["brand-heading-link"]}>
              <h1 className={styles["brand-heading"]}>MEDIX</h1>
            </Link>
            <p className={styles["brand-tagline"]}>Hệ thống Y tế Thông minh Tích hợp AI</p>

            <div className={styles["brand-stats"]}>
              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]} data-count="500">500+</div>
                <div className={styles["stat-label"]}>Bác sĩ</div>
              </div>
              <div className={styles["stat-divider"]}></div>
              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]} data-count="95">95%</div>
                <div className={styles["stat-label"]}>Độ chính xác AI</div>
              </div>
              <div className={styles["stat-divider"]}></div>
              <div className={styles["stat-item"]}>
                <div className={styles["stat-number"]} data-count="10">10k+</div>
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

        <div className={styles["form-section"]}>
          <div className={styles["form-container"]}>
            <div className={styles["form-header"]}>
              <h2>Đăng nhập</h2>
              <p>Chào mừng bạn trở lại!</p>
            </div>
            <form onSubmit={handleSubmit}>
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

            <div className={styles["divider"]}>
              <span>hoặc</span>
            </div>

            <div className={styles["google-signin-container"]}>
              <div id="googleSignInDiv" className={styles["google-btn-wrapper"]}></div>
            </div>

            <div className={styles["signup-section"]}>
              <p className={styles["signup-text"]}>Chưa có tài khoản?</p>
              <div className={styles["register-buttons"]}>
                <a href="/doctor/register" className={styles["btn-register-doctor"]}>
                  <i className="bi bi-heart-pulse-fill"></i>
                  <span>Đăng ký bác sĩ</span>
                </a>
                <a href="/patient-register" className={styles["btn-register-patient"]}>
                  <i className="bi bi-person-plus-fill"></i>
                  <span>Đăng ký bệnh nhân</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
