import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './Header.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    return raw ? JSON.parse(raw) : null;
  });

  // Lắng nghe sự kiện thay đổi đăng nhập/đăng xuất
  useEffect(() => {
    const handleAuthChanged = () => {
      const raw = localStorage.getItem('currentUser');
      setCurrentUser(raw ? JSON.parse(raw) : null);
    };

    window.addEventListener('authChanged', handleAuthChanged);
    window.addEventListener('storage', handleAuthChanged);

    return () => {
      window.removeEventListener('authChanged', handleAuthChanged);
      window.removeEventListener('storage', handleAuthChanged);
    };
  }, []);

  // Đăng xuất
  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      localStorage.removeItem('rememberEmail');

      window.dispatchEvent(new Event('authChanged'));
      setCurrentUser(null);
      navigate('/');
    }
  };

  const handleLogoClick = () => navigate('/');

  return (
    <header className="medix-header">
      <div className="medix-header-inner">
        {/* Logo */}
        <div className="medix-logo" onClick={handleLogoClick}>
          <div className="medix-logo-title">MEDIX</div>
          <div className="medix-logo-sub">HỆ THỐNG Y TẾ THÔNG MINH ỨNG DỤNG AI</div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="medix-search">
          <div className="search-pill">
            <input
              className="search-input"
              placeholder="Chuyên khoa, Triệu chứng, Tên bác sĩ"
            />
            <button className="search-icon" aria-label="search">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Khu vực tài khoản / hành động */}
        <div className="medix-actions">
          {currentUser ? (
            <>
              <div className="avatar" title={currentUser.fullName || currentUser.email}>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.59 21C19.79 18.88 17.98 17.25 15.75 16.5C13.52 15.75 10.48 15.75 8.25 16.5C6.02 17.25 4.21 18.88 3.41 21"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="user-info">
                {currentUser.fullName || currentUser.email}
              </span>
              <span className="user-role">{currentUser.role || 'USER'}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Đăng Xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">
                Đăng nhập
              </Link>
              <Link to="/register" className="register-btn">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
