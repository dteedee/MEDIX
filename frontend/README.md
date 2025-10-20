# Medix Frontend

Vite + React + TypeScript starter connected to Medix API.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure it:
```bash
cp env.example .env
```

Edit `.env` file:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5123

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Start Development Server
```bash
npm run dev
```

## 📋 Available Scripts
- `npm run dev` - start dev server at http://localhost:5173
- `npm run build` - build for production (outputs to `dist`)
- `npm run preview` - preview production build

## 🔧 Configuration

### API Base URL
- **Development**: `http://localhost:5123` (default)
- **Production**: Set `VITE_API_BASE_URL` in `.env`
- **Fallback**: If no `.env` exists, defaults to `http://localhost:5123`

### Backend Requirements
- Backend must be running on `http://localhost:5123`
- CORS must be configured to allow frontend requests

## 🐛 Troubleshooting

### API Connection Issues
1. **Check if backend is running** on port 5123
2. **Verify `.env` file exists** with correct `VITE_API_BASE_URL`
3. **Check browser console** for network errors
4. **Ensure CORS is configured** in backend

For detailed setup instructions, see [README-SETUP.md](./README-SETUP.md)
