import React, { useState, useEffect } from 'react'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../../types/user.types'
import { userAdminService } from '../../services/userService'
import { useToast } from '../../contexts/ToastContext'

import styles from '../../styles/UserForm.module.css';
interface Props {
  user?: UserDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function UserForm({ user, onSaved, onCancel }: Props) {
  const { showToast } = useToast()
  const isEditMode = !!user;

  const [userName, setUserName] = useState(user?.userName ?? '')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '')
  const [dateOfBirth, setDateOfBirth] = useState<string>((user as any)?.dateOfBirth?.split('T')[0] ?? '')
  const [identificationNumber, setIdentificationNumber] = useState<string>(user?.identificationNumber ?? '')
  const [genderCode, setGenderCode] = useState<string>(user?.genderCode ?? '')
  const [role, setRole] = useState(user?.role ?? 'PATIENT')
  const [createdAt, setCreatedAt] = useState(user?.createdAt ?? '');
  const [updatedAt, setUpdatedAt] = useState(user?.updatedAt ?? '');
  const [emailConfirmed, setEmailConfirmed] = useState(user?.emailConfirmed ?? false);
  const [accessFailedCount, setAccessFailedCount] = useState(user?.accessFailedCount ?? 0);
  const deriveLocked = (u?: UserDTO) => {
    if (!u) return false
    if (u.lockoutEnabled === true) return true
    const any = u as any
    const lockoutEndVal = any.lockoutEnd ?? any.lockout_end ?? any.lockEnd ?? any.lockedUntil
    if (lockoutEndVal) {
      try {
        const maybeNum = Number(lockoutEndVal as any)
        let ts = NaN as number
        if (!isNaN(maybeNum)) {
          ts = maybeNum < 1e12 ? maybeNum * 1000 : maybeNum
        } else {
          ts = Date.parse(lockoutEndVal as any)
        }
        if (!isNaN(ts)) return ts > Date.now()
        return true
      } catch {
        return true
      }
    }
    return false
  }
  const [lockoutEnabled, setLockoutEnabled] = useState<boolean>(deriveLocked(user))
  // Keep internal state in sync when `user` prop changes (e.g., when fetched async)
  useEffect(() => {
    setUserName(user?.userName ?? '')
    setFullName(user?.fullName ?? '')
    setEmail(user?.email ?? '')
    setPhoneNumber(user?.phoneNumber ?? '')
    setDateOfBirth((user as any)?.dateOfBirth?.split('T')[0] ?? '')
    setIdentificationNumber(user?.identificationNumber ?? '')
    setGenderCode(user?.genderCode ?? '')
    setRole(user?.role ?? 'PATIENT')
    setCreatedAt(user?.createdAt ?? '');
    setUpdatedAt(user?.updatedAt ?? '');
    setEmailConfirmed(user?.emailConfirmed ?? false);
    setAccessFailedCount(user?.accessFailedCount ?? 0);
    setLockoutEnabled(deriveLocked(user))
  }, [user])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ userName?: string, email?: string, password?: string }>({})

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Mật khẩu không được để trống.";
    }
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!regex.test(password)) {
      return "Mật khẩu phải dài ít nhất 6 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt.";
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email không được để trống.";
    }
    // Basic email regex
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return "Email không hợp lệ.";
    }
    return undefined;
  };

  const validateOnBlur = (field: 'userName' | 'email' | 'password', value: string) => {
    if (field === 'userName' && !value.trim()) {
      setErrors(prev => ({ ...prev, userName: 'Tên đăng nhập không được để trống.' }));
    }
    if (field === 'email') {
      const emailError = validateEmail(value);
      if (emailError) setErrors(prev => ({ ...prev, email: emailError }));
      else setErrors(prev => ({ ...prev, email: undefined })); // Clear error if valid
    }
    // Password validation is only relevant if the field is present (not for new user creation anymore)
    // if (field === 'password' && !isEditMode) { // This condition ensures it's not called for new user creation
    //   const passwordError = validatePassword(value);
    //   if (passwordError) setErrors(prev => ({ ...prev, password: passwordError }));
    //   else setErrors(prev => ({ ...prev, password: undefined }));
    // }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditMode) {
      const newErrors: typeof errors = {};
      if (!userName.trim()) newErrors.userName = "Tên đăng nhập không được để trống.";
      const emailError = validateEmail(email);
      if (emailError) newErrors.email = emailError;
      // Password is no longer required for new user creation from this form
      
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        return;
      }
    }

    setSaving(true)
    try {
      if (isEditMode && user) {
        // Khi chỉnh sửa, chỉ gửi những trường được phép thay đổi: role và lockoutEnabled
        const payload: UpdateUserRequest = {
          role,
          lockoutEnabled: lockoutEnabled,
        }
  if (!lockoutEnabled) (payload as any).lockoutEnd = null
  console.debug('[UserForm] update payload', user.id, payload)
  const resp = await userAdminService.update(user.id, payload)
  console.debug('[UserForm] update response', resp)
      } else { // When creating new user
        // Assuming CreateUserRequest type is updated to accept email and not password directly
        const payload: CreateUserRequest = { userName, email, role } // Changed payload
        await userAdminService.create(payload)
      }
      onSaved?.()
    } catch (error: any) {
      // Xử lý lỗi từ server
      console.error('Lỗi khi lưu người dùng:', error);
      const serverErrors = error?.response?.data?.errors;
      if (serverErrors) {
        const newErrors: { userName?: string; email?: string; password?: string } = {};
        // Backend có thể trả về lỗi với key là 'UserName' hoặc 'userName'
        if (serverErrors.UserName || serverErrors.userName) newErrors.userName = (serverErrors.UserName || serverErrors.userName)[0];
        if (serverErrors.Password || serverErrors.password) newErrors.password = (serverErrors.Password || serverErrors.password)[0];
        if (serverErrors.Email || serverErrors.email) newErrors.email = (serverErrors.Email || serverErrors.email)[0]; // Handle email server error
        setErrors(newErrors); // Update errors state with server errors
        showToast('Vui lòng kiểm tra lại thông tin đã nhập.', 'error');
      } else {
        // Xử lý các lỗi chung khác
        const message = error?.response?.data?.message || error?.message || 'Tạo người dùng thất bại. Vui lòng thử lại.';
        showToast(message, 'error');
      }
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.id) return;

    if (confirm(`Bạn có chắc muốn gửi email đặt lại mật khẩu cho người dùng "${user.fullName || user.email}" không?`)) {
      try {
        // Giả định service có hàm này, bạn cần thêm nó vào userAdminService.ts
        await (userAdminService as any).sendResetPasswordEmail(user.id);
        showToast('Yêu cầu đặt lại mật khẩu đã được gửi thành công!', 'success');
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        showToast('Không thể gửi yêu cầu đặt lại mật khẩu.', 'error');
      }
    }
  };

  return (
    <form onSubmit={submit} className={styles.formContainer}>
      <div className={styles.grid}>
        {!isEditMode && (
          <>
            <div>
              <label className={styles.label}>Tên đăng nhập (Username)</label>
              <input 
                value={userName} 
                onChange={e => { setUserName(e.target.value); if (errors.userName) setErrors(prev => ({ ...prev, userName: undefined })); }} 
                required 
                onBlur={e => validateOnBlur('userName', e.target.value)}
                className={`${styles.input} ${errors.userName ? styles.inputError : ''}`}
              />
              {errors.userName && <div className={styles.errorText}>{errors.userName}</div>}
            </div>
            <div>
              <label className={styles.label}>Email</label> {/* Changed from Password to Email */}
              <input 
                type="email" // Set type to email for better UX and validation
                value={email} 
                onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }} 
                required 
                onBlur={e => validateOnBlur('email', e.target.value)} // Validate email on blur
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              />
              {errors.email && <div className={styles.errorText}>{errors.email}</div>}
            </div>
          </>
        )}
        {isEditMode && (
          <>
            <div>
              <label className={styles.label}>Tên đăng nhập (Username)</label>
              <input value={userName} disabled className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Email</label>
              <input type="email" value={email} disabled className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Họ và tên</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required className={styles.input} disabled />
            </div>
            <div>
              <label className={styles.label}>Số điện thoại</label>
              <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={styles.input} disabled />
            </div>
            <div>
              <label className={styles.label}>Ngày sinh</label>
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={styles.input} disabled />
            </div>
            <div>
              <label className={styles.label}>Số CMND/CCCD</label>
              <input value={identificationNumber} onChange={e => setIdentificationNumber(e.target.value)} className={styles.input} disabled />
            </div>
            <div>
              <label className={styles.label}>Giới tính</label>
              <input
                value={
                  genderCode === 'MALE' ? 'Nam' :
                  genderCode === 'FEMALE' ? 'Nữ' :
                  genderCode === 'OTHER' ? 'Khác' : ''
                }
                disabled
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Trạng thái tài khoản</label>
              <div className={styles.statusContainer}>
                <select 
                  value={lockoutEnabled ? '1' : '0'} 
                  onChange={e => setLockoutEnabled(e.target.value === '1')} 
                  className={`${styles.statusSelect} ${lockoutEnabled ? styles.statusLocked : styles.statusActive}`}
                >
                  <option value="0">Hoạt động</option>
                  <option value="1">Đang khóa</option>
                </select>
                <span className={styles.statusLabel}>{lockoutEnabled ? 'Tài khoản đang bị khóa' : 'Tài khoản hoạt động'}</span>
              </div>
            </div>
            <div>
              <label className={styles.label}>Vai trò</label>
              <select value={role} onChange={e => setRole(e.target.value)} className={styles.select}>
                {/* <option value="ADMIN">Quản trị</option> */}
                <option value="MANAGER">Quản lý</option>
                <option value="DOCTOR">Bác sĩ</option>
                <option value="PATIENT">Bệnh nhân</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Email đã xác thực</label>
              <input value={emailConfirmed ? 'Đã xác thực' : 'Chưa xác thực'} disabled className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Số lần đăng nhập sai</label>
              <input type="number" value={accessFailedCount} disabled className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Ngày tạo tài khoản</label>
              <input value={createdAt ? new Date(createdAt).toLocaleString('vi-VN') : ''} disabled className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Cập nhật lần cuối</label>
              <input value={updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : ''} disabled className={styles.input} />
            </div>
          </>
        )}
      </div>

      <div className={styles.actionsContainer}>
        {isEditMode && (
          <button type="button" onClick={handleResetPassword} className={`${styles.button} ${styles.buttonDanger}`}>Đặt lại mật khẩu</button>
        )}
        <button type="button" onClick={onCancel} className={`${styles.button} ${styles.buttonSecondary}`}>
          Hủy
        </button>
        <button type="submit" disabled={saving} className={`${styles.button} ${styles.buttonPrimary}`}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}