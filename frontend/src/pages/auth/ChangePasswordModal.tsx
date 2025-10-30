import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/auth/ChangePasswordModal.module.css';
import { userService } from '../../services/userService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password validation functions
  const validatePassword = (password: string): string | null => {
    if (!password) return 'Mật khẩu không được để trống';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/(?=.*[a-z])/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (!/(?=.*[A-Z])/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/(?=.*\d)/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ số';
    if (!/(?=.*[@$!%*?&])/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
    return null;
  };

  const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return null;
  };

  // Password handlers
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordBlur = (field: string, value: string) => {
    let error = '';

    // Only validate confirm password on blur, new password validation is shown in requirements
    if (field === 'confirmPassword') {
      error = validatePasswordMatch(passwordData.newPassword, value) || '';
    }

    setPasswordErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.CurrentPassword = 'Mật khẩu hiện tại không được để trống';
    }

    // Check if new password meets requirements (but don't show error message)
    const newPasswordError = validatePassword(passwordData.newPassword);
    if (newPasswordError) {
      // Don't add to errors, just return early
      setError('Mật khẩu mới chưa đáp ứng yêu cầu. Vui lòng kiểm tra danh sách yêu cầu bên dưới.');
      return;
    }

    const confirmPasswordError = validatePasswordMatch(passwordData.newPassword, passwordData.confirmPassword);
    if (confirmPasswordError) {
      errors.ConfirmPassword = confirmPasswordError;
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setChangingPassword(true);
    showToast('Đang đổi mật khẩu...', 'info');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('currentPassword', passwordData.currentPassword);
      formData.append('newPassword', passwordData.confirmPassword);
      formData.append('confirmPassword', passwordData.confirmPassword);
      await userService.updatePassword(formData);

      showToast('Đổi mật khẩu thành công!', 'success');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      if (error.response?.status === 400 && Array.isArray(error.response.data)) {
        const errors: Record<string, string> = {};
        error.response.data.forEach((item: any) => {
          const field = item.memberNames?.[0];
          const message = item.errorMessage;
          if (field && message) {
            errors[field] = message;
          }
        });
        setPasswordErrors(errors);
      } else {
        console.error('Password update error: ', error);
        showToast('Không thể đổi mật khẩu', 'error');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClose = () => {
    onClose();
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setShowPasswords({ currentPassword: false, newPassword: false, confirmPassword: false });
    setError(null);
    setSuccess(null);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <i className="bi bi-key"></i>
            Đổi mật khẩu
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className={styles.modalCloseBtn}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorMessage}>
              <i className="bi bi-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              <i className="bi bi-check-circle"></i>
              {success}
            </div>
          )}

          <div className={styles.passwordFieldGroup}>
            <label className={`${styles.passwordFieldLabel} ${passwordErrors.CurrentPassword ? styles.fieldLabelError : ''}`}>
              <i className="bi bi-lock"></i>
              Mật khẩu hiện tại
              {passwordErrors.CurrentPassword && <span className={styles.errorIcon}>⚠️</span>}
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPasswords.currentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className={`${styles.passwordFieldInput} ${passwordErrors.CurrentPassword ? styles.fieldInputError : ''}`}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <i
                className={`bi ${showPasswords.currentPassword ? 'bi-eye' : 'bi-eye-slash'}`}
                onClick={() => togglePasswordVisibility('currentPassword')}
              ></i>
            </div>
            {passwordErrors.CurrentPassword && (
              <div className={styles.fieldError}>{passwordErrors.CurrentPassword}</div>
            )}
          </div>

          <div className={styles.passwordFieldGroup}>
            <label className={styles.passwordFieldLabel}>
              <i className="bi bi-key"></i>
              Mật khẩu mới
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPasswords.newPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={styles.passwordFieldInput}
                placeholder="Nhập mật khẩu mới"
              />
              <i
                className={`bi ${showPasswords.newPassword ? 'bi-eye' : 'bi-eye-slash'}`}
                onClick={() => togglePasswordVisibility('newPassword')}
              ></i>
            </div>
          </div>

          <div className={styles.passwordFieldGroup}>
            <label className={`${styles.passwordFieldLabel} ${passwordErrors.ConfirmPassword ? styles.fieldLabelError : ''}`}>
              <i className="bi bi-check-circle"></i>
              Xác nhận mật khẩu mới
              {passwordErrors.ConfirmPassword && <span className={styles.errorIcon}>⚠️</span>}
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPasswords.confirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                onBlur={(e) => handlePasswordBlur('confirmPassword', e.target.value)}
                className={`${styles.passwordFieldInput} ${passwordErrors.ConfirmPassword ? styles.fieldInputError : ''}`}
                placeholder="Nhập lại mật khẩu mới"
              />
              <i
                className={`bi ${showPasswords.confirmPassword ? 'bi-eye' : 'bi-eye-slash'}`}
                onClick={() => togglePasswordVisibility('confirmPassword')}
              ></i>
            </div>
            {passwordErrors.ConfirmPassword && (
              <div className={styles.fieldError}>{passwordErrors.ConfirmPassword}</div>
            )}
          </div>

          <div className={styles.passwordRequirements}>
            <h4>Yêu cầu mật khẩu:</h4>
            <ul>
              <li className={passwordData.newPassword.length >= 8 ? styles.requirementMet : ''}>
                <i className="bi bi-check-circle"></i>
                Ít nhất 8 ký tự
              </li>
              <li className={/(?=.*[a-z])/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                <i className="bi bi-check-circle"></i>
                Có chữ thường
              </li>
              <li className={/(?=.*[A-Z])/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                <i className="bi bi-check-circle"></i>
                Có chữ hoa
              </li>
              <li className={/(?=.*\d)/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                <i className="bi bi-check-circle"></i>
                Có chữ số
              </li>
              <li className={/(?=.*[@$!%*?&])/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                <i className="bi bi-check-circle"></i>
                Có ký tự đặc biệt
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={handleClose}
            className={styles.modalCancelBtn}
            disabled={changingPassword}
          >
            <i className="bi bi-x-circle"></i>
            Hủy
          </button>
          <button
            type="button"
            onClick={handleChangePassword}
            className={styles.modalConfirmBtn}
            disabled={changingPassword}
          >
            {changingPassword ? (
              <>
                <div className={styles.spinner}></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i>
                Đổi mật khẩu
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
