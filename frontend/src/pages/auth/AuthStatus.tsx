import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const AuthStatus: React.FC = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const status = params.get('status'); // success | failure
  const method = params.get('method'); // email | google
  const message = status === 'success' ? 'Đăng nhập thành công' : 'Đăng nhập thất bại';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className={`text-2xl font-semibold mb-2 ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message}</h1>
        <p className="text-sm text-gray-600 mb-6">Phương thức: {method ?? 'không xác định'}</p>
        <div className="space-y-3">
          <Link to="/">
            <Button className="w-full">Về trang chủ</Button>
          </Link>
          {status !== 'success' && (
            <Link to="/login">
              <Button className="w-full" variant="outline">Thử đăng nhập lại</Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthStatus;



