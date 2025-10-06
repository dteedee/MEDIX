Medix - Hướng dẫn setup môi trường và chạy dự án
================================================

Yêu cầu chung
- Git, Node.js >= 18, pnpm hoặc npm, .NET SDK 8.0, SQLite (tùy chọn, file db được tạo tự động)
- Hệ điều hành: Windows/macOS/Linux

Cấu trúc dự án
- backend/Medix.API: ASP.NET Core Web API (.NET 8)
- frontend/: Vite + React + TypeScript

1) Clone dự án
- git clone <REPO_URL>
- cd Medix

2) Backend (.NET 8)
- cd backend/Medix.API
- dotnet restore
- dotnet build
- Khởi chạy API (dev):
  dotnet run
- API mặc định chạy tại: http://localhost:5123 và https://localhost:7123
- Swagger UI (dev): https://localhost:7123/swagger

Ghi chú
- Database SQLite sẽ tạo file medix.db cùng thư mục chạy.
- Có sẵn controller GET /api/hello

3) Frontend (Vite React TS)
- cd frontend
- Cài dependencies:
  npm install
  (hoặc pnpm install / yarn install)
- Chạy dev server:
  npm run dev
- Ứng dụng chạy ở: http://localhost:5173
- Proxy đã cấu hình gọi API qua đường dẫn /api → http://localhost:5123

4) Build production
- Backend: dotnet publish -c Release
- Frontend: npm run build (output trong frontend/dist)

5) Mẹo & Troubleshooting
- Nếu port backend thay đổi, cập nhật `frontend/vite.config.ts` mục proxy '/api'.
- Nếu lỗi HTTPS dev cert trên Windows:
  dotnet dev-certs https --trust
- Xóa cache node_modules nếu gặp lỗi lạ:
  rm -rf node_modules .vite && npm install

6) Lệnh nhanh
- Chạy cả hai trong 2 cửa sổ khác nhau:
  # Cửa sổ 1
  cd backend/Medix.API && dotnet run
  # Cửa sổ 2
  cd frontend && npm run dev

Hết.
