import React, { useState } from 'react'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../../types/user.types'
import { userService } from '../../services/userService'

interface Props {
  user?: UserDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function UserForm({ user, onSaved, onCancel }: Props) {
  const isEditMode = !!user;

  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '')
  const [dateOfBirth, setDateOfBirth] = useState<string>((user as any)?.dateOfBirth?.split('T')[0] ?? '')
  const [identificationNumber, setIdentificationNumber] = useState<string>(user?.identificationNumber ?? '')
  const [genderCode, setGenderCode] = useState<string>(user?.genderCode ?? '')
  const [role, setRole] = useState(user?.role ?? 'PATIENT')
  const [lockoutEnabled, setLockoutEnabled] = useState<boolean>(user?.lockoutEnabled ?? false)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditMode && password !== passwordConfirmation) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    setSaving(true)
    try {
      if (isEditMode && user) {
        // Khi chỉnh sửa, chỉ cập nhật vai trò và trạng thái xác thực
        const payload = { 
          roleCodes: [role],
          lockoutEnabled: lockoutEnabled
        }
        await userService.update(user.id, payload)
      } else {
        // Khi tạo mới, chỉ cần email, mật khẩu và vai trò
        const payload: CreateUserRequest = { fullName, email, password, passwordConfirmation, roleCodes: [role], phoneNumber, dateOfBirth, identificationNumber, genderCode }
        await userService.create(payload)
      }
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

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
          <input value={fullName} onChange={e => setFullName(e.target.value)} required disabled={isEditMode} style={{...inputStyle, background: isEditMode ? '#f3f4f6' : '#fff'}} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required={!isEditMode} disabled={isEditMode} style={{...inputStyle, background: isEditMode ? '#f3f4f6' : '#fff'}} />
        </div>
        {!isEditMode && (
          <div><label style={labelStyle}>Số điện thoại</label><input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} /></div>
        )}
        <div>
          <label style={labelStyle}>Vai trò</label>
          <select value={role} onChange={e => setRole(e.target.value)} required style={inputStyle}>
            <option value="PATIENT">Bệnh nhân</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="MANAGER">Quản lý</option>
            <option value="ADMIN">Quản trị</option>
          </select>
        </div>
        {!isEditMode && (
          <>
            <div>
              <label style={labelStyle}>Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Xác nhận mật khẩu</label>
              <input type="password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} required style={inputStyle} />
            </div>
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
          </>
        )}
        {isEditMode && (
          <div>
            <label style={labelStyle}>Trạng thái tài khoản</label>
            <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
              <input type="checkbox" id="lockoutEnabled" checked={lockoutEnabled} onChange={e => setLockoutEnabled(e.target.checked)} style={{ marginRight: 8, width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="lockoutEnabled" style={{ fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>Khóa tài khoản</label>
            </div>
          </div>
        )}
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
      </div>
    </form>
  )
}
