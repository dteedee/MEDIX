import { describe, it, expect } from 'vitest'
import {
  validatePassword,
  isPasswordValid,
  validateEmail,
  validatePhoneNumber,
  validateFullName,
  validateIdentificationNumber,
  validateGenderCode,
  validateDateOfBirth,
  validatePatientRegistrationForm,
  getPasswordStrength,
  hasFieldError,
  getFieldError,
  formatErrorMessage
} from '@/utils/validation'

describe('Password Validation', () => {
  it('validates password requirements correctly', () => {
    const validPassword = 'Password123!'
    const requirements = validatePassword(validPassword)
    
    expect(requirements.minLength).toBe(true)
    expect(requirements.hasUppercase).toBe(true)
    expect(requirements.hasLowercase).toBe(true)
    expect(requirements.hasNumber).toBe(true)
    expect(requirements.hasSpecialChar).toBe(true)
  })

  it('identifies weak passwords', () => {
    const weakPassword = 'password'
    const requirements = validatePassword(weakPassword)
    
    expect(requirements.minLength).toBe(false)
    expect(requirements.hasUppercase).toBe(false)
    expect(requirements.hasNumber).toBe(false)
    expect(requirements.hasSpecialChar).toBe(false)
  })

  it('correctly identifies valid passwords', () => {
    expect(isPasswordValid('Password123!')).toBe(true)
    expect(isPasswordValid('password')).toBe(false)
    expect(isPasswordValid('PASSWORD123!')).toBe(false)
    expect(isPasswordValid('Password!')).toBe(false)
  })
})

describe('Email Validation', () => {
  it('validates correct email formats', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    expect(validateEmail('test+tag@example.org')).toBe(true)
  })

  it('rejects invalid email formats', () => {
    expect(validateEmail('invalid-email')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })
})

describe('Phone Number Validation', () => {
  it('validates Vietnamese phone numbers', () => {
    expect(validatePhoneNumber('0123456789')).toBe(true)
    expect(validatePhoneNumber('+84123456789')).toBe(true)
    expect(validatePhoneNumber('0987654321')).toBe(true)
  })

  it('handles formatted phone numbers', () => {
    expect(validatePhoneNumber('0123-456-789')).toBe(true)
    expect(validatePhoneNumber('0123 456 789')).toBe(true)
    expect(validatePhoneNumber('(0123) 456-789')).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(validatePhoneNumber('123456789')).toBe(false)
    expect(validatePhoneNumber('01234567890')).toBe(false)
    expect(validatePhoneNumber('invalid')).toBe(false)
  })

  it('allows empty phone numbers (optional field)', () => {
    expect(validatePhoneNumber('')).toBe(true)
  })
})

describe('Full Name Validation', () => {
  it('validates correct full names', () => {
    expect(validateFullName('John Doe')).toBe(true)
    expect(validateFullName('Nguyễn Văn A')).toBe(true)
    expect(validateFullName('A')).toBe(true) // Min length
  })

  it('rejects invalid full names', () => {
    expect(validateFullName('')).toBe(false)
    expect(validateFullName('A'.repeat(101))).toBe(false) // Too long
  })
})

describe('Identification Number Validation', () => {
  it('validates correct identification numbers', () => {
    expect(validateIdentificationNumber('123456789')).toBe(true)
    expect(validateIdentificationNumber('123456789012')).toBe(true)
  })

  it('rejects invalid identification numbers', () => {
    expect(validateIdentificationNumber('12345678901234567890')).toBe(false) // Too long
    expect(validateIdentificationNumber('123abc456')).toBe(false) // Contains letters
  })

  it('allows empty identification numbers (optional field)', () => {
    expect(validateIdentificationNumber('')).toBe(true)
  })
})

describe('Gender Code Validation', () => {
  it('validates correct gender codes', () => {
    expect(validateGenderCode('M')).toBe(true)
    expect(validateGenderCode('F')).toBe(true)
    expect(validateGenderCode('O')).toBe(true)
  })

  it('rejects invalid gender codes', () => {
    expect(validateGenderCode('X')).toBe(false)
    expect(validateGenderCode('Male')).toBe(false)
  })

  it('allows empty gender codes (optional field)', () => {
    expect(validateGenderCode('')).toBe(true)
  })
})

describe('Date of Birth Validation', () => {
  it('validates correct dates of birth', () => {
    const validDate = new Date()
    validDate.setFullYear(validDate.getFullYear() - 25) // 25 years old
    expect(validateDateOfBirth(validDate.toISOString().split('T')[0])).toBe(true)
  })

  it('rejects underage dates', () => {
    const underageDate = new Date()
    underageDate.setFullYear(underageDate.getFullYear() - 17) // 17 years old
    expect(validateDateOfBirth(underageDate.toISOString().split('T')[0])).toBe(false)
  })

  it('rejects future dates', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    expect(validateDateOfBirth(futureDate.toISOString().split('T')[0])).toBe(false)
  })

  it('allows empty dates (optional field)', () => {
    expect(validateDateOfBirth('')).toBe(true)
  })
})

describe('Patient Registration Form Validation', () => {
  it('validates complete valid form', () => {
    const validForm = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
      phoneNumber: '0123456789',
      identificationNumber: '123456789',
      dateOfBirth: '1990-01-01',
      genderCode: 'M'
    }

    const errors = validatePatientRegistrationForm(validForm)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('validates form with missing required fields', () => {
    const invalidForm = {
      fullName: '',
      email: '',
      password: '',
      passwordConfirmation: ''
    }

    const errors = validatePatientRegistrationForm(invalidForm)
    expect(errors.fullName).toContain('Họ và tên là bắt buộc')
    expect(errors.email).toContain('Email là bắt buộc')
    expect(errors.password).toContain('Mật khẩu là bắt buộc')
    expect(errors.passwordConfirmation).toContain('Xác nhận mật khẩu là bắt buộc')
  })

  it('validates password confirmation mismatch', () => {
    const form = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      passwordConfirmation: 'DifferentPassword123!'
    }

    const errors = validatePatientRegistrationForm(form)
    expect(errors.passwordConfirmation).toContain('Mật khẩu và xác nhận không khớp')
  })
})

describe('Password Strength', () => {
  it('calculates password strength correctly', () => {
    const weak = getPasswordStrength('password')
    expect(weak.label).toBe('Yếu')
    expect(weak.color).toBe('text-red-600')

    const medium = getPasswordStrength('Password1')
    expect(medium.label).toBe('Trung bình')
    expect(medium.color).toBe('text-yellow-600')

    const strong = getPasswordStrength('Password123!')
    expect(strong.label).toBe('Mạnh')
    expect(strong.color).toBe('text-green-600')
  })
})

describe('Error Handling Utilities', () => {
  it('checks for field errors', () => {
    const errors = { email: ['Email is required'] }
    expect(hasFieldError('email', errors)).toBe(true)
    expect(hasFieldError('password', errors)).toBe(false)
  })

  it('gets field errors', () => {
    const errors = { email: ['Email is required', 'Email is invalid'] }
    expect(getFieldError('email', 'test', errors)).toEqual(['Email is required', 'Email is invalid'])
    expect(getFieldError('password', 'test', errors)).toEqual([])
  })

  it('formats error messages', () => {
    const errors = ['Email is required', 'Email is invalid']
    expect(formatErrorMessage(errors)).toBe('Email is required, Email is invalid')
  })
})
