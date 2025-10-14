import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Medix
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-10">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/ai-chat" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  AI Chat
                </Link>
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-700">
                  Xin chào, {user?.fullName}
                </span>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {user?.role}
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