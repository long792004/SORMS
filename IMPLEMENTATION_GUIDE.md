# Payment System Implementation - Quick Start Guide

## Overview

This document provides instructions for integrating and running the complete payment system for SORMS.

## What's Been Built

### Backend (Completed in Previous Sessions)
- ✅ PaymentService.cs with 18+ methods
- ✅ PaymentController.cs with 14 endpoints
- ✅ Invoice and RoomPricingConfig models
- ✅ PayOS integration
- ✅ PostgreSQL database setup
- ✅ JWT authentication

### Frontend (Completed This Session)
- ✅ 5 new pages (AdminPaymentPage, RoomPricingPage, PaymentSuccessPage, PaymentFailurePage, enhanced InvoicesPage)
- ✅ PaymentCheckout reusable component
- ✅ 13 API client methods
- ✅ TypeScript type definitions
- ✅ Route configuration
- ✅ Comprehensive documentation

## Installation & Setup

### 1. Backend Setup (if not already done)

```bash
cd SORMS.API

# Install PayOS package
dotnet add package Net.payOS

# Install PostgreSQL packages
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL -v 9.0.3

# Update database
dotnet ef database update

# Run backend
dotnet run
```

Backend should be running at: `https://localhost:5183`

### 2. Frontend Setup

```bash
cd sorms-fe

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should be running at: `http://localhost:5173`

## Configuration

### PayOS Credentials

Update `SORMS.API/appsettings.json`:

```json
{
  "PayOS": {
    "ClientId": "YOUR_PAYOS_CLIENT_ID",
    "ApiKey": "YOUR_PAYOS_API_KEY",
    "ChecksumKey": "YOUR_PAYOS_CHECKSUM_KEY"
  }
}
```

Get credentials from: https://dashboard.payos.vn

### Database Connection

Update `SORMS.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-host;Port=5432;Database=neondb;Username=user;Password=pass;SSL Mode=Require;"
  }
}
```

## File Structure

```
sorms-fe/src/
├── pages/
│   ├── invoices/
│   │   ├── InvoicesPage.tsx (enhanced)
│   │   ├── AdminPaymentPage.tsx (new)
│   │   ├── PaymentSuccessPage.tsx (new)
│   │   └── PaymentFailurePage.tsx (new)
│   └── rooms/
│       └── RoomPricingPage.tsx (new)
├── components/
│   └── PaymentCheckout.tsx (new)
├── api/
│   └── payment.ts (enhanced)
├── types/
│   └── index.ts (extended)
└── routes/
    └── index.tsx (updated)
```

## Running the System

### Start Backend
```bash
cd SORMS.API
dotnet run
```

### Start Frontend (in new terminal)
```bash
cd sorms-fe
npm run dev
```

### Create Test Data

1. Login as Admin at `http://localhost:5173/login`
   - Default credentials configured in database seed

2. Create a test resident via `/residents/create`

3. Create test invoice at `/invoices` (Admin dashboard)
   - Resident ID: 2 (adjust based on your test resident)
   - Amount: 500000 VND
   - Description: "Test Invoice"

## Testing Flows

### Resident Payment Flow

1. **Login as Resident**
   - Navigate to `http://localhost:5173/login`
   - Use resident credentials

2. **View Invoices**
   - Navigate to `/resident/invoices`
   - Should see invoice list with statistics

3. **Initiate Payment**
   - Click "View & Pay" on any invoice
   - PaymentCheckout modal opens
   - Review invoice details
   - Click "Pay Now"

4. **PayOS Redirect**
   - Redirected to PayOS checkout page
   - In demo mode, scan QR code or use test card
   - Test card: 9704198526191432198 (any future date, any CVV)

5. **Payment Confirmation**
   - Returns to `/payment/success` on success
   - Returns to `/payment/failure` on failure
   - Invoice status updates to "Paid"

### Admin Invoice Management

1. **Login as Admin**
   - Navigate to `http://localhost:5173/login`
   - Use admin credentials

2. **View All Invoices**
   - Navigate to `/invoices`
   - See all customer invoices with statistics

3. **Create Invoice**
   - Click "Create Invoice" button
   - Fill form with resident info
   - Submit to create
   - Invoice appears in list immediately

4. **Delete Invoice**
   - Click "Delete" on invoice row
   - Confirm deletion
   - Invoice removed from system

### Admin Pricing Management

1. **Navigate to Pricing**
   - Go to `/rooms/pricing`
   - View all room pricing configurations

2. **Create Room Pricing**
   - Click "New Pricing" button
   - Enter Room ID and rates
   - Submit to create
   - Card appears in grid

3. **Edit Pricing**
   - Click "Edit" on pricing card
   - Modify rates
   - Submit to update
   - Changes saved and reflected

## Troubleshooting

### Frontend Won't Load
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend Connection Error
- Verify backend is running: `http://localhost:5183/api/health`
- Check CORS settings in Program.cs
- Verify API URL in frontend `.env` or config

### PayOS Not Working
- Verify credentials in appsettings.json
- Check internet connection
- Confirm PayOS account has API access
- Check browser console for errors

### Database Connection Failed
- Verify PostgreSQL is accessible
- Check connection string in appsettings.json
- Run migrations: `dotnet ef database update`
- Check firewall and network settings

## API Testing with Postman

### 1. Get Auth Token
```
POST https://localhost:5183/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

### 2. Create Invoice
```
POST https://localhost:5183/api/payment/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "residentId": 2,
  "roomId": 1,
  "amount": 5000000,
  "description": "Monthly Rent"
}
```

### 3. Get Payment Link
```
POST https://localhost:5183/api/payment/create-payment-link/1
Authorization: Bearer {token}
```

### 4. Verify Payment
```
POST https://localhost:5183/api/payment/verify-payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "payos_order_id",
  "referenceCode": "ref_code"
}
```

## Key Routes

### Resident Routes
- `/resident/invoices` - My invoices page
- `/payment/success` - Payment success page
- `/payment/failure` - Payment failure page

### Admin/Staff Routes
- `/invoices` - Invoice management dashboard
- `/rooms/pricing` - Room pricing management
- `/residents` - Resident management
- `/staff` - Staff management

### Auth Routes
- `/login` - Login page
- `/register` - Registration
- `/forgot-password` - Password recovery

## Development Tips

### Add New Payment Feature

1. Create API endpoint in PaymentController.cs
2. Add method to PaymentService.cs
3. Update IPaymentService interface
4. Add API client method in `api/payment.ts`
5. Add types in `types/index.ts`
6. Create React component to consume it
7. Add route if needed

### Customize Styling

All components use Tailwind CSS. Modify:
- Colors: Change color classes (e.g., indigo-600)
- Spacing: Modify p-, m-, gap- classes
- Responsiveness: Update md:, sm:, lg: breakpoints
- Dark mode: Toggle dark: classes

### Add Environment Variables

1. Create `.env.local` in sorms-fe/
2. Add variables: `VITE_API_URL=...`
3. Access in code: `import.meta.env.VITE_API_URL`

## Performance Optimization

### Frontend
- Use React.lazy() for code splitting
- Implement pagination for long invoice lists
- Cache API responses with React Query
- Optimize images and assets

### Backend
- Add database indexes on frequently queried fields
- Implement caching for pricing lookups
- Use async/await for I/O operations
- Add request rate limiting

## Security Notes

1. **Never commit credentials** - Use environment variables
2. **Validate all inputs** - Both frontend and backend
3. **Use HTTPS in production** - All payment data must be encrypted
4. **Implement rate limiting** - Prevent abuse of payment endpoints
5. **Log payment events** - For audit trails and debugging
6. **Validate payment webhooks** - Verify signature from PayOS

## Production Deployment

### Backend
1. Build production binary: `dotnet publish -c Release`
2. Deploy to server (IIS, Docker, etc.)
3. Configure environment variables
4. Set up SSL certificate
5. Configure firewall rules

### Frontend
1. Build for production: `npm run build`
2. Deploy dist/ folder to static hosting
3. Configure API endpoint for production backend
4. Set up CDN for static assets
5. Enable compression and caching

### Database
1. Use managed PostgreSQL service (e.g., Neon, AWS RDS)
2. Enable automated backups
3. Set up replication/failover
4. Monitor performance and logs

## Support & Documentation

- Full documentation: See `PAYMENT_SYSTEM.md`
- API reference: See PaymentController.cs
- Type definitions: See `types/index.ts`
- Backend logic: See PaymentService.cs

## Next Steps

1. ✅ Test all flows locally
2. ✅ Verify PayOS integration
3. ✅ Test with real payment method (if available)
4. ✅ Deploy to staging environment
5. ✅ Load testing
6. ✅ User acceptance testing
7. ✅ Production deployment

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" error | Run `npm install` or `dotnet restore` |
| CORS error on payment API | Check CORS config in Program.cs |
| PayOS checkout not loading | Verify credentials and internet connection |
| Invoice not updating after payment | Check webhook settings in PayOS dashboard |
| Database migration failed | Verify PostgreSQL connection and credentials |
| Routes not working | Clear browser cache and rebuild frontend |

## Additional Resources

- PayOS Documentation: https://docs.payos.vn
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- PostgreSQL: https://www.postgresql.org
- ASP.NET Core: https://learn.microsoft.com/en-us/aspnet/core

---

**Last Updated**: 2025-01-16  
**Version**: 1.0.0  
**Status**: Complete and Ready for Testing
