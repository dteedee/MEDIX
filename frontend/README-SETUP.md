# MEDIX Frontend Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the frontend directory with the following content:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5123

# Google OAuth (Optional - only if using Google login)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Start Development Server
```bash
npm run dev
```

## 🔧 Configuration Details

### API Base URL
- **Development**: `http://localhost:5123` (default backend port)
- **Production**: Set `VITE_API_BASE_URL` to your production API URL
- **Fallback**: If no `.env` file exists, defaults to `http://localhost:5123`

### Backend Requirements
- Backend should be running on `http://localhost:5123`
- CORS should be configured to allow frontend requests
- API endpoints should be available at `/api/*`

## 🐛 Troubleshooting

### API Connection Issues
1. **Check if backend is running** on the correct port
2. **Verify CORS configuration** in backend
3. **Check browser console** for network errors
4. **Ensure `.env` file exists** with correct `VITE_API_BASE_URL`

### Common Issues
- **"Network Error"**: Backend not running or wrong URL
- **"CORS Error"**: Backend CORS not configured for frontend origin
- **"404 Not Found"**: API endpoint doesn't exist or wrong path

## 📁 Project Structure
```
frontend/
├── .env                 # Environment variables (create this)
├── .env.example         # Example environment file
├── src/
│   ├── lib/
│   │   └── apiClient.ts # Main API client configuration
│   └── services/        # API service files
└── vite.config.ts       # Vite configuration with proxy
```

## 🔄 Development vs Production

### Development
- Uses Vite proxy for `/api` requests
- Hot reload enabled
- Source maps available

### Production
- Uses `VITE_API_BASE_URL` directly
- No proxy (requests go directly to backend)
- Optimized build

## 📝 Notes
- All API calls use the configured base URL
- Authentication tokens are automatically included in requests
- Error handling is centralized in `apiClient.ts`
