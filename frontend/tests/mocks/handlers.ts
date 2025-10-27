import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:5123/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'Patient'
        }
      }
    })
  }),

  http.post(`${API_BASE_URL}/auth/register`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'User registered successfully'
      }
    })
  }),

  http.post(`${API_BASE_URL}/auth/refresh-token`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token'
      }
    })
  }),

  // User endpoints
  http.get(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Patient',
        phoneNumber: '0123456789',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        address: 'Test Address'
      }
    })
  }),

  http.put(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Profile updated successfully'
      }
    })
  }),

  // Doctor endpoints
  http.get(`${API_BASE_URL}/doctors`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        doctors: [
          {
            id: 1,
            firstName: 'Dr. John',
            lastName: 'Doe',
            specialization: 'Cardiology',
            experience: 10,
            rating: 4.8,
            consultationFee: 500000,
            avatar: 'doctor-avatar.jpg'
          }
        ],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1
      }
    })
  }),

  // Appointment endpoints
  http.post(`${API_BASE_URL}/appointments`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        appointmentId: 1,
        message: 'Appointment booked successfully'
      }
    })
  }),

  http.get(`${API_BASE_URL}/appointments`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        appointments: [
          {
            id: 1,
            doctorName: 'Dr. John Doe',
            appointmentDate: '2024-01-15',
            appointmentTime: '10:00',
            status: 'Confirmed',
            consultationFee: 500000
          }
        ],
        totalCount: 1
      }
    })
  }),

  // Article endpoints
  http.get(`${API_BASE_URL}/articles`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        articles: [
          {
            id: 1,
            title: 'Health Article Title',
            content: 'Article content...',
            author: 'Dr. Jane Smith',
            publishedDate: '2024-01-01',
            category: 'General Health',
            imageUrl: 'article-image.jpg'
          }
        ],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1
      }
    })
  }),

  // Category endpoints
  http.get(`${API_BASE_URL}/categories`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        categories: [
          {
            id: 1,
            name: 'General Health',
            description: 'General health articles',
            articleCount: 10
          }
        ]
      }
    })
  }),

  // Notification endpoints
  http.get(`${API_BASE_URL}/notifications`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        notifications: [
          {
            id: 1,
            title: 'Appointment Reminder',
            message: 'Your appointment is tomorrow at 10:00 AM',
            isRead: false,
            createdAt: '2024-01-14T10:00:00Z'
          }
        ],
        unreadCount: 1
      }
    })
  }),

  // Error responses
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid credentials'
      },
      { status: 401 }
    )
  }),

  http.get(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json(
      {
        success: false,
        message: 'Unauthorized'
      },
      { status: 401 }
    )
  })
]

