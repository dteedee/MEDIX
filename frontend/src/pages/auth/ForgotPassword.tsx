import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!authService.validateEmailFormat(email)) {
      setError('Địa chỉ email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-600/10 rounded-full">📧</div>
        </div>
        <h1 className="text-2xl font-semibold text-center mb-1">Quên mật khẩu?</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm mb-1">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@email.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600">Quay lại đăng nhập</Link>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
              Email đặt lại mật khẩu đã được gửi!
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                Chúng tôi đã gửi một email đến <strong className="text-gray-800">{email}</strong> với hướng dẫn đặt lại mật khẩu.
              </p>
              <p>Vui lòng kiểm tra hộp thư đến và thư mục spam nếu không thấy email.</p>
            </div>
            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSuccess(false); setEmail(''); }}
              >
                Gửi lại email
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600">Quay lại đăng nhập</Link>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;




