# SORMS Booking & Check-in/Check-out Workflow

## Complete Process Flow

### 1️⃣ **BOOKING PHASE** (Resident)
**Location**: `/rooms/{roomId}` page → `/checkout`

**Steps**:
1. Customer selects a room and views details
2. Chooses check-in date, check-out date, check-in time, check-out time, and guest count
3. Clicks "Book now" → redirects to `/checkout`
4. **System Action**: Backend creates:
   - Invoice record with status `Pending`
   - Room status changes to `OnHold`
   - **Hold expires in 15 minutes** (`NOW + 15 minutes`)

**Payment Calculation** (✅ FIXED):
```
Daily Rate = MonthlyPrice ÷ 30 (rounded)
Total Amount = Daily Rate × Number of Nights × 1.15 (15% tax + service fee)

Example:
- Monthly Price: 6,000 VND
- Daily Rate: 200 VND/day
- Stay: 5 nights
- Base Cost: 200 × 5 = 1,000 VND
- With Fees: 1,000 × 1.15 = 1,150 VND
```

**Display on Checkout Page**:
```
✓ Room: 503
✓ Check-in: 2026-03-26 | Check-out: 2026-03-31
✓ Number of guests: 3
✓ Daily rate: 200 VND/ngày
✓ Nights: 5
✓ Room subtotal: 1,000 VND
✓ Tax (10%): 100 VND
✓ Service fee (5%): 50 VND
✓ Total: 1,150 VND
✓ Hold expires in: 15:00 (countdown timer)
```

---

### 2️⃣ **PAYMENT PHASE** (15-Minute Hold Window)

**Countdown Timer**:
- Shows on checkout page: "Hold expires in: 14:32" (decrements in real-time)
- Backend auto-expires hold at `HoldExpiresAt` time via `BookingCleanupBackgroundService`

**If Payment Within 15 Minutes** ✅
1. Customer clicks "Create check-in request & transfer to payment"
2. **System Action**:
   - Invoice status: `Pending` → `Created`
   - PayOS checkout URL generated
   - QR code displayed to scan/click
3. Customer pays via PayOS
4. **System Action**:
   - Webhook received
   - Invoice status: `Created` → `Paid`
   - Room status: `OnHold` → Available once checkout completes
   - Reservation created with status `Confirmed`

**If Payment NOT Within 15 Minutes** ❌
- **System Action** (automatic):
  - Invoice status: `Pending` → `Cancelled`
  - Room status: `OnHold` → `Available`
  - Booking cleaned up
  - No check-in record created

---

### 3️⃣ **CHECK-IN PHASE** (After Successful Payment)

**Timeline**:
- **24 hours before check-in**: System sends reminder notification
- **2 hours before check-in**: System sends reminder notification
- **At check-in time**: Check-in request available

**Resident Actions** (on `/resident/booking-history`):
1. See status: "Confirmed"
2. If time is between check-in hour and current date ≤ check-out date:
   - Can click "Create check-in request"
3. **System validates**:
   - Must be after room's check-in hour (e.g., 14:00)
   - Must be before check-out date
   - Identity document (CCCD) must be verified and uploaded

**System Creates CheckInRecord**:
```
- Status: PendingCheckIn
- Staff/Admin must approve (verify identity)
- On approval: Status → CheckedIn
- Room status: OnHold → Occupied
```

---

### 4️⃣ **STAY PHASE** (Resident in Room)

**During Stay**:
- Room status: `Occupied`
- CheckInRecord status: `CheckedIn`
- Resident can request services (repairs, cleaning, etc.)
- Resident can submit reviews/ratings

**Automatic Notifications**:
- **24 hours before check-out**: "Please prepare to check out on [date]"
- **2 hours before check-out**: "Check-out is in 2 hours"

---

### 5️⃣ **CHECK-OUT PHASE**

**Resident Actions**:
1. On `/resident/booking-history`, click "Request Check-out"
2. **System validates**:
   - CheckIn status must be `CheckedIn`
   - Current date/time must be ≤ checkout date
   - Must be before checkout hour (e.g., before 12:00)

**System Creates CheckOutRequest**:
```
- Status: PendingCheckOut
- Staff/Admin approves
- On approval: CheckInRecord → CheckedOut
- Room status: Occupied → Available
- Invoice marked as completed
```

**Final Steps** ✅
- Checkout completed
- Room available for next booking
- Resident can leave review/rating on `/resident/booking-history`

---

## Backend Services & Timers

### BookingCleanupBackgroundService (Runs Every 5 Minutes)
```csharp
// 1. Auto-expire 15-minute holds
SELECT rooms WHERE Status=OnHold AND HoldExpiresAt <= NOW
→ Change Status to Available, clear HoldExpiresAt

// 2. Cancel expired reservations  
SELECT reservations WHERE Status=Held AND HoldExpiresAt <= NOW
→ Change Status to Cancelled, set CancelReason="Auto-expired"

// 3. Send check-out reminders
SELECT checkins WHERE Status=CheckedIn AND ExpectedCheckOutDate <= NOW+24h
→ Send notification "Prepare for check-out on [date]"

// 4. Auto-complete overdue checkouts
SELECT checkins WHERE Status=PendingCheckOut AND ExpectedCheckOutDate < NOW
→ Send reminder notification
```

### NotificationService
- **Triggered by**: 
  - Booking created
  - Payment completed
  - Check-in approved
  - Check-out reminders
  - Reservation cancelled
  - Invoice status changes

---

## Key Data Models

### Invoice
```
ID | ResidentID | RoomID | Amount | TotalAmount | Status | CreatedAt | BookingCheckInDate | BookingCheckOutDate | HoldExpiresAt
```
**Statuses**: Pending → Created → Paid / Cancelled

### Room  
```
ID | RoomNumber | Type | MonthlyRent | Status | HoldExpiresAt
```
**Statuses**: Available / OnHold / Occupied / Maintenance

### CheckInRecord
```
ID | ResidentID | RoomID | ExpectedCheckInDate | ExpectedCheckOutDate | Status
```
**Statuses**: PendingCheckIn → CheckedIn → PendingCheckOut → CheckedOut / Cancelled

### Reservation
```
ID | ResidentID | RoomID | CheckInDate | CheckOutDate | Status | HoldExpiresAt
```
**Statuses**: Held → Confirmed / Cancelled

---

## Summary: What's Implemented ✅

| Feature | Status |
|---------|--------|
| Daily pricing calculation | ✅ Fixed (Amount = DailyRate × Nights) |
| 15-minute booking hold | ✅ Implemented |
| Auto-expire after 15 min | ✅ Background service |
| PayOS payment gateway | ✅ Integrated |
| Invoice generation | ✅ Automatic |
| Check-in approval flow | ✅ Staff/Admin verification |
| Check-out request flow | ✅ With timing validation |
| 24h & 2h reminders | ✅ Background notifications |
| Room status management | ✅ OnHold → Occupied → Available |
| Check-in time constraints | ✅ Must be after check-in hour |
| Check-out time constraints | ✅ Must be before checkout hour |
| Chatbot daily pricing | ✅ Aligned with room daily rates |

---

## Testing the Complete Flow Manually

### Step 1: Book a Room
- Go to `/rooms/503`
- Select check-in: 2026-03-26, check-out: 2026-03-31
- Click "Book now"
- **Expected**: See countdown "Hold expires in: 14:59"

### Step 2: Complete Payment
- Click "Create check-in request & transfer to payment"
- Scan PayOS QR code or click link
- Complete payment
- **Expected**: Invoice status changes to "Paid" (refresh page)

### Step 3: Verify Pricing
- On checkout page, verify:
  - Daily rate: 200 VND/ngày (not 6,000)
  - Total: correct calculation with 1.15 multiplier
  - Example: 200 × 5 × 1.15 = 1,150 VND (not 34,500)

### Step 4: Request Check-in
- Go to `/resident/booking-history`
- Click "Create check-in request"
- **Expected**: Status shows "Pending Check-in"

### Step 5: Approve Check-in (Staff/Admin)
- Go to `/staff/pending-checkins` or `/admin/`
- Find pending request
- Verify resident's identity document
- Click "Approve"
- **Expected**: Resident sees "Checked In" status

### Step 6: Request Check-out
- Go to `/resident/booking-history`
- Click "Request check-out"
- **Expected**: Status shows "Pending Check-out"

### Step 7: Auto-Expire Hold (Test)
- Create new booking without paying
- Wait 15 minutes or run background service
- **Expected**: Room becomes Available again, invoice Cancelled

---

## Frontend Pages Updated ✅

| Page | Changes |
|------|---------|
| `/rooms/{id}` | Daily rate displayed, accurate price calculation |
| `/checkout` | Corrected amount, 15-min countdown timer |
| `/resident/booking-history` | Check-in/checkout request UI, timers |
| `/resident/invoices` | Shows correct daily-based amounts |
| `/staff/pending-checkins` | Approve check-ins with identity verification |
| `/admin/` | Manage bookings, view payment status |

---

## Backend Endpoints

### Payment API
- `POST /api/Payment/create` - Create booking & invoice (holds for 15 min)
- `POST /api/Payment/create-payment-link/{invoiceId}` - Generate PayOS checkout
- `GET /api/Payment/payment-status/{invoiceId}` - Check payment status
- `POST /api/Payment/payos-webhook` - Webhook for PayOS updates

### Check-in API
- `POST /api/CheckIn/request-checkin` - Create check-in request
- `POST /api/CheckIn/approve-checkin` - Staff/Admin approval
- `GET /api/CheckIn/my-status` - Current status
- `GET /api/CheckIn/my-history` - Booking history

### Check-out API
- `POST /api/CheckIn/request-checkout` - Create check-out request
- `POST /api/CheckIn/approve-checkout` - Staff/Admin approval

---

## Known Limitations & Future Improvements

1. **SMS/Email Notifications**: Currently via in-app notifications only
2. **Payment Refunds**: Need to implement partial/full refund flow
3. **Booking Modifications**: Can't change dates after booking started
4. **Early Check-out Discount**: Not yet implemented
5. **Late Payment**: Allow up to 1 hour after hold expires?
6. **Cancellation Policy**: Should vary by room/hotel

---

**Last Updated**: 2026-03-26  
**API Version**: v1.0  
**Status**: Ready for testing
