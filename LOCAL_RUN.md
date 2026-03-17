# Chạy SORMS ở local (không ảnh hưởng môi trường đã deploy)

## Vì sao local sẽ không ảnh hưởng production?
- Deploy trên Render/Vercel dùng biến môi trường riêng trên cloud.
- Local dùng `ASPNETCORE_ENVIRONMENT=Development` và API `http://localhost:5183`.
- Các script local đã được khóa biến môi trường dev, không đẩy thay đổi gì lên server nếu bạn không `git push`.

## 1) Chuẩn bị database local (PostgreSQL)
`SORMS.API/appsettings.Development.json` đang dùng mặc định:
- Host: `localhost`
- Port: `5432`
- Database: `sorms_local`
- Username: `postgres`
- Password: `postgres`

Nếu máy bạn khác thông số trên, chỉnh lại `ConnectionStrings:DefaultConnection` trong `SORMS.API/appsettings.Development.json`.

## 2) Chạy nhanh toàn bộ hệ thống
Tại thư mục gốc dự án, chạy:

```bat
start.bat
```

Script này sẽ mở 2 cửa sổ:
- Backend: `http://localhost:5183`
- Frontend: `http://localhost:5173`

## 3) Chạy thủ công (nếu cần debug)
Backend:
```powershell
cd SORMS.API
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5183"
dotnet run
```

Frontend:
```powershell
cd sorms-fe
$env:VITE_API_BASE_URL = "http://localhost:5183/api"
$env:VITE_API_ORIGIN = "http://localhost:5183"
npm run dev
```

## 4) Lưu ý an toàn
- Không dùng connection string production trong file local.
- Không commit file chứa secret thật.
- Nếu test PayOS webhook ở local thì dùng URL public tạm (ngrok/cloudflared), không đổi webhook production khi chưa cần.
