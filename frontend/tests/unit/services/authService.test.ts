import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '@/services/authService'
import { apiClient } from '@/lib/apiClient'

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    clearTokens: vi.fn()
  }
}))

const mockApiClient = vi.mocked(apiClient)

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call login API with correct data', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'Patient'
          }
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = await authService.login(credentials)

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        identifier: 'test@example.com',
        password: 'password123'
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials')
      mockApiClient.post.mockRejectedValue(error)

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('should call register API with correct data', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'newuser@example.com',
            fullName: 'New User',
            role: 'Patient'
          }
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      }

      const result = await authService.register(userData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', userData)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('registerPatient', () => {
    it('should call registerPatient API with correct payload structure', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 1,
            email: 'patient@example.com',
            fullName: 'Patient User',
            role: 'Patient'
          }
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const patientData = {
        registerRequest: {
          email: 'patient@example.com',
          password: 'password123',
          passwordConfirmation: 'password123',
          fullName: 'Patient User',
          phoneNumber: '0123456789',
          address: 'Test Address',
          dateOfBirth: '1990-01-01',
          identificationNumber: '123456789',
          genderCode: 'M'
        },
        patientDTO: {
          bloodTypeCode: 'A+',
          height: 170,
          weight: 70,
          medicalHistory: 'None',
          allergies: 'None',
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '0987654321'
        }
      }

      const result = await authService.registerPatient(patientData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/register/registerPatient', {
        registerRequest: {
          email: 'patient@example.com',
          password: 'password123',
          passwordConfirmation: 'password123',
          fullName: 'Patient User',
          phoneNumber: '0123456789',
          address: 'Test Address',
          dateOfBirth: '1990-01-01',
          identificationNumber: '123456789',
          genderCode: 'M'
        },
        patientDTO: {
          bloodTypeCode: 'A+',
          height: 170,
          weight: 70,
          medicalHistory: 'None',
          allergies: 'None',
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '0987654321',
          isActive: true
        }
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('refreshToken', () => {
    it('should call refresh token API', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          user: {
            id: 1,
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'Patient'
          }
        }
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const result = await authService.refreshToken('refresh-token')

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh-token', {
        refreshToken: 'refresh-token'
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('logout', () => {
    it('should call logout API and clear tokens', async () => {
      mockApiClient.post.mockResolvedValue({ data: {} })

      await authService.logout()

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout')
      expect(mockApiClient.clearTokens).toHaveBeenCalled()
    })

    it('should clear tokens even if logout API fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API Error'))

      await authService.logout()

      expect(mockApiClient.clearTokens).toHaveBeenCalled()
    })
  })

  describe('validation helpers', () => {
    describe('validateEmailFormat', () => {
      it('should validate correct email formats', () => {
        expect(authService.validateEmailFormat('test@example.com')).toBe(true)
        expect(authService.validateEmailFormat('user.name@domain.co.uk')).toBe(true)
        expect(authService.validateEmailFormat('test+tag@example.org')).toBe(true)
      })

      it('should reject invalid email formats', () => {
        expect(authService.validateEmailFormat('invalid-email')).toBe(false)
        expect(authService.validateEmailFormat('@example.com')).toBe(false)
        expect(authService.validateEmailFormat('test@')).toBe(false)
        expect(authService.validateEmailFormat('')).toBe(false)
      })
    })

    describe('validatePasswordComplexity', () => {
      it('should validate complex passwords', () => {
        expect(authService.validatePasswordComplexity('Password123!')).toBe(true)
        expect(authService.validatePasswordComplexity('MyPass1@')).toBe(true)
      })

      it('should reject simple passwords', () => {
        expect(authService.validatePasswordComplexity('password')).toBe(false)
        expect(authService.validatePasswordComplexity('PASSWORD')).toBe(false)
        expect(authService.validatePasswordComplexity('Password')).toBe(false)
        expect(authService.validatePasswordComplexity('Password1')).toBe(false)
        expect(authService.validatePasswordComplexity('Pass1!')).toBe(false) // Too short
      })
    })
  })

  describe('getGenderOptions', () => {
    it('should return gender options', () => {
      const options = authService.getGenderOptions()

      expect(options).toHaveLength(3)
      expect(options[0]).toEqual({
        code: 'Male',
        displayName: 'Nam',
        isActive: true
      })
      expect(options[1]).toEqual({
        code: 'Female',
        displayName: 'Nữ',
        isActive: true
      })
      expect(options[2]).toEqual({
        code: 'Others',
        displayName: 'Khác',
        isActive: true
      })
    })
  })

  describe('checkEmailExists', () => {
    it('should return true if email exists', async () => {
      mockApiClient.post.mockResolvedValue({ data: true })

      const result = await authService.checkEmailExists('existing@example.com')

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/register/checkEmailExist', 'existing@example.com')
      expect(result).toEqual({ exists: true })
    })

    it('should return false if email does not exist', async () => {
      mockApiClient.post.mockResolvedValue({ data: false })

      const result = await authService.checkEmailExists('new@example.com')

      expect(result).toEqual({ exists: false })
    })

    it('should return false on error', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API Error'))

      const result = await authService.checkEmailExists('test@example.com')

      expect(result).toEqual({ exists: false })
    })
  })

  describe('resetPassword', () => {
    it('should return success on successful reset', async () => {
      mockApiClient.post.mockResolvedValue({ data: {} })

      const result = await authService.resetPassword({
        email: 'test@example.com',
        code: '123456',
        password: 'newpassword123'
      })

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 'test@example.com',
        code: '123456',
        password: 'newpassword123'
      })
      expect(result).toEqual({ success: true })
    })

    it('should return error on failed reset', async () => {
      const error = {
        response: {
          data: {
            message: 'Invalid code'
          }
        }
      }
      mockApiClient.post.mockRejectedValue(error)

      const result = await authService.resetPassword({
        email: 'test@example.com',
        code: 'wrongcode',
        password: 'newpassword123'
      })

      expect(result).toEqual({
        success: false,
        error: 'Invalid code'
      })
    })
  })
})
