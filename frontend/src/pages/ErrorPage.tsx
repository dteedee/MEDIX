import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  code: number;
  message?: string;
}

const defaultMessages: Record<number, string> = {
  401: 'Không được phép. Vui lòng đăng nhập.',
  403: 'Bị từ chối. Bạn không có quyền truy cập trang này.',
  404: 'Không tìm thấy trang.',
  500: 'Lỗi máy chủ nội bộ.',
};

const ErrorPage: React.FC<ErrorPageProps> = ({ code, message }) => {
  const navigate = useNavigate();
  const displayMessage = message || defaultMessages[code] || 'Đã xảy ra lỗi.';

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center">
      <h1 className="display-1">{code}</h1>
      <p className="lead">{displayMessage}</p>
      <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
        Về trang chủ
      </button>
    </div>
  );
};

export default ErrorPage;
