# 📚 Hướng dẫn sử dụng API Client cho Team

## 🎯 Tổng quan

Dự án sử dụng **apiClient singleton** để quản lý tất cả API calls và authentication tokens.

### ✅ Lợi ích:
- ✨ **Tự động refresh token** khi hết hạn
- 🔒 **Centralized authentication** - quản lý token ở 1 nơi
- 🚀 **Auto-retry** request khi token mới được refresh
- 🛡️ **Type-safe** với TypeScript
- 📦 **Singleton pattern** - 1 instance dùng chung toàn app

---

## 🚀 Setup cho người mới (Clone từ GitHub)

### Bước 1: Clone project
```bash
git clone <repository-url>
cd MEDIX/frontend
```

### Bước 2: Install dependencies
```bash
npm install
```

### Bước 3: Tạo file .env
```bash
# Copy từ template
cp env.example .env

# Hoặc trên Windows
copy env.example .env
```

### Bước 4: Cập nhật .env
```env
VITE_API_BASE_URL=http://localhost:5123/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Bước 5: Chạy frontend
```bash
npm run dev
```

**⚠️ LƯU Ý:** File `.env` đã được git ignore, **KHÔNG BAO GIỜ commit file .env lên GitHub!**

---

## 📖 Cách sử dụng apiClient

### 1️⃣ Import apiClient
```typescript
import { apiClient } from '../lib/apiClient';
```

### 2️⃣ Gọi API trong Services

#### ✅ GET Request
```typescript
// Đơn giản nhất
const response = await apiClient.get('/users');
const data = response.data;

// Với params
const response = await apiClient.get('/users', { 
  params: { page: 1, pageSize: 10 } 
});
```

#### ✅ POST Request (JSON)
```typescript
const response = await apiClient.post('/auth/login', {
  email: 'user@example.com',
  password: '123456'
});
```

#### ✅ POST/PUT Request (FormData/Multipart)
```typescript
const formData = new FormData();
formData.append('title', 'Article Title');
formData.append('file', fileObject);

// POST
const response = await apiClient.postMultipart('/articles', formData);

// PUT
const response = await apiClient.putMultipart('/articles/123', formData);
```

#### ✅ PUT Request (JSON)
```typescript
const response = await apiClient.put('/users/123', {
  fullName: 'John Doe',
  email: 'john@example.com'
});
```

#### ✅ DELETE Request
```typescript
await apiClient.delete('/users/123');
```

### 3️⃣ Xử lý Authentication

#### Login
```typescript
import { useAuth } from '../contexts/AuthContext';

const { login } = useAuth();

// apiClient tự động lưu và quản lý tokens
await login({ email, password });
```

#### Logout
```typescript
const { logout } = useAuth();

// apiClient tự động xóa tokens
await logout();
```

#### Kiểm tra authenticated
```typescript
const { isAuthenticated, user } = useAuth();

if (isAuthenticated) {
  console.log('Logged in as:', user.fullName);
}
```

---

## 🔐 Token Management (Tự động)

### apiClient tự động xử lý:

1. **Thêm Authorization header** vào mọi request
2. **Kiểm tra token expiration** trước khi gửi request
3. **Auto-refresh token** khi nhận 401 response
4. **Retry request** với token mới
5. **Logout tự động** nếu refresh token cũng hết hạn

### ⚠️ QUAN TRỌNG: Không làm điều này!

```typescript
// ❌ KHÔNG BAO GIỜ truy cập localStorage trực tiếp
const token = localStorage.getItem('accessToken'); // WRONG!

// ❌ KHÔNG BAO GIỜ tự thêm Authorization header
await axios.get('/api/users', {
  headers: { Authorization: `Bearer ${token}` } // WRONG!
});

// ✅ CHỈ dùng apiClient
await apiClient.get('/users'); // CORRECT!
```

---

## 📁 Cấu trúc Code

### Services (Nơi gọi API)
```
frontend/src/services/
├── authService.ts       ✅ Đã refactor
├── articleService.ts    ✅ Đã refactor
├── bannerService.ts     ✅ Đã refactor
├── categoryService.ts   ✅ Đã refactor
├── cmspageService.ts    ✅ Đã refactor
├── doctorService.ts     ✅ Đã refactor
└── notificationService.ts ✅ Đã refactor
```

### Components (Dùng Services)
```
frontend/src/pages/
├── auth/
│   ├── Login.tsx        ✅ Dùng AuthContext
│   └── AuthStatus.tsx   ✅ Dùng apiClient.clearTokens()
└── ...
```

### Core Files
```
frontend/src/
├── lib/
│   └── apiClient.ts     ⭐ Core - Token management
└── contexts/
    └── AuthContext.tsx  ⭐ Auth state management
```

---

## 🐛 Debug & Troubleshooting

### Vấn đề 1: API call bị 401 Unauthorized

**Nguyên nhân:**
- Token hết hạn
- Chưa login

**Giải pháp:**
- apiClient sẽ tự động refresh token
- Nếu vẫn lỗi → login lại

### Vấn đề 2: CORS Error

**Kiểm tra:**
```bash
# Backend phải chạy trên đúng port
# File: backend/Medix.API/Properties/launchSettings.json
"applicationUrl": "http://localhost:5123"

# Frontend .env phải match
VITE_API_BASE_URL=http://localhost:5123/api
```

### Vấn đề 3: Token không được lưu

**Kiểm tra:**
```typescript
// Sau login, check localStorage
localStorage.getItem('accessToken')  // Phải có
localStorage.getItem('refreshToken') // Phải có
localStorage.getItem('tokenExpiration') // Phải có
```

### Vấn đề 4: Request không có Authorization header

**Nguyên nhân:** Đang dùng `axios` trực tiếp thay vì `apiClient`

**Giải pháp:**
```typescript
// ❌ Sai
import axios from 'axios';
await axios.get('/api/users');

// ✅ Đúng
import { apiClient } from '../lib/apiClient';
await apiClient.get('/users');
```

---

## 📊 Flow Chart

```
┌─────────────────┐
│   User Action   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Call Service   │ (e.g. articleService.list())
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   apiClient     │ ← Auto add Authorization header
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌─────┐
│ 200   │ │ 401 │
│  OK   │ │Error│
└───┬───┘ └──┬──┘
    │        │
    │        ▼
    │   ┌────────────────┐
    │   │ Auto Refresh   │
    │   │     Token      │
    │   └────────┬───────┘
    │            │
    │            ▼
    │   ┌────────────────┐
    │   │  Retry Request │
    │   │  with new token│
    │   └────────┬───────┘
    │            │
    └────────────┘
         │
         ▼
┌─────────────────┐
│  Return Data    │
│  to Component   │
└─────────────────┘
```

---

## 🤝 Làm việc với Team qua GitHub

### ✅ Best Practices

1. **KHÔNG commit .env**
   ```bash
   # File này đã được git ignore
   frontend/.env
   ```

2. **CẬP NHẬT env.example** khi thêm config mới
   ```bash
   # Nếu thêm biến mới, update file này
   frontend/env.example
   ```

3. **DÙNG apiClient cho mọi API call**
   - Không dùng axios trực tiếp
   - Không truy cập localStorage trực tiếp để lấy token

4. **REVIEW CODE** - Check xem có ai dùng sai không
   ```bash
   # Search trong code
   grep -r "localStorage.getItem('accessToken')" src/
   grep -r "axios.get" src/services/
   ```

### 📝 Pull Request Checklist

- [ ] Không commit file `.env`
- [ ] Tất cả API calls dùng `apiClient`
- [ ] Không có `localStorage.getItem('accessToken')` trong services
- [ ] Không import `axios` trong services (chỉ dùng `apiClient`)
- [ ] Update `env.example` nếu thêm config mới

---

## 🆘 Support

Nếu gặp vấn đề:

1. Check file `.env` có đúng config không
2. Check backend có đang chạy không
3. Xem Console trong DevTools (F12)
4. Xem Network tab để debug API calls
5. Hỏi team lead hoặc tạo GitHub Issue

---

## 📚 Tài liệu liên quan

- [Backend CORS Setup](../backend/README-CORS.md)
- [Frontend Setup](./README-SETUP.md)
- [Testing Guide](./TESTING-GUIDE.md)

---

**Last Updated:** October 2024  
**Version:** 2.0  
**Author:** MEDIX Development Team


