import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, RefreshTokenRequest } from '../types/auth.types';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    // Use environment variable for API base URL, fallback to proxy for development
    const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
    
    this.client = axios.create({
      baseURL: 'https://localhost:55883/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        const reqUrl = (originalRequest.url || '').toString();
        const isAuthEndpoint =
          reqUrl.includes('/auth/login') ||
          reqUrl.includes('/auth/refresh-token') ||
          reqUrl.includes('/auth/logout');

        // If the failing request is an auth route (login/refresh) don't attempt refresh —
        // let the caller receive the original 401 so UI can show the correct message.
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isAuthEndpoint) {
            this.handleLogout();
            return Promise.reject(error); // propagate original 401/error to caller
          }

          originalRequest._retry = true;

          try {
            const newToken = await this.handleTokenRefresh();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.handleLogout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = this.refreshToken(refreshToken)
      .then((response) => {
        this.setTokens(response.accessToken, response.refreshToken);
        return response.accessToken;
      })
      .finally(() => {
        this.refreshTokenPromise = null;
      });

    return this.refreshTokenPromise;
  }

  private async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/refresh-token', {
      refreshToken,
    });
    return response.data;
  }

  // Token management
  private getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    const expiration = localStorage.getItem('tokenExpiration');
    
    // Check if token is expired
    if (token && expiration) {
      const expirationTime = parseInt(expiration);
      if (Date.now() >= expirationTime) {
        // Token expired, clear it
        this.clearTokens();
        return null;
      }
    }
    
    return token;
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // Set token expiration time (30 minutes from now)
    const expirationTime = Date.now() + (30 * 60 * 1000); // 30 minutes
    localStorage.setItem('tokenExpiration', expirationTime.toString());
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiration');
  }

  private handleLogout(): void {
    this.clearTokens();
    // Clear any user data from context/state
  }

  // HTTP methods
  public get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  public postMultipart<T = any>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, formData, {
      headers: {
        // Let Axios set the correct boundary automatically
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  public put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  public putMultipart<T = any>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, formData, {
      headers: {
        // Let Axios set the correct boundary automatically
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  public delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  public patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
