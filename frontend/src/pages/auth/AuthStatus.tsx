import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

const AuthStatus: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('currentUser');
    if (!raw) {
      // nếu không có user -> quay về homepage (chưa login)
      navigate('/');
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout errors, still clear local data
    } finally {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('rememberEmail');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      // apiClient.clearTokens() được gọi trong authService.logout() nếu có
      // notify others
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




