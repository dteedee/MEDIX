import React, { useState, useEffect } from 'react'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../../types/user.types'
import { userService } from '../../services/userService'
import './AdminForm.css' // Import file CSS mới

interface Props {
  user?: UserDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function UserForm({ user, onSaved, onCancel }: Props) {
<<<<<<< HEAD
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    role: 'PATIENT',
    password: '',
    passwordConfirmation: '',
    dateOfBirth: '',
    identificationNumber: '',
    genderCode: '',
    emailConfirmed: false,
  })
=======
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '')
  const [role, setRole] = useState(user?.role ?? 'PATIENT') // Mặc định là PATIENT cho người dùng mới
  const [dateOfBirth, setDateOfBirth] = useState<string>((user as any)?.dateOfBirth?.split('T')[0] ?? '')
  const [identificationNumber, setIdentificationNumber] = useState<string>(user?.identificationNumber ?? '')
  const [genderCode, setGenderCode] = useState<string>(user?.genderCode ?? '')
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(user?.emailConfirmed ?? false)
>>>>>>> NEW-Manager-User
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})
  const isEditMode = Boolean(user?.id)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email ?? '',
        fullName: user.fullName ?? '',
        phoneNumber: user.phoneNumber ?? '',
        role: user.role ?? 'PATIENT',
        password: '',
        passwordConfirmation: '',
        dateOfBirth: (user as any)?.dateOfBirth?.split('T')[0] ?? '',
        identificationNumber: user.identificationNumber ?? '',
        genderCode: user.genderCode ?? '',
        emailConfirmed: user.emailConfirmed ?? false,
      })
    }
  }, [user])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Họ và tên là bắt buộc.'
    if (!isEditMode && !formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc.'
    } else if (!isEditMode && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ.'
    }
    if (!isEditMode && !formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc.'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
    }
    if (formData.password && formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Xác nhận mật khẩu không khớp.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
<<<<<<< HEAD
    if (!validateForm()) return
=======
    // Basic password confirmation validation
    if (!user && password !== passwordConfirmation) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
>>>>>>> NEW-Manager-User
    setSaving(true)
    try {
      if (user) {
        const payload: UpdateUserRequest = {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          roleCodes: [formData.role],
          emailConfirmed: formData.emailConfirmed,
          dateOfBirth: formData.dateOfBirth || undefined,
          identificationNumber: formData.identificationNumber,
          genderCode: formData.genderCode,
        }
        // Only send password fields if provided
        if (formData.password) {
          ;(payload as any).password = formData.password
          ;(payload as any).passwordConfirmation = formData.passwordConfirmation
        }
        await userService.update(user.id, payload)
      } else {
        const payload: CreateUserRequest = {
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          roleCodes: [formData.role],
          password: formData.password,
          passwordConfirmation: formData.passwordConfirmation,
          dateOfBirth: formData.dateOfBirth || undefined,
          identificationNumber: formData.identificationNumber,
          genderCode: formData.genderCode,
        }
        await userService.create(payload)
      }
      onSaved?.()
    } catch (error: any) {
      const serverErrors = error?.response?.data?.errors;
      if (serverErrors) setErrors(serverErrors);
      console.error("Failed to save user:", error)
    } finally {
      setSaving(false)
    }
  }

<<<<<<< HEAD
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">Họ và tên</label>
          <input id="fullName" name="fullName" type="text" className={`form-input ${errors.fullName ? 'is-invalid' : ''}`} value={formData.fullName} onChange={handleChange} />
          {errors.fullName && <div className="form-error">{errors.fullName}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" name="email" type="email" className={`form-input ${errors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleChange} disabled={isEditMode} />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber" className="form-label">Số điện thoại</label>
          <input id="phoneNumber" name="phoneNumber" type="tel" className="form-input" value={formData.phoneNumber} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="role" className="form-label">Vai trò</label>
          <select id="role" name="role" className="form-select" value={formData.role} onChange={handleChange} required>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Mật khẩu {isEditMode ? '(để trống nếu không đổi)' : ''}</label>
          <input id="password" name="password" type="password" className={`form-input ${errors.password ? 'is-invalid' : ''}`} value={formData.password} onChange={handleChange} />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="passwordConfirmation" className="form-label">Xác nhận mật khẩu</label>
          <input id="passwordConfirmation" name="passwordConfirmation" type="password" className={`form-input ${errors.passwordConfirmation ? 'is-invalid' : ''}`} value={formData.passwordConfirmation} onChange={handleChange} />
          {errors.passwordConfirmation && <div className="form-error">{errors.passwordConfirmation}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth" className="form-label">Ngày sinh</label>
          <input id="dateOfBirth" name="dateOfBirth" type="date" className="form-input" value={formData.dateOfBirth} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="identificationNumber" className="form-label">Số CCCD/CMND</label>
          <input id="identificationNumber" name="identificationNumber" type="text" className="form-input" value={formData.identificationNumber} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="genderCode" className="form-label">Giới tính</label>
          <select id="genderCode" name="genderCode" className="form-select" value={formData.genderCode} onChange={handleChange}>
            <option value="">-- Chọn giới tính --</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>

        <div className="form-group" style={{ justifyContent: 'center' }}>
          <label htmlFor="emailConfirmed" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
            <input
              id="emailConfirmed"
              name="emailConfirmed"
              type="checkbox"
              checked={formData.emailConfirmed}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <span>Đã xác thực email</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="form-button form-button-secondary" onClick={onCancel} disabled={saving}>
            Hủy
          </button>
          <button type="submit" className="form-button form-button-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
=======
  const isEditMode = !!user;

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

  return (
    <form onSubmit={submit} style={formContainerStyle}>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>Họ và tên</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required={!isEditMode} disabled={isEditMode} style={{...inputStyle, background: isEditMode ? '#f3f4f6' : '#fff'}} />
        </div>
        <div>
          <label style={labelStyle}>Số điện thoại</label>
          <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} />
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
        <div>
          <label style={labelStyle}>Mật khẩu {isEditMode ? '(để trống nếu không đổi)' : ''}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!isEditMode} style={inputStyle} />
        </div>
        {!isEditMode && (
          <div>
            <label style={labelStyle}>Xác nhận mật khẩu</label>
            <input type="password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} required style={inputStyle} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Ngày sinh</label>
          <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Số CMND/CCCD</label>
          <input value={identificationNumber} onChange={e => setIdentificationNumber(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Giới tính</label>
          <select value={genderCode} onChange={e => setGenderCode(e.target.value)} style={inputStyle}>
            <option value="">-- Chọn giới tính --</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Trạng thái</label>
          <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
            <input type="checkbox" id="emailConfirmed" checked={emailConfirmed} onChange={e => setEmailConfirmed(e.target.checked)} style={{ marginRight: 8, width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="emailConfirmed" style={{ fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>Đã xác thực email</label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
>>>>>>> NEW-Manager-User
      </div>
    </form>
  )
}
