# OTP Principle Explanation

## 1. 📋 **Nguyên lý OTP hiện tại (phiên bản tạm thời)**

### **🔧 Cách hoạt động:**

#### **A. Gửi OTP (`sendForgotPasswordCode`):**
```csharp
var verificationCode = new Random().Next(100000, 999999).ToString();
Console.WriteLine($"=== FORGOT PASSWORD CODE FOR {email}: {verificationCode} ===");
// Gửi email với mã code
return verificationCode;
```

#### **B. Verify OTP (`verifyForgotPasswordCode`):**
```csharp
// TEMPORARY: Accept any 6-digit code for testing
if (request.Code.Length == 6 && request.Code.All(char.IsDigit))
{
    return Ok(new { message = "Xác thực thành công" });
}
```

#### **C. Reset Password (`resetPassword`):**
```csharp
// TEMPORARY: Skip database validation
Console.WriteLine($"=== RESET PASSWORD FOR {email} WITH CODE {code} ===");
// Cập nhật password trong database
```

### **⏰ Thời hạn OTP:**
- **Thiết kế gốc**: 10 phút (`AddMinutes(10)`)
- **Hiện tại**: **KHÔNG CÓ GIỚI HẠN** (vì bỏ qua database validation)

### **🔄 Logic OTP cũ vs mới:**

#### **Scenario: Gửi OTP nhiều lần**
1. **Gửi OTP lần 1**: Mã `123456` → Log ra console
2. **Gửi OTP lần 2**: Mã `789012` → Log ra console  
3. **Có thể dùng OTP 1 không?**: **CÓ** ✅
4. **Có thể dùng OTP 2 không?**: **CÓ** ✅
5. **Có thể dùng mã bất kỳ không?**: **CÓ** ✅ (miễn là 6 chữ số)

### **🔒 Bảo mật hiện tại:**
- **Rất thấp** - chỉ để test
- **Accept bất kỳ mã 6 chữ số nào**
- **Không kiểm tra thời hạn**
- **Không kiểm tra đã sử dụng chưa**

## 2. 🏗️ **Nguyên lý OTP đầy đủ (khi có database)**

### **📊 Database Schema:**
```sql
CREATE TABLE EmailVerificationCodes (
    Id int IDENTITY(1,1) PRIMARY KEY,
    Email nvarchar(max) NOT NULL,
    Code nvarchar(max) NOT NULL,
    ExpirationTime datetime2 NOT NULL,
    IsUsed bit NOT NULL DEFAULT 0
);
```

### **🔧 Logic đầy đủ:**

#### **A. Gửi OTP:**
1. **Tạo mã 6 chữ số** random
2. **Lưu vào database** với thời hạn 10 phút
3. **Gửi email** với mã code
4. **Log ra console** (để debug)

#### **B. Verify OTP:**
1. **Tìm mã trong database** theo email + code
2. **Kiểm tra chưa sử dụng** (`IsUsed = false`)
3. **Kiểm tra chưa hết hạn** (`ExpirationTime > now`)
4. **Đánh dấu đã sử dụng** (`IsUsed = true`)

#### **C. Reset Password:**
1. **Verify OTP** (như trên)
2. **Cập nhật password** trong Users table
3. **Đánh dấu OTP đã sử dụng**

### **⏰ Thời hạn OTP đầy đủ:**
- **10 phút** từ lúc tạo
- **Sau 10 phút**: OTP không hợp lệ
- **Sau khi sử dụng**: OTP không thể dùng lại

### **🔄 Logic OTP đầy đủ:**

#### **Scenario: Gửi OTP nhiều lần**
1. **Gửi OTP lần 1**: Mã `123456` → Lưu DB (hết hạn sau 10 phút)
2. **Gửi OTP lần 2**: Mã `789012` → Lưu DB (hết hạn sau 10 phút)
3. **Có thể dùng OTP 1 không?**: **CÓ** (nếu chưa hết hạn và chưa dùng)
4. **Có thể dùng OTP 2 không?**: **CÓ** (nếu chưa hết hạn và chưa dùng)
5. **Sau khi dùng OTP 1**: OTP 1 không thể dùng lại, OTP 2 vẫn dùng được

## 3. 🚀 **Cách kích hoạt OTP đầy đủ**

### **Bước 1: Tạo database table**
```sql
-- Chạy script này trong SQL Server
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmailVerificationCodes' AND xtype='U')
BEGIN
    CREATE TABLE [EmailVerificationCodes] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [Code] nvarchar(max) NOT NULL,
        [ExpirationTime] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL DEFAULT 0,
        CONSTRAINT [PK_EmailVerificationCodes] PRIMARY KEY ([Id])
    );
END
```

### **Bước 2: Uncomment code trong AuthController và AuthService**
- Bỏ comment các phần database code
- Xóa các phần "TEMPORARY" code

### **Bước 3: Test lại**
- OTP sẽ có thời hạn 10 phút
- OTP đã sử dụng không thể dùng lại
- Bảo mật cao hơn

## 4. 📋 **Tóm tắt**

### **Hiện tại (Test Mode):**
- ✅ **Hoạt động**: Gửi OTP, verify, reset password
- ⚠️ **Bảo mật**: Thấp (accept bất kỳ mã 6 chữ số nào)
- ⏰ **Thời hạn**: Không có giới hạn
- 🔄 **Tái sử dụng**: Có thể dùng mã cũ

### **Khi có database (Production Mode):**
- ✅ **Hoạt động**: Gửi OTP, verify, reset password
- 🔒 **Bảo mật**: Cao (kiểm tra database, thời hạn, đã sử dụng)
- ⏰ **Thời hạn**: 10 phút
- 🔄 **Tái sử dụng**: Không thể dùng mã đã sử dụng
