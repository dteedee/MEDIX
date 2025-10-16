import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword: React.FC = () => {
  const query = useQuery();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = query.get('token');
    if (t) setToken(t);
    const e = query.get('email');
    if (e) setEmail(e);
    else setError('Liên kết đặt lại mật khẩu không hợp lệ');
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ');
      return;
    }
    if (!email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!authService.validatePasswordComplexity(password)) {
      setError('Mật khẩu không đáp ứng yêu cầu bảo mật');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({ token, email, password, confirmPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra. Liên kết có thể đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-center mb-1">Đặt lại mật khẩu</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Nhập mật khẩu mới cho tài khoản của bạn</p>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
            )}
            <div>
              <label htmlFor="new-password" className="block text-sm mb-1">Mật khẩu mới</label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                disabled={isLoading || !token}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm mb-1">Xác nhận mật khẩu</label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                disabled={isLoading || !token}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Mật khẩu không khớp</p>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !token} className="w-full">
              {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:underline">Quay lại đăng nhập</Link>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
              Mật khẩu đã được đặt lại thành công!
            </div>
            <p className="text-sm text-gray-600 text-center">Bạn có thể đăng nhập với mật khẩu mới của mình.</p>
            <div>
              <Link to="/login" className="block w-full">
                <Button className="w-full">Đăng nhập ngay</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;




