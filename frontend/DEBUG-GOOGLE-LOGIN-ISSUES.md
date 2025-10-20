# Debug Google Login Issues

## 🔧 **Vấn đề hiện tại:**
1. **Alerts vẫn không hiển thị** trên màn hình
2. **Google login thành công** nhưng không redirect, phải F5 mới chuyển

## 🚀 **Cách debug:**

### **1. Test Google Login với Debug Logs:**

#### **A. Mở Developer Tools:**
1. **Mở F12** → **Console tab**
2. **Clear console** để dễ theo dõi

#### **B. Thực hiện Google Login:**
1. **Vào trang login**
2. **Click "Đăng nhập với Google"**
3. **Chọn tài khoản Google**

#### **C. Kiểm tra Console Logs:**
**Expected logs:**
```bash
# 1. Google login response
"Google login response: {accessToken: '...', refreshToken: '...', user: {...}}"

# 2. User data (nếu có)
"Google login user data: {id: 1, email: '...', role: 'ADMIN', ...}"

# 3. Success message
"Setting Google success message..."

# 4. Success state in render
"Success state in render: Đăng nhập bằng Google thành công"

# 5. Current user from localStorage
"Current user from localStorage: {"id":1,"email":"...","role":"ADMIN",...}"

# 6. User role for redirect
"User role for redirect: ADMIN"

# 7. Redirect action
"Redirecting to /app/admin"
```

### **2. Troubleshooting:**

#### **A. Nếu không có "Google login response":**
- **Vấn đề**: `authService.loginWithGoogle` không hoạt động
- **Giải pháp**: Kiểm tra backend API `/auth/google-login`

#### **B. Nếu có "No user data in Google login response":**
- **Vấn đề**: Backend không trả về user data
- **Giải pháp**: Kiểm tra backend response structure

#### **C. Nếu có "Success state in render: null":**
- **Vấn đề**: State không được set đúng
- **Giải pháp**: Kiểm tra React state management

#### **D. Nếu có "Current user from localStorage: null":**
- **Vấn đề**: User data không được lưu vào localStorage
- **Giải pháp**: Kiểm tra localStorage.setItem

#### **E. Nếu có "User role for redirect: USER":**
- **Vấn đề**: Role không đúng hoặc không có
- **Giải pháp**: Kiểm tra user data structure

#### **F. Nếu có "Redirecting to /app/admin" nhưng không redirect:**
- **Vấn đề**: Route không tồn tại hoặc navigate không hoạt động
- **Giải pháp**: Kiểm tra routes trong App.tsx

### **3. Kiểm tra Alerts:**

#### **A. Test Alert (nếu có):**
1. **Kiểm tra** có thấy "🔧 DEBUG: Test Alert - Always Visible" không?
2. **Nếu KHÔNG thấy** → Vấn đề với CSS/rendering
3. **Nếu THẤY** → Vấn đề với state management

#### **B. Success Alert:**
1. **Kiểm tra** có thấy "✅ Đăng nhập bằng Google thành công" không?
2. **Nếu KHÔNG thấy** → Vấn đề với successMsg state
3. **Nếu THẤY** → Vấn đề với redirect logic

### **4. Kiểm tra localStorage:**

#### **A. Mở Developer Tools:**
1. **F12** → **Application tab** → **Local Storage**
2. **Kiểm tra** có `currentUser` và `userData` không?

#### **B. Expected localStorage:**
```json
{
  "currentUser": "{\"id\":1,\"email\":\"user@example.com\",\"role\":\"ADMIN\",\"fullName\":\"User Name\"}",
  "userData": "{\"id\":1,\"email\":\"user@example.com\",\"role\":\"ADMIN\",\"fullName\":\"User Name\"}",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **5. Kiểm tra Routes:**

#### **A. Mở Developer Tools:**
1. **F12** → **Console tab**
2. **Gõ lệnh**:
```javascript
// Kiểm tra routes
console.log('Current location:', window.location.pathname);
console.log('Available routes:', ['/app/admin', '/app/manager', '/app/doctor', '/app/patient', '/app/dashboard']);
```

#### **B. Kiểm tra App.tsx:**
1. **Mở** `frontend/src/App.tsx`
2. **Kiểm tra** có routes `/app/admin`, `/app/manager`, etc. không?

## 📋 **Expected Results:**

### **Console Logs:**
- ✅ **Google login response**: Có user data
- ✅ **Google login user data**: Có role đúng
- ✅ **Setting Google success message**: Success
- ✅ **Success state in render**: Có message
- ✅ **Current user from localStorage**: Có user data
- ✅ **User role for redirect**: Role đúng
- ✅ **Redirecting to /app/[role]**: Success

### **Alerts:**
- ✅ **Success alert**: "✅ Đăng nhập bằng Google thành công"
- ✅ **Màu xanh**: Background #f0fdf4, text #166534
- ✅ **Hiển thị 5 giây**: Auto-hide

### **Redirect:**
- ✅ **Sau 1.2 giây**: Redirect vào dashboard theo role
- ✅ **Không cần F5**: Tự động chuyển trang

### **localStorage:**
- ✅ **currentUser**: Có user data với role
- ✅ **userData**: Có user data
- ✅ **accessToken**: Có token
- ✅ **refreshToken**: Có refresh token

## 🔍 **Common Issues:**

### **1. Backend không trả về user data:**
```bash
# Console log:
"Google login response: {accessToken: '...', refreshToken: '...'}"
"No user data in Google login response"

# Giải pháp: Kiểm tra backend API response
```

### **2. State không được set:**
```bash
# Console log:
"Setting Google success message..."
"Success state in render: null"

# Giải pháp: Kiểm tra React state management
```

### **3. localStorage không được lưu:**
```bash
# Console log:
"Google login user data: {...}"
"Current user from localStorage: null"

# Giải pháp: Kiểm tra localStorage.setItem
```

### **4. Route không tồn tại:**
```bash
# Console log:
"Redirecting to /app/admin"
# Nhưng không redirect

# Giải pháp: Kiểm tra routes trong App.tsx
```

## 📝 **Lưu ý:**
- **Debug logs** sẽ giúp xác định chính xác vấn đề
- **Console logs** hiển thị từng bước của quá trình
- **localStorage** cần có user data với role đúng
- **Routes** cần tồn tại trong App.tsx
- **State management** cần hoạt động đúng

**Hãy thực hiện Google login và cho tôi biết console logs hiển thị gì!** 🔍
