import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

const AuthStatus: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      navigate('/');
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      navigate('/');
    }
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      apiClient.clearTokens();
    } finally {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userData');
      localStorage.removeItem('rememberEmail');
      window.dispatchEvent(new Event('authChanged'));
      navigate('/');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full p-6 border rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Xin chào, {user.fullName}</h2>
        <p className="mb-4">Role: <strong>{user.role}</strong></p>
        <div className="flex gap-3">
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Đăng xuất
          </Button>
          <Button onClick={() => navigate('/')} variant="secondary">
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthStatus;
