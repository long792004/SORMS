# Payment System Documentation

## Overview

The Smart Office Resource Management System (SORMS) includes a comprehensive payment system that enables residents to view invoices and make payments through PayOS, while admins and staff can manage invoices and room pricing configurations.

## Architecture

### Backend Components

#### Models
- **Invoice** - Represents a payment request for a resident
  - Fields: `residentId`, `roomId`, `amount`, `description`, `status`, `payOSOrderId`, `checkoutUrl`, `createdAt`, `paidAt`
  - Statuses: Pending, Paid, Completed

- **RoomPricingConfig** - Manages per-room pricing for utilities and services
  - Fields: `roomId`, `monthlyRent`, `electricityRate`, `waterRate`, `internetFee`, `maintenanceFee`, `effectiveFrom`, `effectiveTo`, `isActive`, `updatedByStaffId`

#### Services
- **PaymentService.cs** - Core payment business logic
  - Invoice Management: CRUD operations for invoices
  - PayOS Integration: Create payment links, verify payments, handle webhooks
  - Room Pricing: Manage room-based pricing configurations
  - 18+ methods covering all payment operations

#### API Endpoints (PaymentController)

**Resident Routes:**
- `GET /api/payment/my-invoices` - Get resident's invoices
- `GET /api/payment/invoice/{id}` - Get specific invoice details
- `POST /api/payment/create-payment-link/{id}` - Create PayOS checkout link
- `GET /api/payment/payment-status/{id}` - Check payment status
- `POST /api/payment/verify-payment` - Verify PayOS payment

**Admin/Staff Routes:**
- `GET /api/payment/all` - Get all invoices
- `POST /api/payment/create` - Create invoice for resident
- `DELETE /api/payment/delete/{id}` - Delete invoice
- `GET /api/payment/room-pricing/{roomId}` - Get room pricing
- `GET /api/payment/room-pricings` - Get all room pricings
- `POST /api/payment/room-pricing/{roomId}` - Create room pricing
- `PUT /api/payment/room-pricing/{roomId}` - Update room pricing

**Webhook:**
- `POST /api/payment/payos-webhook` - PayOS payment confirmation webhook

### Frontend Components

#### Pages
1. **InvoicesPage.tsx** (`/resident/invoices`) - Resident invoice list and payment
   - Display all invoices with filters
   - Summary statistics (total, paid, pending)
   - Payment checkout modal with PayOS integration
   - Responsive table design

2. **AdminPaymentPage.tsx** (`/invoices` - Admin/Staff only) - Payment management
   - View all customer invoices
   - Create new invoices with form
   - Delete invoices
   - Revenue statistics and analytics
   - Invoice filtering and search

3. **RoomPricingPage.tsx** (`/rooms/pricing` - Admin/Staff only) - Room pricing management
   - Browse room pricing configurations
   - Create new pricing plans
   - Edit existing pricing
   - View pricing history and effective dates
   - Utilities breakdown (electricity, water, internet, maintenance)

4. **PaymentSuccessPage.tsx** (`/payment/success`) - Payment confirmation
   - Success message after PayOS redirect
   - Invoice status confirmation
   - Receipt download option
   - Navigation back to invoices

5. **PaymentFailurePage.tsx** (`/payment/failure`) - Payment error handling
   - Error message with reason
   - Troubleshooting tips
   - Retry or support contact options
   - Navigate back to payment

#### Components
- **PaymentCheckout.tsx** - Reusable payment initiation component
  - Invoice summary display
  - Payment amount confirmation
  - Error handling and status display
  - Secure PayOS payment integration
  - Loading states and validation

### API Client

**`api/payment.ts`** - Typed API client with 13 methods

Resident Methods:
```typescript
getMyInvoices()           // Fetch resident's invoices
getInvoiceById(id)        // Get invoice details
getPaymentStatus(id)      // Check payment status  
createPaymentLink(id)     // Generate PayOS checkout
verifyPayment(data)       // Verify payment success
```

Admin/Staff Methods:
```typescript
getAllInvoices()          // Fetch all invoices
createInvoice(data)       // Create new invoice
deleteInvoice(id)         // Delete invoice
```

Room Pricing Methods:
```typescript
getRoomPricing(roomId)           // Get pricing for room
getAllRoomPricings()             // Fetch all pricing configs
createRoomPricing(data)          // Create pricing plan
updateRoomPricing(id, data)      // Update pricing plan
```

### Type Definitions

**Key Interfaces in `types/index.ts`:**

```typescript
interface InvoiceDto {
  id: number
  residentId: number
  residentName?: string
  roomId?: number
  roomNumber?: string
  amount: number
  description: string
  status: InvoiceStatus  // 'Pending' | 'Paid' | 'Completed'
  payOSOrderId?: string
  checkoutUrl?: string
  createdAt: string
  paidAt?: string
}

interface RoomPricingDto {
  id: number
  roomId: number
  roomNumber: string
  monthlyRent: number
  electricityRate: number
  waterRate: number
  internetFee: number
  maintenanceFee: number
  totalEstimatedCost: number
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

interface CreatePaymentLinkDto {
  invoiceId: number
  redirectUrl?: string
}

interface PaymentStatusDto {
  invoiceId: number
  status: PaymentStatus
  amount: number
  paidAt?: string
}
```

## Payment Flow

### Resident Payment Flow

1. **View Invoices**
   - Resident navigates to `/resident/invoices`
   - System fetches invoices via `getMyInvoices()`
   - Displays invoice table with status badges

2. **Initiate Payment**
   - Click "View & Pay" button on invoice
   - PaymentCheckout modal opens with invoice details
   - Click "Pay Now" button

3. **PayOS Redirect**
   - `createPaymentLink()` API call to backend
   - Backend creates PayOS order and returns checkout URL
   - User redirected to PayOS payment page
   - PayOS handles payment processing securely

4. **Payment Callback**
   - User returns to `/payment/success` or `/payment/failure`
   - Success page shows confirmation
   - Backend webhook updates invoice status

### Admin/Staff Invoice Management Flow

1. **View All Invoices**
   - Navigate to `/invoices`
   - AdminPaymentPage loads all invoices
   - Display statistics: Total, Paid, Pending amounts

2. **Create Invoice**
   - Click "Create Invoice" button
   - Fill form: Resident ID, Room ID, Amount, Description
   - Submit to create invoice
   - Invoice added to resident's account immediately

3. **Delete Invoice**
   - Click "Delete" on invoice row
   - Confirm deletion
   - Invoice removed from system

### Room Pricing Management Flow

1. **Browse Pricing**
   - Navigate to `/rooms/pricing`
   - View pricing cards for each room
   - See breakdown of rent and utilities

2. **Create Pricing**
   - Click "New Pricing" button
   - Enter Room ID, monthly rent, utility rates
   - Set effective date
   - Submit to create pricing plan

3. **Update Pricing**
   - Click "Edit" on pricing card
   - Modify rates or effective dates
   - Submit to update
   - History tracked with effective dates

## PayOS Integration

### Configuration

PayOS credentials are stored in `appsettings.json`:

```json
{
  "PayOS": {
    "ClientId": "YOUR_CLIENT_ID",
    "ApiKey": "YOUR_API_KEY",
    "ChecksumKey": "YOUR_CHECKSUM_KEY"
  }
}
```

### How It Works

1. **Order Creation**
   - Backend calls PayOS API to create order
   - Receives checkout URL and Order ID
   - Stores Order ID in Invoice for tracking

2. **Payment Processing**
   - User redirected to PayOS checkout page
   - PayOS handles payment securely
   - User returns with success/failure status

3. **Verification**
   - Frontend calls verification endpoint with order ID
   - Backend verifies with PayOS
   - Invoice status updated to "Paid"
   - Confirmation email sent to resident

4. **Webhook Handling**
   - PayOS sends webhook confirmation
   - Backend validates webhook signature
   - Updates invoice status if not already done
   - Ensures payment is recorded even if user doesn't return

## Role-Based Access Control

### Resident
- View: `/resident/invoices` - Own invoices only
- Actions: Initiate payment, view invoice details
- Cannot: See other residents' invoices, create invoices

### Staff
- View: `/invoices` - All invoices
- View: `/rooms/pricing` - All room pricing
- Actions: Create/delete invoices, manage room pricing
- Cannot: Delete invoices after payment

### Admin
- Full access to all payment operations
- View: `/invoices`, `/rooms/pricing`
- Actions: Create/delete invoices, manage room pricing, view analytics
- Can: Configure PayOS settings, view payment reports

## Database Schema

### Invoice Table
```sql
Invoices (
  Id INT PK,
  ResidentId INT FK → Residents,
  RoomId INT FK → Rooms,
  Amount DECIMAL(10,2),
  Description NVARCHAR(255),
  Status NVARCHAR(50),
  PayOSOrderId NVARCHAR(255),
  CheckoutUrl NVARCHAR(500),
  CreatedAt DATETIME,
  PaidAt DATETIME?
)
```

### RoomPricingConfig Table
```sql
RoomPricingConfigs (
  Id INT PK,
  RoomId INT FK → Rooms,
  MonthlyRent DECIMAL(10,2),
  ElectricityRate DECIMAL(10,4),
  WaterRate DECIMAL(10,4),
  InternetFee DECIMAL(10,2),
  MaintenanceFee DECIMAL(10,2),
  EffectiveFrom DATETIME,
  EffectiveTo DATETIME?,
  IsActive BIT,
  UpdatedByStaffId INT FK → Staff,
  CreatedAt DATETIME,
  UpdatedAt DATETIME?
)
```

## API Response Format

All API endpoints return standardized responses:

### Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "residentId": 5,
    "amount": 5000000,
    "status": "Pending",
    ...
  },
  "message": "Invoice created successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invoice not found",
  "statusCode": 404
}
```

## Error Handling

### Frontend
- Try-catch blocks on all API calls
- User-friendly error messages in modals
- Automatic retry options for failed payments
- Loading states prevent duplicate submissions

### Backend
- Validate all inputs before processing
- Proper exception handling with logging
- Return appropriate HTTP status codes
- Transaction rollback on errors

## Security Features

1. **Authentication**
   - JWT-based authentication
   - All payment endpoints require valid token
   - Role-based authorization checks

2. **Payment Security**
   - PayOS handles card data (PCI DSS compliant)
   - Checksum validation on webhooks
   - Order ID verification before processing

3. **Data Protection**
   - Residents can only see their own invoices
   - Encrypted connection to PayOS (HTTPS)
   - Sensitive data not logged in plain text

## Testing

### Manual Testing Checklist

- [ ] Resident can view invoices
- [ ] Resident can initiate payment
- [ ] Payment redirects to PayOS
- [ ] Success page shows after payment
- [ ] Invoice status updates to "Paid"
- [ ] Admin can create invoices
- [ ] Admin can view all invoices
- [ ] Pricing configuration saves correctly
- [ ] Pricing history is tracked
- [ ] Webhook receives and processes correctly

### API Testing

Use Postman or similar tool:

1. Get auth token from login endpoint
2. Create invoice: `POST /api/payment/create`
3. Create payment link: `POST /api/payment/create-payment-link/{id}`
4. Verify payment: `POST /api/payment/verify-payment`

## Troubleshooting

### Payment Link Not Loading
- Check PayOS credentials in appsettings.json
- Verify internet connection
- Check browser console for CORS errors

### Invoice Not Updating After Payment
- Verify webhook is enabled in PayOS dashboard
- Check backend logs for webhook errors
- Manually verify payment through PayOS dashboard

### Pricing Not Showing
- Verify room exists and is active
- Check effective dates on pricing config
- Clear browser cache

## Future Enhancements

- [ ] Invoice PDF generation and download
- [ ] Automatic invoice generation based on rental schedule
- [ ] Payment plans and multiple installments
- [ ] Invoice reminder emails
- [ ] Advanced reporting and analytics
- [ ] Integration with other payment gateways
- [ ] Mobile app payment notifications
- [ ] Payment receipt SMS/Email delivery
- [ ] Expense category tracking
- [ ] Financial dashboard for admins

## Support

For issues or questions:
1. Check error messages in browser console
2. Review backend logs in `/bin/Debug/`
3. Contact development team with error details
4. Include screenshot and steps to reproduce
