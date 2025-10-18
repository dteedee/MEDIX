import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const handleAuthChanged = () => {
      const raw = localStorage.getItem('currentUser');
      setCurrentUser(raw ? JSON.parse(raw) : null);
    };

    // custom event from login/logout flows
    window.addEventListener('authChanged', handleAuthChanged);
    // storage event for cross-tab updates
    window.addEventListener('storage', handleAuthChanged);

    return () => {
      window.removeEventListener('authChanged', handleAuthChanged);
      window.removeEventListener('storage', handleAuthChanged);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      // clear all local auth data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      localStorage.removeItem('rememberEmail');

      // notify other parts of app (and tabs)
      window.dispatchEvent(new Event('authChanged'));

      setCurrentUser(null);
      navigate('/');
    }
  };

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <Link to="/" className="font-bold text-lg">MEDIX</Link>
        </div>

        <nav className="flex items-center gap-4">
          {currentUser ? (
            <>
              <span className="text-sm">Xin chào, {currentUser.fullName}</span>
              <button onClick={handleLogout} className="text-sm text-red-600">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-[#0A66C2]">Đăng nhập</Link>
              <Link to="/register" className="text-sm text-[#0A66C2]">Đăng ký</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;