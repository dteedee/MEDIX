# 💻 Tech Stack:
![C#](https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=csharp&logoColor=white) ![.Net](https://img.shields.io/badge/.NET-5C2D91?style=for-the-badge&logo=.net&logoColor=white) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![MicrosoftSQLServer](https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white) ![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white) ![Canva](https://img.shields.io/badge/Canva-%2300C4CC.svg?style=for-the-badge&logo=Canva&logoColor=white) ![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white) ![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white) ![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white) ![Trello](https://img.shields.io/badge/Trello-%23026AA7.svg?style=for-the-badge&logo=Trello&logoColor=white)
---
🎯 Tổng Quan:
---
MEDIX là nền tảng y tế thông minh kết hợp trí tuệ nhân tạo (AI) để cung cấp dịch vụ chăm sóc sức khỏe toàn diện. Hệ thống được thiết kế như một "hệ sinh thái y tế thông minh" kết nối đa chiều giữa bệnh nhân, bác sĩ, và nhà quản lý thông qua các tính năng tiên tiến như chẩn đoán AI, quản lý hồ sơ bệnh án điện tử (EMR), và đặt lịch hẹn thông minh.


✨ Tính Năng Nổi Bật
---
🤖 AI Triage & Chẩn Đoán Thông Minh

    Chatbot AI phân tích triệu chứng và đánh giá mức độ nghiêm trọng

    Upload EMR (PDF, JPG, PNG) để AI phân tích tự động

    Phân loại mức độ: Nhẹ/Vừa/Nặng/Khẩn cấp với khuyến nghị hành động

    Đề xuất bác sĩ phù hợp dựa trên kết quả phân tích AI

🎯 Quản Lý Lịch Hẹn Thông Minh

    Đặt lịch trực tuyến với bác sĩ theo chuyên khoa

    Lịch trình thời gian thực của bác sĩ

    Nhắc hẹn tự động và hủy lịch với hoàn tiền 80%

    Phòng khám ảo tích hợp sẵn

💳 Hệ Thống Thanh Toán Toàn Diện

    Ví MEDIX tích hợp nạp tiền

    Đa dạng phương thức thanh toán (Ví điện tử, Thẻ ngân hàng)

    Quản lý hoàn tiền và lịch sử giao dịch

    Mã giảm giá và chương trình khuyến mãi

📊 Quản Lý Hồ Sơ Sức Khỏe

    EMR điện tử theo dõi toàn bộ lịch sử khám bệnh

    Dòng thời gian y tế trực quan

    Quản lý đơn thuốc và kế hoạch điều trị

    Lưu trữ file y tế (X-quang, Xét nghiệm...)

👥 Đối Tượng Người Dùng
---
🎯 Bệnh Nhân

    Sử dụng AI để kiểm tra triệu chứng ban đầu

    Đặt lịch hẹn với bác sĩ phù hợp

    Quản lý hồ sơ sức khỏe cá nhân

    Thanh toán và đánh giá dịch vụ

👨‍⚕️ Bác Sĩ

    Quản lý lịch làm việc và cuộc hẹn

    Cập nhật hồ sơ bệnh án điện tử

    Kê đơn thuốc số và theo dõi điều trị

    Phân tích thu nhập và hiệu suất làm việc

👨‍💼 Quản Lý (Manager)

    Duyệt hồ sơ bác sĩ mới

    Giám sát chất lượng dịch vụ

    Quản lý phản hồi và khiếu nại

    Phân tích báo cáo kinh doanh

⚙️ Quản Trị Viên (Admin)

    Quản lý người dùng và phân quyền

    Giám sát hệ thống và bảo mật

    Cấu hình tham số động

    Theo dõi nhật ký hoạt động

🚀 Cài Đặt & Chạy Ứng Dụng
---
Yêu cầu hệ thống

    Frontend: ReactJS

    Backend: .NET 8 Web API

    Database: SQL Server

    AI & Data Science: OpenAI cho model ML

    NLP xử lý ngôn ngữ tự nhiên

    OCR đọc và trích xuất EMR

📱 LUỒNG NGHIỆP VỤ CHÍNH
---
Luồng bệnh nhân:

    Guest → Đăng ký → AI Triage → Kết quả → Đề xuất bác sĩ → Đặt lịch → Thanh toán → Khám bệnh → Cập nhật EMR → Đánh giá

Luồng bác sĩ:

    Đăng ký → Xét duyệt → Thiết lập lịch → Nhận lịch hẹn → Chuẩn bị EMR → Khám bệnh → Cập nhật EMR → Nhận thu nhập

Luồng Manager:

    Dashboard → Duyệt bác sĩ → Quản lý phản hồi → Phân tích báo cáo → Quản lý kinh doanh -> Quản lý CMS

Luồng Admin: 

    Dashboard → Quản lý người dùng → Giám sát hệ thống → Cấu hình tham số → Bảo mật & Audit

👥 Tổng Quan Use Case
---
Hệ thống MEDIX bao gồm 111 use case được phân bổ cho 6 vai trò người dùng:

    Guest: 9
    Bệnh nhân: 29
    Bác sĩ: 22
    Manager: 29
    Admin: 22
    All-Auth: 6

🎯 Các Nhóm Chức Năng Chính
---
Authentication & Authorization (6 use cases):

    Đăng ký, đăng nhập, quên mật khẩu
    Xác thực email
    Quản lý phiên và token

AI Triage & Diagnosis (8 use cases)

    Chatbot triệu chứng thông minh

    Upload và phân tích EMR

    Phân loại mức độ khẩn cấp

    Đề xuất bác sĩ phù hợp

Appointment Management (12 use cases)

    Tìm kiếm và đặt lịch bác sĩ

    Quản lý lịch trình

    Hủy và hoàn tiền lịch hẹn

    Thông báo và nhắc nhở

Medical Records (EMR) (9 use cases)

    Timeline lịch sử khám bệnh

    Quản lý đơn thuốc điện tử

    Lưu trữ file y tế

    Cập nhật hồ sơ sau khám

Payment & Financial (8 use cases)

    Ví MEDIX và nạp/rút tiền

    Đa phương thức thanh toán

    Quản lý hoàn tiền

    Mã giảm giá và khuyến mãi

Doctor Management (15 use cases)

    Đăng ký và xét duyệt bác sĩ

    Quản lý lịch làm việc

    Gói dịch vụ và quảng cáo

    Phân tích thu nhập

Content & CMS (7 use cases)

    Quản lý bài viết sức khỏe

    Banner và landing page

    Chiến dịch marketing

Reporting & Analytics (8 use cases)

    Báo cáo doanh thu

    Phân tích hiệu suất

    Thống kê người dùng

    Xuất báo cáo Excel

System Administration (15 use cases)

    Quản lý người dùng và phân quyền

    Audit log và giám sát

    Cấu hình hệ thống
  
    Bảo mật và tuân thủ

🌍 Liên Hệ
---
Email: tungduongvbhp@gmail.com
