# Test Lockout Feature

## Mô tả tính năng
Tính năng khóa tài khoản khi đăng nhập sai nhiều lần:

### Logic khóa tài khoản:
- **Lần 1-4**: Chỉ tăng `AccessFailedCount`, không khóa
- **Lần 5**: Khóa tài khoản trong **1 phút**
- **Lần 6**: Khóa tài khoản trong **3 phút**  
- **Lần 7**: Khóa tài khoản trong **5 phút**
- **Lần 8**: Khóa tài khoản **vĩnh viễn** (`LockoutEnabled = true`)

### Khi đăng nhập thành công:
- Reset `AccessFailedCount = 0`
- Reset `LockoutEnd = null`

## Cách test

### 1. Test khóa tạm thời (1 phút)
```bash
# Đăng nhập sai mật khẩu 5 lần liên tiếp
# Lần 1-4: Hiển thị "Sai tên đăng nhập/email hoặc mật khẩu"
# Lần 5: Hiển thị "Tài khoản của bạn đã bị khóa trong 1 phút 0 giây"
```

### 2. Test khóa tạm thời (3 phút)
```bash
# Sau khi hết thời gian khóa 1 phút, đăng nhập sai thêm 1 lần
# Lần 6: Hiển thị "Tài khoản của bạn đã bị khóa trong 3 phút 0 giây"
```

### 3. Test khóa tạm thời (5 phút)
```bash
# Sau khi hết thời gian khóa 3 phút, đăng nhập sai thêm 1 lần
# Lần 7: Hiển thị "Tài khoản của bạn đã bị khóa trong 5 phút 0 giây"
```

### 4. Test khóa vĩnh viễn
```bash
# Sau khi hết thời gian khóa 5 phút, đăng nhập sai thêm 1 lần
# Lần 8: Hiển thị "Tài khoản bị khóa vĩnh viễn, vui lòng liên hệ bộ phận hỗ trợ"
```

### 5. Test đăng nhập thành công
```bash
# Đăng nhập với mật khẩu đúng
# Kết quả: Reset AccessFailedCount = 0, LockoutEnd = null
```

## Kiểm tra Database

### Kiểm tra trạng thái user:
```sql
SELECT 
    Id,
    Email,
    AccessFailedCount,
    LockoutEnabled,
    LockoutEnd,
    CASE 
        WHEN LockoutEnabled = 1 THEN 'Khóa vĩnh viễn'
        WHEN LockoutEnd IS NOT NULL AND LockoutEnd > GETUTCDATE() THEN 'Khóa tạm thời'
        ELSE 'Bình thường'
    END as Status
FROM Users 
WHERE Email = 'test@example.com'
```

### Reset trạng thái user (để test lại):
```sql
UPDATE Users 
SET 
    AccessFailedCount = 0,
    LockoutEnabled = 0,
    LockoutEnd = NULL
WHERE Email = 'test@example.com'
```

## Frontend Features

### 1. Countdown Timer
- Hiển thị thời gian còn lại với format `MM:SS`
- Cập nhật mỗi giây
- Tự động ẩn khi hết thời gian

### 2. Lockout Message UI
- Icon cảnh báo màu đỏ
- Thông báo rõ ràng về trạng thái khóa
- Hướng dẫn người dùng liên hệ hỗ trợ

### 3. Responsive Design
- Tối ưu cho mobile và desktop
- Animation slide-in khi hiển thị

## API Endpoints

### Login Endpoint
```
POST /api/auth/login
```

**Request:**
```json
{
  "identifier": "email@example.com",
  "password": "wrongpassword"
}
```

**Response khi bị khóa tạm thời:**
```json
{
  "message": "Tài khoản của bạn đã bị khóa trong 1 phút 0 giây. Hãy thử lại sau khoảng thời gian này hoặc liên hệ hỗ trợ. Thời gian còn lại: 1 phút 0 giây."
}
```

**Response khi bị khóa vĩnh viễn:**
```json
{
  "message": "Tài khoản bị khóa vĩnh viễn, vui lòng liên hệ bộ phận hỗ trợ"
}
```

## Security Notes

1. **Không tiết lộ thông tin**: Không cho biết user có tồn tại hay không
2. **Rate Limiting**: Có thể kết hợp với rate limiting ở API level
3. **Audit Log**: Nên log các lần đăng nhập thất bại để phân tích
4. **Admin Override**: Admin có thể reset trạng thái khóa của user

## Troubleshooting

### Nếu countdown không hoạt động:
1. Kiểm tra console browser có lỗi JavaScript không
2. Kiểm tra regex parse thời gian trong `parseLockoutMessage`
3. Kiểm tra useEffect dependencies

### Nếu không khóa tài khoản:
1. Kiểm tra database có các trường lockout không
2. Kiểm tra AuthService có gọi `HandleFailedLoginAsync` không
3. Kiểm tra UserRepository có update được không

