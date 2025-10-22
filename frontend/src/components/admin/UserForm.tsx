import React, { useState, useEffect } from 'react'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../../types/user.types'
import { userService } from '../../services/userService'
import { useToast } from '../../contexts/ToastContext'

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
    setLockoutEnabled(deriveLocked(user))
  }, [user])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ userName?: string, password?: string }>({})

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

  const validateOnBlur = (field: 'userName' | 'password', value: string) => {
    if (field === 'userName' && !value.trim()) {
      setErrors(prev => ({ ...prev, userName: 'Tên đăng nhập không được để trống.' }));
    }
    if (field === 'password') {
      const passwordError = validatePassword(value);
      // Chỉ cập nhật lỗi nếu có, không xóa lỗi của trường khác
      if (passwordError) setErrors(prev => ({ ...prev, password: passwordError }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditMode) {
      const newErrors: typeof errors = {};
      if (!userName.trim()) newErrors.userName = "Tên đăng nhập không được để trống.";
      const passwordError = validatePassword(password);
      if (passwordError) newErrors.password = passwordError;
      
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
          lockoutEnabled,
        }
  if (!lockoutEnabled) (payload as any).lockoutEnd = null
  console.debug('[UserForm] update payload', user.id, payload)
  const resp = await userService.update(user.id, payload)
  console.debug('[UserForm] update response', resp)
      } else {
        // Khi tạo mới, chỉ cần username và password
  const payload: CreateUserRequest = { userName, password, role }
  await userService.create(payload)
      }
      onSaved?.()
    } catch (error: any) {
      console.error('Lỗi khi lưu người dùng:', error);
      // Xử lý lỗi validation từ backend
      if (error.userName || error.password) {
        const backendErrors = { userName: error.userName, password: error.password }; // error.userName is now correctly formatted
        setErrors(prev => ({ ...prev, ...backendErrors }));
      } else {
        // Xử lý các lỗi chung khác
        const message = error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi không mong muốn.';
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
        // Giả định service có hàm này, bạn cần thêm nó vào userService.ts
        await (userService as any).sendResetPasswordEmail(user.id);
        showToast('Yêu cầu đặt lại mật khẩu đã được gửi thành công!', 'success');
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        showToast('Không thể gửi yêu cầu đặt lại mật khẩu.', 'error');
      }
    }
  };
  // --- CSS Styles --- (Updated for a cleaner look)
  const formContainerStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '28px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    display: 'block',
    fontWeight: 600,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  }

  const statusStyle = (locked: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 16,
    border: '1px solid',
    borderColor: locked ? '#fca5a5' : '#6ee7b7',
    background: locked ? '#fee2e2' : '#e7f9ec',
    color: locked ? '#991b1b' : '#065f46',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
    appearance: 'none',
  })

  const errorTextStyle: React.CSSProperties = {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
  }

  return (
    <form onSubmit={submit} style={formContainerStyle}>
      <div style={gridStyle}>
        {!isEditMode && (
          <>
            <div>
              <label style={labelStyle}>Tên đăng nhập (Username)</label>
              <input 
                value={userName} 
                onChange={e => { setUserName(e.target.value); if (errors.userName) setErrors(prev => ({ ...prev, userName: undefined })); }} 
                required 
                onBlur={e => validateOnBlur('userName', e.target.value)}
                style={{...inputStyle, borderColor: errors.userName ? '#ef4444' : '#d1d5db'}} 
              />
              {errors.userName && <div style={errorTextStyle}>{errors.userName}</div>}
            </div>
            <div>
              <label style={labelStyle}>Mật khẩu</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }} 
                required 
                onBlur={e => validateOnBlur('password', e.target.value)}
                style={{...inputStyle, borderColor: errors.password ? '#ef4444' : '#d1d5db'}} 
              />
              {errors.password && <div style={errorTextStyle}>{errors.password}</div>}
            </div>
            <div>
              <label style={labelStyle}>Vai trò</label>
              <select value={role} onChange={e => setRole(e.target.value)} required style={inputStyle}>
                <option value="PATIENT">Bệnh nhân</option>
                <option value="DOCTOR">Bác sĩ</option>
                <option value="MANAGER">Quản lý</option>
                <option value="ADMIN">Quản trị</option>
              </select>
            </div>
          </>
        )}
        {isEditMode && (
          <>
            <div>
              <label style={labelStyle}>Tên đăng nhập (Username)</label>
              <input value={userName} disabled style={{...inputStyle, background: '#f3f4f6'}} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} disabled style={{...inputStyle, background: '#f3f4f6'}} />
            </div>
            <div>
              <label style={labelStyle}>Họ và tên</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} disabled />
            </div>
            <div>
              <label style={labelStyle}>Số điện thoại</label>
              <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} disabled />
            </div>
            <div>
              <label style={labelStyle}>Ngày sinh</label>
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle} disabled />
            </div>
            <div>
              <label style={labelStyle}>Số CMND/CCCD</label>
              <input value={identificationNumber} onChange={e => setIdentificationNumber(e.target.value)} style={inputStyle} disabled />
            </div>
            <div>
              <label style={labelStyle}>Giới tính</label>
              <select value={genderCode} onChange={e => setGenderCode(e.target.value)} style={inputStyle} disabled>
                <option value="">-- Chọn giới tính --</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trạng thái tài khoản</label>
              <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                <select value={lockoutEnabled ? 'locked' : 'active'} onChange={e => setLockoutEnabled(e.target.value === 'locked')} style={{ ...inputStyle, width: 180, ...statusStyle(lockoutEnabled) }}>
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                </select>
                <span style={{ marginLeft: 12, color: '#6b7280' }}>{lockoutEnabled ? 'Tài khoản đang bị khóa' : 'Tài khoản hoạt động'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        {isEditMode && (
          <button type="button" onClick={handleResetPassword} style={{
            padding: '10px 20px',
            backgroundColor: '#f97316',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            marginRight: 'auto' // Đẩy nút này sang trái
          }}>Đặt lại mật khẩu</button>
        )}
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px',
          backgroundColor: '#fff',
          color: '#374151',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}>
          Hủy
        </button>
        <button type="submit" disabled={saving} style={{
          padding: '10px 20px',
          backgroundColor: saving ? '#9ca3af' : '#2563eb',
          color: '#fff',
          borderRadius: 8,
          border: 'none',
          fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          transition: 'background-color 0.2s',
        }}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}
