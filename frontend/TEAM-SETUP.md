# 🚀 Quick Setup Guide cho Team Members

## ⚡ Setup nhanh trong 5 phút

### 1️⃣ Clone & Install
```bash
git clone <repository-url>
cd MEDIX/frontend
npm install
```

### 2️⃣ Tạo file .env
```bash
# Windows
copy env.example .env

# Mac/Linux
cp env.example .env
```

### 3️⃣ Chạy thử
```bash
npm run dev
```

✅ Frontend sẽ chạy tại: http://localhost:5173

---

## 🔑 apiClient - Điều cần biết

### ✅ apiClient là gì?
- **Singleton instance** dùng chung toàn app
- **Tự động quản lý token** (access token + refresh token)
- **Tự động refresh** khi token hết hạn
- Mọi người trong team đều dùng **CÙNG 1 instance**

### ✅ Người khác có biết không?
**CÓ!** Vì:
- apiClient được export trong `src/lib/apiClient.ts`
- Tất cả services đã được refactor để dùng apiClient
- Khi clone code về, mọi người đều có cùng code
- Không cần config thêm gì

### ✅ Cách dùng trong code

```typescript
// Import apiClient
import { apiClient } from '../lib/apiClient';

// Gọi API
const response = await apiClient.get('/users');
const data = response.data;
```

**LƯU Ý:** Không cần thêm Authorization header, apiClient tự động làm!

---

## 📋 Rules cho Team

### ❌ KHÔNG BAO GIỜ làm:

1. **Commit file .env lên Git**
   ```bash
   # File này đã được git ignore
   # Mỗi người có .env riêng với config riêng
   ```

2. **Truy cập localStorage trực tiếp để lấy token**
   ```typescript
   // ❌ WRONG
   const token = localStorage.getItem('accessToken');
   
   // ✅ CORRECT - Để apiClient tự động xử lý
   await apiClient.get('/users');
   ```

3. **Dùng axios trực tiếp trong services**
   ```typescript
   // ❌ WRONG
   import axios from 'axios';
   await axios.get('/api/users');
   
   // ✅ CORRECT
   import { apiClient } from '../lib/apiClient';
   await apiClient.get('/users');
   ```

### ✅ PHẢI làm:

1. **Update env.example** khi thêm config mới
2. **Dùng apiClient** cho mọi API call
3. **Dùng AuthContext** cho login/logout
4. **Review code** trước khi push

---

## 🔄 Workflow khi có người thêm config mới

### Người A thêm config:
```bash
# 1. Thêm vào .env của mình
VITE_NEW_CONFIG=some_value

# 2. Update env.example
echo "VITE_NEW_CONFIG=your_value_here" >> env.example

# 3. Commit env.example (KHÔNG commit .env)
git add env.example
git commit -m "Add new config: VITE_NEW_CONFIG"
git push
```

### Người B pull code:
```bash
# 1. Pull code mới
git pull

# 2. Check env.example xem có config mới không
cat env.example

# 3. Update .env của mình
echo "VITE_NEW_CONFIG=my_value" >> .env

# 4. Restart dev server
npm run dev
```

---

## 🐛 Troubleshooting nhanh

### Lỗi: "Cannot find module '../lib/apiClient'"
```bash
# Chưa install dependencies
npm install
```

### Lỗi: API call bị CORS
```bash
# Check backend có chạy không
# Check .env có đúng API URL không
cat .env

# Restart cả backend và frontend
```

### Lỗi: 401 Unauthorized liên tục
```bash
# Clear localStorage và login lại
# Mở DevTools (F12) → Console:
localStorage.clear()
# Reload trang và login lại
```

### Lỗi: Token không tự động refresh
```bash
# Check apiClient.ts có interceptor không
# File: src/lib/apiClient.ts (line 38-75)
# Nếu không có → pull code mới nhất
```

---

## 📚 Tài liệu đầy đủ

Đọc thêm: [README-APICLIENT.md](./README-APICLIENT.md)

---

## ✅ Checklist trước khi commit

- [ ] Không commit file `.env`
- [ ] Tất cả API calls dùng `apiClient` (không dùng axios trực tiếp)
- [ ] Không có `localStorage.getItem('accessToken')` trong services
- [ ] Đã test trên local
- [ ] Update `env.example` nếu thêm config mới

---

## 🆘 Cần giúp đỡ?

1. Đọc [README-APICLIENT.md](./README-APICLIENT.md)
2. Check Console trong DevTools (F12)
3. Hỏi team lead
4. Tạo GitHub Issue

---

**Happy Coding! 🎉**


