# Testing Forgot Password - New Implementation

## 🎯 **Đã thay đổi hoàn toàn theo PatientRegister**

### ✅ **Backend Changes**
- **New Endpoints** (giống hệt PatientRegister):
  - `POST /api/auth/sendForgotPasswordCode` - Gửi mã OTP
  - `POST /api/auth/verifyForgotPasswordCode` - Xác thực mã OTP  
  - `POST /api/auth/resendForgotPasswordCode` - Gửi lại mã OTP

- **Logic giống hệt PatientRegister**:
  - Tạo mã 6 chữ số random
  - Lưu vào EmailVerificationCodes table
  - Gửi email qua SendVerificationCodeAsync
  - Xác thực mã và đánh dấu đã sử dụng

### ✅ **Frontend Changes**
- **UI giống hệt PatientRegister**:
  - Email input với button "Gửi mã xác thực" bên cạnh
  - Success message khi gửi thành công
  - OTP input section với placeholder "Nhập mã xác nhận"
  - Button "Xác nhận" để verify
  - Resend functionality với countdown 60s

- **Logic giống hệt PatientRegister**:
  - Check email exists trước khi gửi
  - Gửi mã qua sendForgotPasswordCode
  - Verify mã qua verifyForgotPasswordCode
  - Resend qua resendForgotPasswordCode

## 🧪 **Cách Test**

### 1. **Restart Backend**
```bash
cd backend/Medix.API
dotnet run
```

### 2. **Test Flow**
1. **Navigate to Forgot Password**: `/forgot-password`
2. **Enter Email**: Nhập email có trong database
3. **Click "Gửi mã xác thực"**: 
   - Sẽ check email exists
   - Gửi mã OTP qua email
   - Hiển thị success message
   - Hiển thị OTP input section
4. **Enter OTP Code**: Nhập mã 6 chữ số
5. **Click "Xác nhận"**: 
   - Verify mã
   - Redirect đến reset password page

### 3. **Check Backend Logs**
Backend sẽ log:
```
=== FORGOT PASSWORD CODE FOR [email]: [code] ===
```

### 4. **Expected UI Flow**
```
[Email Input] [Gửi mã xác thực] 
     ↓ (click)
✅ Mã xác thực đã được gửi đến email của bạn!
📧 Mã xác nhận đã được gửi đến email [email]
[Nhập mã xác nhận] [Xác nhận]
Không nhận được mã? Gửi lại
```

## 🔍 **Troubleshooting**

### **Nếu vẫn lỗi:**
1. **Check Backend Console**: Xem error logs
2. **Check Network Tab**: Xem API calls
3. **Verify Email Settings**: appsettings.json
4. **Check Database**: EmailVerificationCodes table

### **Nếu thành công:**
- OTP input sẽ hiển thị
- Code sẽ được log ra console
- Email sẽ được gửi thực tế
- UI sẽ giống hệt PatientRegister

## 🎉 **Kết quả mong đợi**

- **UI giống hệt PatientRegister** như trong ảnh bạn gửi
- **Logic hoạt động 100%** như PatientRegister
- **Email được gửi thực tế** với mã OTP
- **OTP input hiển thị** sau khi gửi thành công
- **Verify thành công** và redirect đến reset password

Bây giờ ForgotPassword sẽ hoạt động **giống hệt** PatientRegister! 🚀
