import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from '../../styles/auth/ChangePasswordModal.module.css';
import { userService } from '../../services/userService';
import { apiClient } from '../../lib/apiClient';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PasswordPolicy {
  minLength: number;
  maxLength?: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
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
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);

  useEffect(() => {
    const loadPolicy = async () => {
      if (!isOpen) return;
      setPolicyLoading(true);
      try {
        const [
          minLengthRes,
          requireUppercaseRes,
          requireLowercaseRes,
          requireDigitRes,
          requireSpecialRes,
        ] = await Promise.all([
          apiClient.get('/SystemConfiguration/PASSWORD_MIN_LENGTH'),
          apiClient.get('/SystemConfiguration/REQUIRE_UPPERCASE'),
          apiClient.get('/SystemConfiguration/REQUIRE_LOWERCASE'),
          apiClient.get('/SystemConfiguration/REQUIRE_DIGIT'),
          apiClient.get('/SystemConfiguration/REQUIRE_SPECIAL'),
        ]);

        setPolicy({
          minLength: parseInt(minLengthRes.data.configValue, 10) || 8,
          requireUppercase: requireUppercaseRes.data.configValue.toLowerCase() === 'true',
          requireLowercase: requireLowercaseRes.data.configValue.toLowerCase() === 'true',
          requireDigit: requireDigitRes.data.configValue.toLowerCase() === 'true',
          requireSpecial: requireSpecialRes.data.configValue.toLowerCase() === 'true',
        });
      } catch (err) {
        showToast("Không tải được chính sách mật khẩu, sẽ dùng chính sách mặc định.", "warning");
        setPolicy({ minLength: 8, requireUppercase: true, requireLowercase: true, requireDigit: true, requireSpecial: true });
      } finally {
        setPolicyLoading(false);
      }
    };

    loadPolicy();
  }, [isOpen, showToast]);

  const validatePassword = (password: string, currentPolicy: PasswordPolicy): string | null => {
    if (!password) return 'Mật khẩu không được để trống';
    if (currentPolicy.minLength > 0 && password.length < currentPolicy.minLength) {
      return `Mật khẩu phải có ít nhất ${currentPolicy.minLength} ký tự`;
    }
    if (currentPolicy.requireLowercase && !/(?=.*[a-z])/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (currentPolicy.requireUppercase && !/(?=.*[A-Z])/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (currentPolicy.requireDigit && !/(?=.*\d)/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ số';
    if (currentPolicy.requireSpecial && !/(?=.*[@$!%*?&])/.test(password)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt';
    return null;
  };

  const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return null;
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));

    const fieldKey = field.charAt(0).toUpperCase() + field.slice(1);
    if (passwordErrors[fieldKey]) {
      setPasswordErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }    

  };

  const handlePasswordBlur = (field: string, value: string) => {
    let error = '';

    if (field === 'confirmPassword') {
      error = validatePasswordMatch(passwordData.newPassword, value) || '';
    }

    setPasswordErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChangePassword = async () => {
    if (!policy) return;

    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.CurrentPassword = 'Mật khẩu hiện tại không được để trống';
    }

    const newPasswordError = validatePassword(passwordData.newPassword, policy);
    if (newPasswordError) {
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
      const payload = {
        CurrentPassword: passwordData.currentPassword,
        NewPassword: passwordData.newPassword,
        ConfirmPassword: passwordData.confirmPassword,
      };

      await userService.updatePassword(payload as any);

      showToast('Đổi mật khẩu thành công!', 'success');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      if (status === 400) {
        if (errorData && typeof errorData === 'object' && !Array.isArray(errorData)) {
          const serverErrors: Record<string, string> = {};
          if (errorData.errors) {
             for (const key in errorData.errors) {
                serverErrors[key] = errorData.errors[key][0];
             }
          } else if (errorData.CurrentPassword) {
             serverErrors.CurrentPassword = errorData.CurrentPassword[0];
          }
          setPasswordErrors(serverErrors);
        } else {
           setError(errorData?.message || 'Mật khẩu hiện tại không đúng.');
        }
      } else {
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
    setPolicy(null);
    setPolicyLoading(true);
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

          {policyLoading ? (
            <div className={styles.policyLoading}>Đang tải yêu cầu mật khẩu...</div>
          ) : policy && (
            <div className={styles.passwordRequirements}>
              <h4>Yêu cầu mật khẩu:</h4>
              <ul>
                {policy.minLength > 0 && (
                  <li className={passwordData.newPassword.length >= policy.minLength ? styles.requirementMet : ''}>
                    <i className="bi bi-check-circle"></i>
                    Ít nhất {policy.minLength} ký tự
                  </li>
                )}
                {policy.requireLowercase && (
                  <li className={/(?=.*[a-z])/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                    <i className="bi bi-check-circle"></i>
                    Có chữ thường
                  </li>
                )}
                {policy.requireUppercase && (
                  <li className={/(?=.*[A-Z])/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                    <i className="bi bi-check-circle"></i>
                    Có chữ hoa
                  </li>
                )}
                {policy.requireDigit && (
                  <li className={/(?=.*\d)/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                    <i className="bi bi-check-circle"></i>
                    Có chữ số
                  </li>
                )}
                {policy.requireSpecial && (
                  <li className={/(?=.*[@$!%*?&])/.test(passwordData.newPassword) ? styles.requirementMet : ''}>
                    <i className="bi bi-check-circle"></i>
                    Có ký tự đặc biệt
                  </li>
                )}
              </ul>
            </div>
          )}
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
