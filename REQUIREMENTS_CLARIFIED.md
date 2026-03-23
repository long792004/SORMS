# Yêu Cầu Chi Tiết: Chuyển Đổi Chiến Lược Định Giá Phòng

## 1. Chiến Lược Định Giá (Pricing Strategy)

### Yêu cầu hiện tại:
- **Cũ**: Phòng được tính giá theo **tháng** (`MonthlyRent` = VND/tháng)
- **Mới**: Phòng phải được tính giá theo **ngày** (`DailyRate` = VND/ngày)

### Công thức tính tiền:
```
Tổng tiền = DailyRate (VND/ngày) × Số ngày ở = DailyRate × (CheckOutDate - CheckInDate)
```

**Ví dụ:**
- DailyRate = 200,000 VND/ngày
- CheckIn: 20/3/2026, CheckOut: 21/3/2026 → **1 ngày** → Tổng: 200,000 VND
- CheckIn: 20/3/2026, CheckOut: 23/3/2026 → **3 ngày** → Tổng: 600,000 VND

---

## 2. Quy Trình Đặt Phòng (Booking Process)

### Vấn đề hiện tại:
- Khi Resident A đặt phòng từ **20/3 → 21/3**, trạng thái phòng thay đổi thành `OnHold` hoặc `Unavailable` (khoá toàn bộ)
- Resident B **không thể** đặt cùng phòng vào ngày khác (ví dụ: 22/3 → 23/3)
- **Root cause**: Hệ thống dùng trạng thái **global** thay vì kiểm tra **khoảng thời gian cụ thể**

### Yêu cầu mới:
1. **Kiểm tra xung đột ngày** (Date-Range Overlap Check):
   - Khi Resident A đặt: 20/3 → 21/3
   - Chỉ **chặn** Resident B đặt nếu khoảng ghi gí của B **chồng chéo** với khoảng của A
   - **Cho phép** Resident B đặt nếu khoảng ngày của B **hoàn toàn khác**

   **Ví dụ chi tiết:**
   ```
   Phòng 1:
   - Resident A: 20/3 → 21/3 (ĐÃ ĐẶT)
   
   → Resident B: 20/3 → 21/3 ❌ CHẶN (chồng chéo 100%)
   → Resident B: 20/3 → 22/3 ❌ CHẶN (chồng chéo, CheckOut = 22, CheckIn = 20)
   → Resident B: 21/3 → 22/3 ❌ CHẶN (chồng chéo, CheckIn = 21)
   → Resident B: 22/3 → 23/3 ✅ ĐƯỢC (không chồng chéo)
   → Resident B: 19/3 → 20/3 ❌ CHẶN (chồng chéo, CheckOut = 20)
   ```

2. **Phòng vẫn hiển thị** (Room Visibility):
   - Phòng phải **luôn hiển thị** trong danh sách có sẵn
   - Chỉ **ẩn** khi có xung đột ngày với booking hiện tại

3. **Thông báo lỗi rõ ràng** (Error Message):
   - Khi có xung đột: `"Phòng này đã có người đặt trong khoảng thời gian bạn chọn. Vui lòng chọn ngày khác."`

---

## 3. Giao Diện Người Dùng (UI)

### Hiển thị giá (Price Display):
- **Cũ**: `500,000 VND / tháng` hoặc `16,667 VND / ngày (chia tháng)`
- **Mới**: `200,000 VND / ngày`

### Tính toán tạm tính (Estimated Total):
- Hiển thị: `Đơn giá: 200,000 VND/ngày | Số đêm: 3 | Tạm tính: 600,000 VND`
- Công thức: `Tạm tính = DailyRate × Số ngày`
- **Interactive**: Khi người dùng thay đổi ngày, số tiền tạm tính phải **cập nhật ngay**

---

## 4. Dữ Liệu (Data & Database)

### Entities cần kiểm tra/sửa:
- `Invoice`: 
  - `BookingCheckInDate` (ngày nhận phòng)
  - `BookingCheckOutDate` (ngày trả phòng)
  - `Amount` (số tiền = DailyRate × số ngày)
  - `Status` (Pending/Created = đang giữ phòng)

- `Room`:
  - `MonthlyRent` → **sử dụng làm DailyRate** trong mô hình mới
  - `Status` → **không còn global `OnHold`**, chỉ dùng để đánh dấu phòng bị xoá

- `RoomPricingConfig` (nếu có):
  - Lưu `DailyRate` riêng theo phòng (override `MonthlyRent` nếu cần)

### Luận lý kiểm tra xung đột:
```
Xung đột xảy ra khi:
  Invoice.BookingCheckInDate < RequestedCheckOutDate 
  AND Invoice.BookingCheckOutDate > RequestedCheckInDate
  AND Invoice.Status IN ('Pending', 'Created')
```

---

## 5. API Endpoints (Thay đổi cần thiết)

### `/Payment/create-payment-link/room/{roomId}` (Tạo link thanh toán)
**Request Body:**
```json
{
  "expectedCheckInDate": "2026-03-20T00:00:00Z",
  "expectedCheckOutDate": "2026-03-23T00:00:00Z",
  "numberOfResidents": 2,
  "returnUrl": "http://localhost:5173/resident/invoices?success=true",
  "cancelUrl": "http://localhost:5173/resident/invoices?cancel=true"
}
```

**Logic:**
1. Tính: `numberOfNights = (CheckOutDate - CheckInDate).Days`
2. Tính: `dailyRate = RoomPricingConfig.DailyRate ?? Room.MonthlyRent`
3. Tính: `amount = dailyRate × numberOfNights`
4. Kiểm: Có Invoice khác với khoảng ngày chồng chéo không?
5. Nếu có → **Trả lỗi 400**: `"Phòng này đã có người đặt trong khoảng thời gian bạn chọn."`
6. Nếu không → **Tạo Invoice** với `Status = Pending`, `Amount = calculated`

### `/Room/available` (Danh sách phòng có sẵn)
**Query Parameters:**
```
GET /Room/available?checkIn=2026-03-22T00:00:00Z&checkOut=2026-03-25T00:00:00Z
```

**Logic:**
1. Lấy tất cả phòng
2. **Loại bỏ** phòng có Invoice với:
   - `Status IN ('Pending', 'Created')`
   - `BookingCheckInDate < requestedCheckOut && BookingCheckOutDate > requestedCheckIn`
3. Trả về danh sách phòng còn lại + hiển thị `DailyRate`

### `/CheckIn/request-checkin` (Tạo yêu cầu check-in)
**Logic:**
- Tương tự `/Payment/create-payment-link`
- Kiểm tra xung đột trước khi cho phép

---

## 6. Tiêu Chí Kiểm Thử (Test Cases)

### Test Case 1: Tính tiền đúng theo số ngày
```
Given: DailyRate = 200,000 VND/ngày, Phòng ID = 1
When: Resident A đặt 20/3 (CheckIn) → 23/3 (CheckOut)
Then: Amount = 200,000 × 3 = 600,000 VND ✓
```

### Test Case 2: Chặn xung đột ngày
```
Given: Resident A đã đặt 20/3 → 21/3 (Phòng 1)
When: Resident B cố đặt 20/3 → 21/3 (Phòng 1)
Then: API trả lỗi + message = "Phòng này đã có người đặt..." ✓
```

### Test Case 3: Cho phép ngày không xung đột
```
Given: Resident A đã đặt 20/3 → 21/3 (Phòng 1)
When: Resident B đặt 22/3 → 23/3 (Phòng 1)
Then: Tạo booking thành công, Amount = 200,000 × 1 = 200,000 VND ✓
```

### Test Case 4: Phòng vẫn hiển thị (khi không xung đột)
```
Given: Resident A đã đặt 20/3 → 21/3 (Phòng 1)
When: Resident B truy cập /Room/available?checkIn=22/3&checkOut=23/3
Then: Phòng 1 vẫn hiển thị ✓
```

### Test Case 5: Phòng ẩn (khi xung đột)
```
Given: Resident A đã đặt 20/3 → 21/3 (Phòng 1)
When: Resident B truy cập /Room/available?checkIn=20/3&checkOut=21/3
Then: Phòng 1 KHÔNG hiển thị ✓
```

---

## 7. Tóm Tắt Thay Đổi

| Thành phần | Cũ | Mới |
|-----------|----|----|
| **Giá tín** | MonthlyRent (VND/tháng) | DailyRate (VND/ngày) |
| **Tính toán** | `MonthlyRent × 1` | `DailyRate × Số ngày` |
| **Room Lock** | Global `OnHold` | Date-range overlap check |
| **Hiển thị** | "VND / tháng" | "VND / ngày" |
| **Xung đột** | Phòng khoá hoàn toàn | Chỉ chặn ngày trùng |
| **Phòng hiển thị** | Ẩn nếu `OnHold` | Luôn hiển thị (nếu không xung đột) |

---

## 8. Phạm Vi Thay Đổi (Scope)

### Backend (C# / .NET):
- [ ] `PaymentService.CreateRoomBookingPaymentLinkAsync()` - logic tính tiền & kiểm xung đột
- [ ] `CheckInService.CreateCheckInRequestAsync()` - logic kiểm xung đột
- [ ] `RoomService.GetAvailableRoomsAsync()` - logic lọc phòng theo ngày
- [ ] `RoomDto` - thêm `DailyRate` field

### Frontend (React / TypeScript):
- [ ] `PublicPages.tsx` - hiển thị giá "/ngày", tính toán tạm tính
- [ ] `ResidentPages.tsx` - tương tự
- [ ] Date picker components - highlight ngày xung đột (nếu có)

### Database:
- [ ] Không cần migration (sử dụng lại `MonthlyRent` làm `DailyRate`)
- [ ] Có thể thêm `RoomPricingConfig` nếu cần pricing override

---

## Ghi chú
- Thời gian hold (6 phút hay khác) được define trong `PaymentService`
- Invoice được tạo ngay khi request, status = `Pending` cho đến khi thanh toán xong
- Tất cả tính toán ngày phải dùng UTC để tránh lỗi timezone
