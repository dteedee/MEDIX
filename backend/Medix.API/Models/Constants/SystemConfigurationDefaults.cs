using System;
using System.Collections.Generic;
using System.Linq;
using Medix.API.Models.Entities;

namespace Medix.API.Models.Constants
{
    public static class SystemConfigurationDefaults
    {
        public static readonly IReadOnlyList<SystemConfiguration> Maintenance = new List<SystemConfiguration>
        {
            new()
            {
                ConfigKey = "MAINTENANCE_MODE",
                ConfigValue = "false",
                DataType = "bool",
                Category = "SYSTEM",
                Description = "Bật hoặc tắt chế độ bảo trì cho toàn hệ thống",
                IsActive = true
            },
            new()
            {
                ConfigKey = "MAINTENANCE_MESSAGE",
                ConfigValue = "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
                DataType = "string",
                Category = "SYSTEM",
                Description = "Thông báo hiển thị khi bật chế độ bảo trì",
                IsActive = true
            },
            new()
            {
                ConfigKey = "MAINTENANCE_SCHEDULE",
                ConfigValue = "",
                DataType = "string",
                Category = "SYSTEM",
                Description = "Thời gian dự kiến kết thúc bảo trì (ISO 8601)",
                IsActive = true
            },
            new()
            {
                ConfigKey = "DEFAULT_LANGUAGE",
                ConfigValue = "vi",
                DataType = "string",
                Category = "SYSTEM",
                Description = "Ngôn ngữ mặc định của giao diện người dùng",
                IsActive = true
            }
        };

        public static readonly IReadOnlyList<SystemConfiguration> EmailServer = new List<SystemConfiguration>
        {
            new()
            {
                ConfigKey = "EMAIL_ENABLED",
                ConfigValue = "true",
                DataType = "bool",
                Category = "EMAIL_SERVER",
                Description = "Bật/tắt tính năng gửi email hệ thống",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_SMTP_SERVER",
                ConfigValue = "smtp.gmail.com",
                DataType = "string",
                Category = "EMAIL_SERVER",
                Description = "Địa chỉ máy chủ SMTP",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_SMTP_PORT",
                ConfigValue = "587",
                DataType = "int",
                Category = "EMAIL_SERVER",
                Description = "Cổng SMTP",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_SECURITY",
                ConfigValue = "STARTTLS",
                DataType = "string",
                Category = "EMAIL_SERVER",
                Description = "Tùy chọn bảo mật (NONE, STARTTLS, SSL)",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_USERNAME",
                ConfigValue = "",
                DataType = "string",
                Category = "EMAIL_SERVER",
                Description = "Tên đăng nhập SMTP",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_PASSWORD",
                ConfigValue = "",
                DataType = "string",
                Category = "EMAIL_SERVER",
                Description = "Mật khẩu SMTP (được mã hóa/ẩn trên giao diện)",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_FROM_EMAIL",
                ConfigValue = "",
                DataType = "string",
                Category = "EMAIL_SERVER",
                Description = "Địa chỉ email hiển thị ở phần người gửi",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_FROM_NAME",
                ConfigValue = "Medix Notifications",
                DataType = "string",
                Category = "EMAIL_SERVER",
                Description = "Tên hiển thị của người gửi",
                IsActive = true
            }
        };

        public static readonly IReadOnlyList<SystemConfiguration> AIChatDefaults = new List<SystemConfiguration>
        {
            new()
            {
                ConfigKey = "AI_DAILY_ACCESS_LIMIT",
                ConfigValue = "50",
                DataType = "int",
                Category = "AI_CHAT",
                Description = "Số lượt truy cập AI tối đa trong 1 ngày",
                IsActive = true
            }
        };

        public static readonly IReadOnlyList<SystemConfiguration> EmailTemplates = new List<SystemConfiguration>
        {
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_PASSWORD_RESET_SUBJECT",
                ConfigValue = "Đặt lại mật khẩu Medix",
                DataType = "string",
                Category = "EMAIL_TEMPLATE",
                Description = "Tiêu đề email gửi liên kết đặt lại mật khẩu",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_PASSWORD_RESET_BODY",
                ConfigValue = @"<h2>Yêu cầu đặt lại mật khẩu</h2>
<p>Bạn hoặc ai đó đã yêu cầu đặt lại mật khẩu cho tài khoản: <strong>{{email}}</strong></p>
<p>Nhấp vào liên kết sau để đặt lại mật khẩu của bạn:</p>
<p><a href=""{{reset_link}}"">Đặt lại mật khẩu</a></p>
<p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>",
                DataType = "html",
                Category = "EMAIL_TEMPLATE",
                Description = "Nội dung email gửi liên kết đặt lại mật khẩu. Biến: {{email}}, {{reset_link}}",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_FORGOT_PASSWORD_CODE_SUBJECT",
                ConfigValue = "Mã xác nhận đặt lại mật khẩu - Medix",
                DataType = "string",
                Category = "EMAIL_TEMPLATE",
                Description = "Tiêu đề email gửi mã OTP đặt lại mật khẩu",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_FORGOT_PASSWORD_CODE_BODY",
                ConfigValue = @"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <h2 style='color: #2c3e50;'>Đặt lại mật khẩu</h2>
    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Medix của mình.</p>
    <p>Mã xác nhận của bạn là:</p>
    <div style='background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;'>
        <h1 style='color: #3498db; font-size: 32px; margin: 0; letter-spacing: 4px;'>{{code}}</h1>
    </div>
    <p><strong>Lưu ý:</strong></p>
    <ul>
        <li>Mã này sẽ hết hạn sau {{code_expire_minutes}} phút</li>
        <li>Chỉ sử dụng mã này một lần</li>
        <li>Không chia sẻ mã này với bất kỳ ai</li>
    </ul>
    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
    <p style='color: #7f8c8d; font-size: 12px;'>Email này được gửi tự động từ hệ thống Medix. Vui lòng không trả lời email này.</p>
</div>",
                DataType = "html",
                Category = "EMAIL_TEMPLATE",
                Description = "Email gửi mã OTP đặt lại mật khẩu. Biến: {{code}}, {{code_expire_minutes}}",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_NEW_USER_SUBJECT",
                ConfigValue = "Chào mừng đến với Medix - Thông tin tài khoản của bạn",
                DataType = "string",
                Category = "EMAIL_TEMPLATE",
                Description = "Tiêu đề email gửi tài khoản mới",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_NEW_USER_BODY",
                ConfigValue = @"<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
    <h2 style='color: #2c3e50;'>Chào mừng bạn đến với Medix!</h2>
    <p>Tài khoản của bạn đã được tạo thành công.</p>
    <p>Dưới đây là thông tin đăng nhập của bạn:</p>
    <div style='background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0;'>
        <p><strong>Tên đăng nhập:</strong> {{username}}</p>
        <p><strong>Email:</strong> {{email}}</p>
        <p><strong>Mật khẩu tạm thời:</strong> <strong style='font-size: 18px; color: #e74c3c;'>{{temporary_password}}</strong></p>
    </div>
    <p><strong>Lưu ý quan trọng:</strong></p>
    <ul>
        <li>Đây là mật khẩu tạm thời. Bạn nên đổi mật khẩu ngay sau khi đăng nhập lần đầu tiên.</li>
        <li>Không chia sẻ thông tin tài khoản này với bất kỳ ai.</li>
    </ul>
    <p>Bạn có thể đăng nhập vào tài khoản của mình tại đây:</p>
    <p style='text-align: center; margin: 20px 0;'><a href='{{login_link}}' style='background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Đăng nhập ngay</a></p>
    <p>Cảm ơn bạn đã tham gia cộng đồng Medix!</p>
</div>",
                DataType = "html",
                Category = "EMAIL_TEMPLATE",
                Description = "Email gửi mật khẩu tạm cho tài khoản mới. Biến: {{username}}, {{email}}, {{temporary_password}}, {{login_link}}",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_VERIFICATION_SUBJECT",
                ConfigValue = "Xác minh tài khoản Medix",
                DataType = "string",
                Category = "EMAIL_TEMPLATE",
                Description = "Tiêu đề email xác minh tài khoản",
                IsActive = true
            },
            new()
            {
                ConfigKey = "EMAIL_TEMPLATE_VERIFICATION_BODY",
                ConfigValue = @"<h2>Xác minh tài khoản</h2>
<p>Xin chào {{email}},</p>
<p>Vui lòng xác minh tài khoản của bạn bằng cách nhấp vào liên kết sau:</p>
<p><a href=""{{verification_link}}"">Xác minh tài khoản</a></p>
<p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>",
                DataType = "html",
                Category = "EMAIL_TEMPLATE",
                Description = "Email xác minh tài khoản. Biến: {{email}}, {{verification_link}}",
                IsActive = true
            }
        };

        public static readonly IReadOnlyList<SystemConfiguration> AppointmentDefaults = new List<SystemConfiguration>
        {
            new()
            {
                ConfigKey = "APPOINTMENT_PATIENT_CANCEL_REFUND_PERCENT",
                ConfigValue = "0.8",
                DataType = "decimal",
                Category = "APPOINTMENT",
                Description = "Tỷ lệ hoàn tiền (0-1) khi bệnh nhân hủy lịch hợp lệ",
                IsActive = true
            }
        };

        public static readonly IReadOnlyList<EmailTemplateMetadata> EmailTemplateMetadatas = new List<EmailTemplateMetadata>
        {
            new("PASSWORD_RESET_LINK", "Liên kết đặt lại mật khẩu", "EMAIL_TEMPLATE_PASSWORD_RESET_SUBJECT", "EMAIL_TEMPLATE_PASSWORD_RESET_BODY", "Gửi cho người dùng khi họ yêu cầu đặt lại mật khẩu bằng liên kết."),
            new("FORGOT_PASSWORD_CODE", "OTP đặt lại mật khẩu", "EMAIL_TEMPLATE_FORGOT_PASSWORD_CODE_SUBJECT", "EMAIL_TEMPLATE_FORGOT_PASSWORD_CODE_BODY", "Gửi mã xác nhận khi người dùng quên mật khẩu."),
            new("NEW_USER_WELCOME", "Thông tin tài khoản mới", "EMAIL_TEMPLATE_NEW_USER_SUBJECT", "EMAIL_TEMPLATE_NEW_USER_BODY", "Gửi thông tin đăng nhập cho người dùng được tạo mới."),
            new("ACCOUNT_VERIFICATION", "Xác minh tài khoản", "EMAIL_TEMPLATE_VERIFICATION_SUBJECT", "EMAIL_TEMPLATE_VERIFICATION_BODY", "Gửi liên kết xác minh email.")
        };

        public static IEnumerable<SystemConfiguration> All =>
            Maintenance
                .Concat(EmailServer)
                .Concat(EmailTemplates)
                .Concat(AppointmentDefaults)
                .Concat(AIChatDefaults);

        public static SystemConfiguration? Find(string key) =>
            All.FirstOrDefault(x => x.ConfigKey.Equals(key, StringComparison.OrdinalIgnoreCase));

        public sealed record EmailTemplateMetadata(
            string TemplateKey,
            string DisplayName,
            string SubjectKey,
            string BodyKey,
            string Description);
    }
}

