# SORMS - Hướng dẫn deploy chi tiết từ A đến Z

Mục tiêu: làm đúng 1 lần là backend chạy trên Render, frontend chạy trên Vercel, không lỗi route, không lỗi trỏ API.

---

## 1) Chuẩn bị trước khi deploy (bắt buộc)

### 1.1 Tài khoản cần có
- GitHub (đã push source code)
- Render
- Vercel
- PostgreSQL production (Neon, Supabase, Railway, hoặc tự host)
- PayOS account (nếu dùng thanh toán)
- SMTP account (nếu dùng email OTP)

### 1.2 Kiểm tra code local

Tại máy local chạy đúng 2 lệnh build sau:

```powershell
cd D:\SORMS\SORMS.API
dotnet build

cd ..\sorms-fe
npm install
npm run build
```

Chỉ deploy khi cả 2 đều thành công.

### 1.3 Push code mới nhất lên GitHub

```powershell
cd D:\SORMS
git add .
git commit -m "chore: production deploy setup"
git push
```

---

## 2) Deploy Backend (Render) - làm trước

### 2.1 Tạo service bằng Blueprint
1. Vào Render Dashboard.
2. Chọn New +.
3. Chọn Blueprint.
4. Kết nối repo GitHub chứa dự án này.
5. Render sẽ đọc cấu hình tại [render.yaml](render.yaml).

### 2.2 Xác nhận cấu hình backend đang đúng
- Docker build dùng file [Dockerfile](Dockerfile).
- Runtime đã khớp .NET 10.
- Health check là /health.
- App lắng nghe theo PORT của Render qua ASPNETCORE_URLS.

### 2.3 Set biến môi trường trên Render (quan trọng nhất)

Vào service backend trên Render -> Environment -> Add Environment Variable.

Thiết lập đầy đủ danh sách sau:

#### Database và JWT
- ConnectionStrings__DefaultConnection = Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;...
- Jwt__Key = khóa bí mật dài tối thiểu 32 ký tự
- Jwt__Issuer = SORMS
- Jwt__Audience = SORMSUsers

#### Admin seed
- AdminAccount__Username = admin
- AdminAccount__Email = email admin thật
- AdminAccount__Password = mật khẩu mạnh
- AdminAccount__FullName = System Administrator

#### PayOS
- PayOS__ClientId = từ dashboard PayOS
- PayOS__ApiKey = từ dashboard PayOS
- PayOS__ChecksumKey = từ dashboard PayOS
- PayOS__BaseUrl = https://api-merchant.payos.vn
- PayOS__WebhookUrl = tạm để trống ở bước này hoặc điền placeholder, sẽ cập nhật sau khi có domain Vercel

#### App settings khác
- PublicApiUrl = https://<render-domain-cua-ban>
- GeminiApiKey = khóa Gemini (nếu dùng chatbot)
- GeminiModel = gemini-2.0-flash
- EmailConfig__From = email gửi OTP
- EmailConfig__Password = app password email
- EmailConfig__Host = smtp.gmail.com
- EmailConfig__Port = 587

Lưu ý: appsettings trong repo chỉ là placeholder, production phải dùng env của Render.

### 2.4 Deploy backend
1. Bấm Manual Deploy -> Deploy latest commit.
2. Chờ trạng thái Live.

### 2.5 Verify backend hoạt động
Mở:
- https://<render-domain-cua-ban>/health
- https://<render-domain-cua-ban>/swagger

Nếu /health trả status ok là backend đã sẵn sàng.

---

## 3) Deploy Frontend (Vercel)

### 3.1 Import project
1. Vào Vercel -> Add New Project.
2. Chọn đúng repo GitHub.
3. Set Root Directory = sorms-fe.

### 3.2 Build settings
- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist

### 3.3 Environment variable trên Vercel

Thêm biến:
- VITE_API_BASE_URL = https://<render-domain-cua-ban>/api

### 3.4 Deploy frontend
1. Bấm Deploy.
2. Chờ trạng thái Ready.

### 3.5 Verify frontend route
Vì đã có [sorms-fe/vercel.json](sorms-fe/vercel.json), bạn test:
- vào trang login
- vào route sâu như /resident/services
- nhấn F5 xem có 404 không

---

## 4) Quay lại cập nhật webhook PayOS (sau khi FE có domain)

Khi đã có domain Vercel, quay lại Render -> Environment sửa:
- PayOS__WebhookUrl = https://<vercel-domain-cua-ban>/api/payment/payos/webhook

Sau đó redeploy backend 1 lần nữa.

---

## 5) Checklist test production sau deploy

### 5.1 Auth
- Đăng nhập admin thành công
- Đăng nhập resident thành công

### 5.2 Service Request
- Resident tạo request thành công
- Resident xem list request của mình
- Admin/Staff xem request và review

### 5.3 Payment
- Tạo payment link
- Thanh toán test 1 giao dịch
- Trạng thái hóa đơn cập nhật đúng

### 5.4 API health
- /health luôn trả ok
- /swagger mở được

---

## 6) Lỗi thường gặp và cách xử lý nhanh

### Lỗi 400 khi tạo Service Request
- Nguyên nhân: user chưa có CheckInRecords status CheckedIn.
- Cách xử lý: check luồng check-in trước khi tạo request.

### FE gọi sai localhost sau khi lên Vercel
- Nguyên nhân: thiếu hoặc sai VITE_API_BASE_URL.
- Cách xử lý: sửa env trên Vercel và redeploy frontend.

### Render lên nhưng chết health check
- Kiểm tra /health có tồn tại không.
- Kiểm tra ConnectionStrings__DefaultConnection đúng chưa.
- Xem Render logs để biết lỗi migration hoặc auth config.

### CORS hoặc 401
- Kiểm tra token có lưu đúng ở FE.
- Kiểm tra Jwt__Key, Jwt__Issuer, Jwt__Audience đồng nhất.

---

## 7) Bảo mật bắt buộc sau khi deploy

- Rotate toàn bộ secret đã từng để trong repo/history:
  - DB password
  - JWT key
  - PayOS keys
  - SMTP password
  - Gemini key
- Không commit secret thật vào appsettings nữa.
- Chỉ dùng environment variables trên Render/Vercel.

---

## 8) Thứ tự thao tác chuẩn để làm 1 lần là lên

1. Build local pass.
2. Push GitHub.
3. Deploy Render + set env đầy đủ.
4. Lấy Render domain.
5. Deploy Vercel + set VITE_API_BASE_URL.
6. Lấy Vercel domain.
7. Cập nhật PayOS__WebhookUrl trên Render.
8. Redeploy backend.
9. Chạy full checklist test production.
