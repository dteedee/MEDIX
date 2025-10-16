import React, { useState } from 'react'
import { UserDTO, CreateUserRequest, UpdateUserRequest } from '../../types/user.types'
import { userService } from '../../services/userService'

interface Props {
  user?: UserDTO
  onSaved?: () => void
  onCancel?: () => void
}

export default function UserForm({ user, onSaved, onCancel }: Props) {
  const [email, setEmail] = useState(user?.email ?? '')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '')
  const [role, setRole] = useState(user?.role ?? 'PATIENT') // Mặc định là PATIENT cho người dùng mới
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState<string>((user as any)?.dateOfBirth?.split('T')[0] ?? '')
  const [identificationNumber, setIdentificationNumber] = useState<string>(user?.identificationNumber ?? '')
  const [genderCode, setGenderCode] = useState<string>(user?.genderCode ?? '')
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(user?.emailConfirmed ?? false)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (user) {
        const payload: UpdateUserRequest = { fullName, phoneNumber, roleCodes: [role], emailConfirmed, dateOfBirth, identificationNumber, genderCode }
        // Only send password fields if provided
        if (password) { (payload as any).password = password; (payload as any).passwordConfirmation = passwordConfirmation }
        await userService.update(user.id, payload)
      } else {
        const payload: CreateUserRequest = { email, fullName, phoneNumber, roleCodes: [role], password, passwordConfirmation, dateOfBirth, identificationNumber, genderCode }
        await userService.create(payload)
      }
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      {!user && (
        <div>
          <label>Email</label><br />
          <input value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
        </div>
      )}

      <div>
        <label>Full name</label><br />
        <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%' }} />
      </div>

      <div>
        <label>Phone</label><br />
        <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ width: '100%' }} />
      </div>

      <div>
        <label>Role</label><br />
        <select value={role} onChange={e => setRole(e.target.value)} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Doctor</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div>
        <label>Password {user ? '(leave blank to keep)' : ''}</label><br />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} />
      </div>
      {!user && (
        <div>
          <label>Confirm Password</label><br />
          <input type="password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} style={{ width: '100%' }} />
        </div>
      )}

      <div>
        <label>Date of Birth</label><br />
        <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
      </div>
      <div>
        <label>Identification Number</label><br />
        <input value={identificationNumber} onChange={e => setIdentificationNumber(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div>
        <label>Gender Code</label><br />
        <select value={genderCode} onChange={e => setGenderCode(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
          <option value="">-- GENDER --</option>
          <option value="MALE">MALE</option>
          <option value="FEMALE">FEMALE</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      <div>
        <label>
          <input type="checkbox" checked={emailConfirmed} onChange={e => setEmailConfirmed(e.target.checked)} /> Email confirmed
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Cancel</button>
      </div>
    </form>
  )
}
