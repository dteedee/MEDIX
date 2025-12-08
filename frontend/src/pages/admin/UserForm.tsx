import React, { useState, useEffect } from 'react'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../../types/user.types'
import { userAdminService } from '../../services/userService'
import { useToast } from '../../contexts/ToastContext'

import styles from '../../styles/admin/UserForm.module.css';

interface Props {
  user?: UserDTO
  onSaved?: (data?: any) => void
  onCancel?: () => void
}

interface Role {
  code: string;
  displayName: string;
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
  const [role, setRole] = useState(user?.role ?? 'Manager') 
  const [createdAt, setCreatedAt] = useState(user?.createdAt ?? '');
  const [updatedAt, setUpdatedAt] = useState(user?.updatedAt ?? '');
  const [emailConfirmed, setEmailConfirmed] = useState(user?.emailConfirmed ?? false);
  const [accessFailedCount, setAccessFailedCount] = useState(user?.accessFailedCount ?? 0);
  
  const [rolesList, setRolesList] = useState<Role[]>([]);
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

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await userAdminService.getRoles();
        if (isEditMode) {
          setRolesList(roles.filter(r => r.code.toUpperCase() !== 'ADMIN'));
        } else {
          setRolesList(roles);
        }
      } catch (error) {
        showToast('Không thể tải danh sách vai trò.', 'error');
      }
    };
    fetchRoles();
  }, [isEditMode, showToast]);
  
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

  const validateUsername = (username: string): string | undefined => {
    if (!username.trim()) {
      return "Tên đăng nhập không được để trống.";
    }
    
    if (username.length > 20) {
      return "Tên đăng nhập không được vượt quá 20 ký tự.";
    }
    
    if (username.length < 6) {
      return "Tên đăng nhập phải có ít nhất 6 ký tự.";
    }
    
    const validCharsRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validCharsRegex.test(username)) {
      return "Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới (_) và dấu gạch ngang (-).";
    }
    
    if (username.startsWith('-') || username.startsWith('_') || 
        username.endsWith('-') || username.endsWith('_')) {
      return "Tên đăng nhập không được bắt đầu hoặc kết thúc bằng dấu gạch.";
    }
    
    if (username.includes('--') || username.includes('__') || username.includes('-_') || username.includes('_-')) {
      return "Tên đăng nhập không được có dấu gạch liên tiếp.";
    }
    
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email không được để trống.";
    }
    
    const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    if (vietnameseRegex.test(email)) {
      return "Email không được chứa dấu tiếng Việt (ả, á, à, ạ, ...).";
    }
    
    const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailRegex.test(email)) {
      return "Email không đúng định dạng.";
    }
    
    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      return "Phần trước @ không được vượt quá 64 ký tự.";
    }
    
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return "Phần trước @ không được bắt đầu hoặc kết thúc bằng dấu chấm.";
    }
    
    if (localPart.includes('..')) {
      return "Phần trước @ không được có dấu chấm liên tiếp.";
    }
    
    const domainPart = email.split('@')[1];
    if (domainPart.length > 253) {
      return "Phần domain không được vượt quá 253 ký tự.";
    }
    
    const tldPart = domainPart.split('.').pop();
    if (!tldPart || tldPart.length < 2) {
      return "Phần sau dấu chấm cuối phải có ít nhất 2 ký tự.";
    }
    
    if (tldPart.length > 63) {
      return "Phần sau dấu chấm cuối không được vượt quá 63 ký tự.";
    }
    
    const domainRegex = /^[a-zA-Z0-9.-]+$/;
    if (!domainRegex.test(domainPart)) {
      return "Domain chỉ được chứa chữ cái, số, dấu chấm và dấu gạch ngang.";
    }
    
    if (domainPart.startsWith('-') || domainPart.endsWith('-')) {
      return "Domain không được bắt đầu hoặc kết thúc bằng dấu gạch ngang.";
    }
    
    if (domainPart.includes('..')) {
      return "Domain không được có dấu chấm liên tiếp.";
    }
    
    return undefined;
  };

  const validateOnBlur = (field: 'userName' | 'email' | 'password', value: string) => {
    if (field === 'userName') {
      const usernameError = validateUsername(value);
      if (usernameError) {
        setErrors(prev => ({ ...prev, userName: usernameError }));
      } else {
        setErrors(prev => ({ ...prev, userName: undefined })); 
      }
    }
    if (field === 'email') {
      const emailError = validateEmail(value);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      } else {
        setErrors(prev => ({ ...prev, email: undefined })); 
      }
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditMode) {
      const newErrors: typeof errors = {};
      
      const usernameError = validateUsername(userName);
      if (usernameError) {
        newErrors.userName = usernameError;
      }
      
      const emailError = validateEmail(email);
      if (emailError) {
        newErrors.email = emailError;
      }
      
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        return;
      }
    }

    setSaving(true)
    try {
      if (isEditMode && user) {
        showToast('Đang cập nhật thông tin người dùng...', 'info')
        const payload: UpdateUserRequest = {
          fullName: user.fullName ?? '',
          phoneNumber: user.phoneNumber ?? undefined,
          address: user.address ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
          dateOfBirth: user.dateOfBirth ?? undefined,
          genderCode: user.genderCode ?? undefined,
          identificationNumber: user.identificationNumber ?? undefined,
          emailConfirmed: user.emailConfirmed ?? false,
          isProfileCompleted: (user as any).isProfileCompleted ?? false,
          accessFailedCount: user.accessFailedCount ?? 0,
          role,
          lockoutEnabled,
        }
        if (!lockoutEnabled) (payload as any).lockoutEnd = null
        const resp = await userAdminService.update(user.id, payload)
        showToast('Cập nhật thông tin người dùng thành công!', 'success')
        onSaved?.(payload)
      } else { 
        showToast('Đang tạo quản lý mới...', 'info')
        const payload: CreateUserRequest = { userName, email, role: 'Manager' } 
        await userAdminService.create(payload)
        showToast('Tạo quản lý mới thành công!', 'success')
        onSaved?.(payload)
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message;
      const serverErrors = error?.response?.data?.errors;

      if (serverErrors) {
        const newErrors: { userName?: string; email?: string; password?: string } = {};
        if (serverErrors.UserName || serverErrors.userName) newErrors.userName = (serverErrors.UserName || serverErrors.userName)[0];
        if (serverErrors.Password || serverErrors.password) newErrors.password = (serverErrors.Password || serverErrors.password)[0];
        if (serverErrors.Email || serverErrors.email) newErrors.email = (serverErrors.Email || serverErrors.email)[0]; 
        setErrors(newErrors);
      } else if (errorMessage) {
        const newErrors: { userName?: string; email?: string } = {};
        if (errorMessage.toLowerCase().includes('email')) {
          newErrors.email = errorMessage;
        } else if (errorMessage.toLowerCase().includes('username')) {
          newErrors.userName = errorMessage;
        }
        setErrors(newErrors);
      } else {
        showToast('Tạo quản lý thất bại. Vui lòng thử lại.', 'error');
      }
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.id) return;

    if (confirm(`Bạn có chắc muốn đặt lại mật khẩu cho người dùng "${user.fullName || user.email}" không? Mật khẩu mới sẽ được tạo và gửi đến email của họ.`)) {
      try {
        showToast('Đang gửi yêu cầu đặt lại mật khẩu...', 'info');
        await userAdminService.adminResetPassword(user.id);
        showToast('Yêu cầu đặt lại mật khẩu đã được gửi thành công!', 'success');
      } catch (error) {
        showToast('Không thể gửi yêu cầu đặt lại mật khẩu.', 'error');
      }
    }
  };

  return (
    <div className={styles.formWrapper}>
      <form onSubmit={submit} className={styles.formContainer}>
        <div className={styles.formSections}>
          {!isEditMode && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <i className="bi bi-person-plus"></i>
                <h3>Thông tin cơ bản</h3>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Tên đăng nhập (Username)</label>
                    <input 
                      value={userName} 
                      onChange={e => { 
                        const value = e.target.value;
                        if (value.length <= 20) { 
                          setUserName(value); 
                          if (errors.userName) setErrors(prev => ({ ...prev, userName: undefined })); 
                        }
                      }} 
                      required 
                      maxLength={20}
                      onBlur={e => validateOnBlur('userName', e.target.value)}
                      className={`${styles.input} ${errors.userName ? styles.inputError : ''}`}
                      placeholder="Nhập tên đăng nhập (6-20 ký tự, chỉ chữ cái, số, _ và -)"
                    />
                    <div className={styles.charCount}>
                      {userName.length} / 20 ký tự
                    </div>
                    {errors.userName && <div className={styles.errorText}>{errors.userName}</div>}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <input 
                      type="email"
                      value={email} 
                      onChange={e => { 
                        setEmail(e.target.value); 
                        if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); 
                      }} 
                      required 
                      onBlur={e => validateOnBlur('email', e.target.value)}
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      placeholder="Nhập email (không có dấu tiếng Việt)"
                    />
                    {errors.email && <div className={styles.errorText}>{errors.email}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isEditMode && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="bi bi-person"></i>
                  <h3>Thông tin cá nhân</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.grid}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Tên đăng nhập (Username)</label>
                      <input value={userName} disabled className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Email</label>
                      <input type="email" value={email} disabled className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Họ và tên</label>
                      <input value={fullName} onChange={e => setFullName(e.target.value)} required className={styles.input} disabled />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Số điện thoại</label>
                      <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={styles.input} disabled />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Ngày sinh</label>
                      <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={styles.input} disabled />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Số CMND/CCCD</label>
                      <input value={identificationNumber} onChange={e => setIdentificationNumber(e.target.value)} className={styles.input} disabled />
                    </div>
                    <div className={styles.inputGroup}>
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
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Email đã xác thực</label>
                      <input value={emailConfirmed ? 'Đã xác thực' : 'Chưa xác thực'} disabled className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Số lần đăng nhập sai</label>
                      <input type="number" value={accessFailedCount} disabled className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Ngày tạo tài khoản</label>
                      <input value={createdAt ? new Date(createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : ''} disabled className={styles.input} style={{ display: isEditMode ? 'block' : 'none' }} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Cập nhật lần cuối</label>
                      <input value={updatedAt ? new Date(updatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : ''} disabled className={styles.input} style={{ display: isEditMode ? 'block' : 'none' }} />
                    </div>
                  </div>
                </div>                
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="bi bi-shield-check"></i>
                  <h3>Quản lý tài khoản</h3>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.grid}>
                    <div className={styles.inputGroup}>
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
                        <span className={styles.statusLabel}>
                          {lockoutEnabled ? 'Tài khoản đang bị khóa' : 'Tài khoản hoạt động'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.actionsContainer}>
          {isEditMode && (
            <button type="button" onClick={handleResetPassword} className={`${styles.button} ${styles.buttonDanger}`}>
              <i className="bi bi-key"></i>
              Đặt lại mật khẩu
            </button>
          )}
          <button type="button" onClick={onCancel} className={`${styles.button} ${styles.buttonSecondary}`}>
            <i className="bi bi-x-lg"></i>
            Hủy
          </button>
          <button type="submit" disabled={saving} className={`${styles.button} ${styles.buttonPrimary}`}>
            <i className="bi bi-check-lg"></i>
            {saving ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Tạo mới')}
          </button>
        </div>
      </form>
    </div>
  )
}