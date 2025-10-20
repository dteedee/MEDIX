# Debug Header - User Display Issue

## 🔍 **Vấn đề hiện tại:**
- Header vẫn hiển thị "Đăng nhập" và "Đăng ký" thay vì thông tin user
- Có thể user đã đăng nhập nhưng Header không nhận diện được

## 🧪 **Cách debug:**

### 1. **Kiểm tra localStorage trong Browser:**
1. Mở Developer Tools (F12)
2. Vào tab "Application" hoặc "Storage"
3. Kiểm tra "Local Storage" → `http://localhost:5173`
4. Tìm các keys:
   - `currentUser`
   - `userData`
   - `accessToken`
   - `refreshToken`

### 2. **Kiểm tra Console:**
```javascript
// Chạy trong browser console
console.log('currentUser:', localStorage.getItem('currentUser'));
console.log('userData:', localStorage.getItem('userData'));
console.log('accessToken:', localStorage.getItem('accessToken'));
```

### 3. **Test Header Component:**
```javascript
// Kiểm tra state của Header component
// Trong React DevTools, tìm Header component và xem state
```

## 🔧 **Các nguyên nhân có thể:**

### **1. User chưa đăng nhập:**
- localStorage không có `currentUser`
- Cần đăng nhập trước

### **2. AuthContext không lưu đúng:**
- AuthContext lưu vào `userData` nhưng Header tìm `currentUser`
- Đã sửa: AuthContext lưu vào cả 2 keys

### **3. Event không được dispatch:**
- Sau khi login, `authChanged` event không được dispatch
- Header không cập nhật state

### **4. Timing issue:**
- Header render trước khi user data được lưu
- useEffect không chạy đúng

## 🚀 **Cách test:**

### **1. Đăng nhập và kiểm tra:**
1. Vào `/login`
2. Đăng nhập với tài khoản hợp lệ
3. Kiểm tra localStorage có `currentUser` không
4. Kiểm tra Header có hiển thị thông tin user không

### **2. Manual test:**
```javascript
// Chạy trong console để test
localStorage.setItem('currentUser', JSON.stringify({
  fullName: 'Test User',
  email: 'test@example.com',
  role: 'USER'
}));
window.dispatchEvent(new Event('authChanged'));
```

### **3. Kiểm tra AuthContext:**
- Xem AuthContext có dispatch `authChanged` event không
- Xem AuthContext có lưu vào `currentUser` không

## 📋 **Checklist:**

- [ ] User đã đăng nhập thành công
- [ ] localStorage có `currentUser` key
- [ ] `currentUser` có đúng format JSON
- [ ] Header component nhận được `authChanged` event
- [ ] Header state được cập nhật
- [ ] UI hiển thị thông tin user

## 🎯 **Expected Result:**
Sau khi đăng nhập thành công:
- Header hiển thị: "Xin chào, [Tên] ([Role])"
- Button "Đăng xuất" thay vì "Đăng nhập"/"Đăng ký"
- localStorage có `currentUser` với thông tin user
