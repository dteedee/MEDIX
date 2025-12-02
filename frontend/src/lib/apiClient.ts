import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, RefreshTokenRequest } from '../types/auth.types';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://medix-a9bdazgse0d8cpc9.southeastasia-01.azurewebsites.net/api';
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const reqUrl = (config.url || '').toString();
        const isRefreshTokenEndpoint = reqUrl.includes('/auth/refresh-token');
        
        if (!isRefreshTokenEndpoint) {
          const token = this.getAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

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

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isAuthEndpoint) {
            this.handleLogout();
            return Promise.reject(error); 
          }

          originalRequest._retry = true;

          try {
            const newToken = await this.handleTokenRefresh();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // If refresh token fails, clear tokens and redirect to login
            this.handleLogout();
            // Dispatch event to notify AuthContext
            window.dispatchEvent(new Event('authTokenExpired'));
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
        // Use expiresAt from backend response
        this.setTokens(response.accessToken, response.refreshToken, response.expiresAt);
        return response.accessToken;
      })
      .catch((error) => {
        // Clear tokens if refresh fails
        this.clearTokens();
        throw error;
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

  public getToken (): string | null {
    return this.getAccessToken();
  }
  
  private getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    const expiration = localStorage.getItem('tokenExpiration');
    
    if (token && expiration) {
      const expirationTime = parseInt(expiration);
      // Add 5 second buffer to refresh token before it actually expires
      const bufferTime = 5 * 1000; // 5 seconds
      if (Date.now() >= (expirationTime - bufferTime)) {
        // Token expired or about to expire, clear it
        this.clearAccessTokens();
        return null;
      }
    }
    
    return token;
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  public setTokens(accessToken: string, refreshToken: string, expiresAt?: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Use expiresAt from backend if provided, otherwise calculate from current time
    if (expiresAt) {
      // Parse ISO string from backend and convert to timestamp
      const expirationTime = new Date(expiresAt).getTime();
      // Add 30 second buffer to account for clock skew and network delay
      const bufferTime = 30 * 1000; // 30 seconds
      localStorage.setItem('tokenExpiration', (expirationTime - bufferTime).toString());
    } else {
      // Fallback: Set token expiration time (1 hour from now) if expiresAt not provided
      const expirationTime = Date.now() + (60 * 60 * 1000); // 1 hour
      localStorage.setItem('tokenExpiration', expirationTime.toString());
    }
  }

    public clearAccessTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiration');
  }

  public clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiration');
  }

  private handleLogout(): void {
    this.clearTokens();
  }

  public get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  public postMultipart<T = any>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
  }

  public put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  public putMultipart<T = any>(url: string, formData: FormData): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, formData, {
      headers: {
        'Content-Type': undefined,
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

export const apiClient = new ApiClient();
