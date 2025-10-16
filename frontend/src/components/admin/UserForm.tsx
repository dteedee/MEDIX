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
    if (!validateForm()) return
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
      </div>
    </form>
  )
}
