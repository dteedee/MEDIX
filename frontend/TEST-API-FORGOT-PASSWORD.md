# Test API Forgot Password

## 🧪 **Test API Endpoints**

### 1. **Test sendForgotPasswordCode:**
```bash
curl -X POST "http://localhost:5123/api/auth/sendForgotPasswordCode" \
  -H "Content-Type: application/json" \
  -d '"dungdoile1@gmail.com"'
```

### 2. **Test verifyForgotPasswordCode:**
```bash
curl -X POST "http://localhost:5123/api/auth/verifyForgotPasswordCode" \
  -H "Content-Type: application/json" \
  -d '{"email": "dungdoile1@gmail.com", "code": "123456"}'
```

### 3. **Test resendForgotPasswordCode:**
```bash
curl -X POST "http://localhost:5123/api/auth/resendForgotPasswordCode" \
  -H "Content-Type: application/json" \
  -d '"dungdoile1@gmail.com"'
```

## 🔍 **Expected Responses:**

### **sendForgotPasswordCode:**
```json
"123456"  // 6-digit code
```

### **verifyForgotPasswordCode:**
```json
{
  "message": "Xác thực thành công"
}
```

### **resendForgotPasswordCode:**
```json
"789012"  // New 6-digit code
```

## 🐛 **Troubleshooting:**

### **Nếu API lỗi:**
1. **Check Backend Console**: Xem error logs
2. **Check Database**: EmailVerificationCodes table
3. **Check Email Settings**: appsettings.json
4. **Check CORS**: Backend CORS configuration

### **Nếu API thành công nhưng Frontend lỗi:**
1. **Check Network Tab**: Xem API calls
2. **Check Console**: JavaScript errors
3. **Check Frontend Code**: API calls trong authService

## 🚀 **Quick Test:**

### **1. Test Backend trực tiếp:**
```bash
# Test send code
curl -X POST "http://localhost:5123/api/auth/sendForgotPasswordCode" \
  -H "Content-Type: application/json" \
  -d '"test@example.com"'

# Response should be: "123456" (6-digit code)
```

### **2. Test Frontend:**
1. Vào `/forgot-password`
2. Nhập email: `dungdoile1@gmail.com`
3. Click "Gửi mã xác thực"
4. Check Network tab xem API call
5. Check Backend console xem logs

### **3. Check Backend Logs:**
Backend console should show:
```
=== FORGOT PASSWORD CODE FOR dungdoile1@gmail.com: 123456 ===
```

## 📋 **Debug Checklist:**

- [ ] Backend đang chạy trên port 5123
- [ ] API endpoint `/api/auth/sendForgotPasswordCode` accessible
- [ ] Database connection hoạt động
- [ ] EmailVerificationCodes table tồn tại
- [ ] Email settings configured
- [ ] Frontend gọi đúng API endpoint
- [ ] CORS configured correctly
- [ ] No JavaScript errors in console
