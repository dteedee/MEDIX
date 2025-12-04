import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/common.types';

interface PatientProfileCheckProps {
  children: React.ReactNode;
}

/**
 * Component kiểm tra xem patient đã hoàn thiện profile chưa.
 * Nếu isProfileCompleted = false, redirect đến trang hoàn thiện profile.
 */
export const PatientProfileCheck: React.FC<PatientProfileCheckProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Không làm gì khi đang loading
    if (isLoading) return;

    // Chỉ kiểm tra với user có role Patient
    if (user?.role === UserRole.PATIENT) {
      // Kiểm tra isProfileCompleted - chỉ redirect khi giá trị rõ ràng là false
      const isCompleted = user.isProfileCompleted;
      // Chỉ redirect nếu isProfileCompleted === false (không phải undefined, null, hoặc true)
      if (isCompleted === false && location.pathname !== '/complete-profile') {
        navigate('/complete-profile', { replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  // Hiển thị loading khi đang kiểm tra
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PatientProfileCheck;

