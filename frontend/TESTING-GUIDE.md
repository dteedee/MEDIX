# Testing Guide - MEDIX Frontend

## 🧪 Testing Forgot Password Feature

### 1. Test OTP Input Display
1. **Navigate to Forgot Password**: Go to `/forgot-password`
2. **Enter Valid Email**: Input an email that exists in the system
3. **Click "Gửi mã xác thực"**: Should show loading state
4. **Verify OTP Section Appears**: After sending, should show:
   - Message: "📧 Mã xác nhận đã được gửi đến email [email]"
   - Input field for 6-digit OTP code
   - "Xác nhận" button
   - "Gửi lại" button with countdown timer

### 2. Test Email Sending
1. **Check Backend Logs**: Verify email service is working
2. **Check Email Inbox**: Look for verification code email
3. **Verify Email Content**: Should contain 6-digit code

### 3. Test OTP Verification
1. **Enter OTP Code**: Input the 6-digit code from email
2. **Click "Xác nhận"**: Should redirect to reset password page
3. **Verify URL Parameters**: Should have `email` and `code` parameters

## 🔐 Testing Login & Header Update

### 1. Test Login with Username/Email
1. **Navigate to Login**: Go to `/login`
2. **Test with Email**: Enter email address and password
3. **Test with Username**: Enter username and password
4. **Verify Login Success**: Should redirect to home page

### 2. Test Header After Login
1. **Check Header Display**: Should show:
   - "Xin chào, [Full Name] ([Role])"
   - "Đăng xuất" button
   - Hide "Đăng nhập" and "Đăng ký" buttons
2. **Test Logout**: Click "Đăng xuất" should:
   - Clear user data
   - Show login/register buttons again
   - Redirect to home page

## 🐛 Troubleshooting

### Forgot Password Issues
- **OTP Input Not Showing**: Check CSS classes in RegistrationPage.css
- **Email Not Sending**: Verify EmailSettings in backend appsettings.json
- **API Errors**: Check browser console for network errors

### Header Issues
- **User Info Not Showing**: Check localStorage for 'currentUser' key
- **Login State Not Persisting**: Verify AuthContext is saving user data
- **Logout Not Working**: Check if authService.logout() is called

### Common Issues
1. **CORS Errors**: Ensure backend CORS is configured for frontend origin
2. **API Connection**: Verify backend is running on port 5123
3. **Environment Variables**: Check .env file has correct VITE_API_BASE_URL

## 📋 Test Checklist

### Forgot Password
- [ ] Email input field displays correctly
- [ ] "Gửi mã xác thực" button works
- [ ] OTP input section appears after sending
- [ ] Email is actually sent (check inbox)
- [ ] OTP verification works
- [ ] Redirect to reset password page
- [ ] Resend functionality works with countdown

### Login & Header
- [ ] Login with email works
- [ ] Login with username works
- [ ] Header shows user greeting after login
- [ ] User role is displayed correctly
- [ ] Logout button works
- [ ] Header reverts to login/register after logout
- [ ] Login state persists on page refresh

### General
- [ ] No console errors
- [ ] All API calls return expected responses
- [ ] UI is responsive on mobile
- [ ] Loading states work correctly
- [ ] Error messages display properly
