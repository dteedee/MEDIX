import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    return raw ? JSON.parse(raw) : null;
  });

  // Cập nhật user khi có sự kiện đăng nhập/đăng xuất
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

  // Xử lý đăng xuất
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

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
          {/* Logo */}
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Medix
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-10">
            {currentUser && (
              <>
                <Link to="/app/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/app/ai-chat" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  AI Chat
                </Link>
              </>
            )}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
            {currentUser ? (
              <>
                <span className="text-sm text-gray-700">
                  Xin chào, {currentUser.fullName || currentUser.email}
                </span>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {currentUser.role || 'USER'}
                </span>
                <button
                  onClick={handleLogout}
                  className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
