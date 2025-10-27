import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { apiClient } from '@/lib/apiClient'

// Mock dependencies
vi.mock('@/services/authService')
vi.mock('@/lib/apiClient')

const mockAuthService = vi.mocked(authService)
const mockApiClient = vi.mocked(apiClient)

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? user.fullName : 'No User'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
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

  it('provides initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('handles successful login', async () => {
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
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })
    
    // Click login button
    await act(async () => {
      fireEvent.click(screen.getByText('Login'))
    })
    
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      })
      expect(mockApiClient.setTokens).toHaveBeenCalledWith('mock-token', 'mock-refresh-token')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })
  })

  it('handles login error', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'))
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })
    
    await act(async () => {
      fireEvent.click(screen.getByText('Login'))
    })
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
      expect(screen.getByTestId('user')).toHaveTextContent('No User')
    })
  })

  it('handles logout', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'Patient'
    }
    
    // Mock user being logged in
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'userData') return JSON.stringify(mockUser)
      if (key === 'accessToken') return 'mock-token'
      if (key === 'refreshToken') return 'mock-refresh-token'
      return null
    })
    
    mockAuthService.logout.mockResolvedValue(undefined)
    mockApiClient.clearTokens.mockImplementation(() => {})
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })
    
    await act(async () => {
      fireEvent.click(screen.getByText('Logout'))
    })
    
    await waitFor(() => {
      expect(mockAuthService.logout).toHaveBeenCalled()
      expect(mockApiClient.clearTokens).toHaveBeenCalled()
      expect(localStorage.removeItem).toHaveBeenCalledWith('userData')
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentUser')
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
    })
  })

  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})

