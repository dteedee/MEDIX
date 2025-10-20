import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!authService.validatePasswordComplexity(newPassword)) {
      setError('Mật khẩu mới không đáp ứng yêu cầu bảo mật');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setIsLoading(true);
    try {
      // Implement change password API
      await authService.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-center mb-1">Đổi mật khẩu</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Nhập mật khẩu hiện tại và mật khẩu mới của bạn</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}
          {success && (
            <div className="mb-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
              Đổi mật khẩu thành công! Mật khẩu của bạn đã được cập nhật.
            </div>
          )}
          <div>
            <label htmlFor="current-password" className="block text-sm mb-1">Mật khẩu hiện tại</label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm mb-1">Mật khẩu mới</label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm mb-1">Xác nhận mật khẩu mới</label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              disabled={isLoading}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600 mt-1">Mật khẩu không khớp</p>
            )}
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </Button>
          <div className="text-center text-sm">
            <Link to="/" className="text-blue-600 hover:underline">Quay lại trang chủ</Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChangePassword;




