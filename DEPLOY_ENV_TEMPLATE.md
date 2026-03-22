# DEPLOY ENV TEMPLATE (Điền giá trị thật vào đây)

## 1) Render - Backend (`sorms-api`)

Dán lần lượt các key này vào Render > Service > Environment.

### Core
- `ASPNETCORE_ENVIRONMENT` = `Production`
- `ASPNETCORE_URLS` = `http://0.0.0.0:$PORT`

### Database
- `ConnectionStrings__DefaultConnection` = `Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;Include Error Detail=true`

### JWT
- `Jwt__Key` = `YOUR_SUPER_SECRET_KEY_MIN_32_CHARS`
- `Jwt__Issuer` = `SORMS`
- `Jwt__Audience` = `SORMSUsers`
- `Jwt__ExpiryMinutes` = `1440`

### Admin seed
- `AdminAccount__Username` = `admin`
- `AdminAccount__Email` = `your-admin@email.com`
- `AdminAccount__Password` = `YOUR_STRONG_ADMIN_PASSWORD`
- `AdminAccount__FullName` = `System Administrator`

### PayOS
- `PayOS__ClientId` = `YOUR_PAYOS_CLIENT_ID`
- `PayOS__ApiKey` = `YOUR_PAYOS_API_KEY`
- `PayOS__ChecksumKey` = `YOUR_PAYOS_CHECKSUM_KEY`
- `PayOS__BaseUrl` = `https://api-merchant.payos.vn`
- `PayOS__WebhookUrl` = `https://YOUR_VERCEL_DOMAIN/api/payment/payos/webhook`

### Public/API
- `PublicApiUrl` = `https://YOUR_RENDER_DOMAIN`

### Gemini (nếu dùng chatbot)
- `GeminiApiKey` = `YOUR_GEMINI_API_KEY`
- `GeminiModel` = `gemini-2.0-flash`

### SMTP (OTP/Email)
- `Smtp__Host` = `smtp.gmail.com`
- `Smtp__Port` = `587`
- `Smtp__Username` = `your-smtp-username`
- `Smtp__Password` = `your-smtp-app-password`
- `Smtp__From` = `your-from-email@gmail.com`

---

## 2) Vercel - Frontend (`sorms-fe`)

Vào Vercel > Project > Settings > Environment Variables.

- `VITE_API_BASE_URL` = `https://YOUR_RENDER_DOMAIN/api`

---

## 3) Giá trị bạn cần thay sau khi deploy lần đầu

1. Deploy Render xong -> lấy domain backend:
   - `https://YOUR_RENDER_DOMAIN`
2. Deploy Vercel xong -> lấy domain frontend:
   - `https://YOUR_VERCEL_DOMAIN`
3. Quay lại Render sửa:
   - `PayOS__WebhookUrl = https://YOUR_VERCEL_DOMAIN/api/payment/payos/webhook`
4. Redeploy backend 1 lần.

---

## 4) Checklist nhanh trước khi bấm deploy

- [ ] Đã điền `ConnectionStrings__DefaultConnection`
- [ ] `Jwt__Key` >= 32 ký tự
- [ ] Đã điền đủ `PayOS__*`
- [ ] Đã điền đủ `Smtp__*`
- [ ] `PublicApiUrl` đúng domain Render
- [ ] `VITE_API_BASE_URL` đúng domain Render + `/api`
