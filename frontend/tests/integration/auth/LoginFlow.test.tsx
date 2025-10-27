import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import Login from '@/pages/auth/Login'
import { authService } from '@/services/authService'
import { apiClient } from '@/lib/apiClient'

// Mock dependencies
vi.mock('@/services/authService')
vi.mock('@/lib/apiClient')

const mockAuthService = vi.mocked(authService)
const mockApiClient = vi.mocked(apiClient)

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </BrowserRouter>
)

describe('Login Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    })
  })

  it('renders login form correctly', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
    expect(screen.getByText('Chào mừng bạn trở lại!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nhập email hoặc tên đăng nhập')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeInTheDocument()
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
  })

  it('handles successful login flow', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'Patient'
    }
    
    const mockAuthResponse = {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      user: mockUser
    }
    
    mockAuthService.login.mockResolvedValue(mockAuthResponse)
    mockApiClient.setTokens.mockImplementation(() => {})

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    // Fill in login form
    const emailInput = screen.getByPlaceholderText('Nhập email hoặc tên đăng nhập')
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu')
    const submitButton = screen.getByText('Đăng nhập')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Wait for login to complete
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    expect(mockApiClient.setTokens).toHaveBeenCalledWith('mock-token', 'mock-refresh-token')
    expect(localStorage.setItem).toHaveBeenCalledWith('userData', JSON.stringify(mockUser))
  })

  it('handles login validation errors', async () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByPlaceholderText('Nhập email hoặc tên đăng nhập')
    const submitButton = screen.getByText('Đăng nhập')

    // Test empty email
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập email hoặc tên đăng nhập')).toBeInTheDocument()
    })

    // Test invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument()
    })
  })

  it('handles login API errors', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'))

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByPlaceholderText('Nhập email hoặc tên đăng nhập')
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu')
    const submitButton = screen.getByText('Đăng nhập')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Sai tên đăng nhập/email hoặc mật khẩu, vui lòng kiểm tra lại')).toBeInTheDocument()
    })
  })

  it('handles account lockout', async () => {
    const lockoutMessage = 'Tài khoản của bạn đã bị khóa trong 5 phút. Hãy thử lại sau. Thời gian còn lại: 4 phút 30 giây'
    mockAuthService.login.mockRejectedValue(new Error(lockoutMessage))

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByPlaceholderText('Nhập email hoặc tên đăng nhập')
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu')
    const submitButton = screen.getByText('Đăng nhập')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Tài khoản của bạn đã bị khóa trong 5 phút.')).toBeInTheDocument()
      expect(screen.getByText('04:30')).toBeInTheDocument()
    })
  })

  it('handles remember me functionality', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'Patient'
    }
    
    const mockAuthResponse = {
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      user: mockUser
    }
    
    mockAuthService.login.mockResolvedValue(mockAuthResponse)
    mockApiClient.setTokens.mockImplementation(() => {})

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByPlaceholderText('Nhập email hoặc tên đăng nhập')
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu')
    const rememberMeCheckbox = screen.getByText('Ghi nhớ đăng nhập')
    const submitButton = screen.getByText('Đăng nhập')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(rememberMeCheckbox)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalled()
    })

    expect(localStorage.setItem).toHaveBeenCalledWith('rememberEmail', 'test@example.com')
    expect(localStorage.setItem).toHaveBeenCalledWith('rememberPassword', 'password123')
  })

  it('shows loading state during login', async () => {
    // Mock a delayed response
    mockAuthService.login.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: { id: 1, email: 'test@example.com', fullName: 'Test User', role: 'Patient' }
      }), 100))
    )

    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    )

    const emailInput = screen.getByPlaceholderText('Nhập email hoặc tên đăng nhập')
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu')
    const submitButton = screen.getByText('Đăng nhập')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Check loading state
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Đang xử lý...')).not.toBeInTheDocument()
    })
  })
})

