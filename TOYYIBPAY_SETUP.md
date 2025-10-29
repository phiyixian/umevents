# ToyyibPay Integration Setup Guide

## Overview

UMEvents uses ToyyibPay for payment processing with **automatic split payment**:
- **1% platform fee** goes to UMEvents
- **99% revenue** goes directly to the event organizer
- Support for **DuitNow, FPX, and eWallets**

## Setup Steps

### 1. Create ToyyibPay Account

1. Go to [https://toyyibpay.com/](https://toyyibpay.com/)
2. Sign up for a merchant account
3. Complete verification process
4. Get your **Secret Key** from dashboard

### 2. Configure Environment Variables

Add to `backend/.env`:

```env
TOYYIBPAY_SECRET_KEY=your-secret-key-here
TOYYIBPAY_CATEGORY_CODE=your-category-code
BACKEND_URL=https://your-backend-url.com
FRONTEND_URL=https://your-frontend-url.com
```

### 3. Club Payment Setup

Clubs need to link their ToyyibPay account:

1. **Go to Profile Settings**
2. **Navigate to Payment Settings**
3. **Enter your ToyyibPay Category Code**
4. **Enable ToyyibPay integration**
5. **Save settings**

### 4. Event Payment Methods

When creating an event, organizers can choose:

#### Option A: ToyyibPay (Automated)
- Select "ToyyibPay" payment method
- Students pay via DuitNow/FPX/eWallets
- 1% platform fee automatically deducted
- Payment split handled automatically

#### Option B: Manual QR Code
- Upload QR code image
- Add payment instructions
- Student scans and pays manually
- Organizer verifies payment manually

## Transaction Fees

### Platform Fee Structure

| Transaction Amount | Organizer Receives | Platform Fee (1%) |
|-------------------|-------------------|------------------|
| RM 10.00 | RM 9.90 | RM 0.10 |
| RM 25.00 | RM 24.75 | RM 0.25 |
| RM 50.00 | RM 49.50 | RM 0.50 |
| RM 100.00 | RM 99.00 | RM 1.00 |

### ToyyibPay Fees

ToyyibPay charges additional fees:
- **FPX**: 0.5% + RM 0.50
- **DuitNow**: 0.5% + RM 0.50  
- **eWallets**: 0.5% + RM 0.50

**Note**: These fees are separate from the 1% platform fee.

## Club Finance Dashboard

Organizers can view:
- Total revenue per event
- Platform fees deducted
- Payment history
- Transaction details
- Export reports

## Payment Flow

### For Students (Buying Tickets)

1. Click "Buy Ticket" on event page
2. Select quantity
3. **If ToyyibPay**: Redirected to ToyyibPay payment page with QR code
4. Choose payment method (DuitNow/FPX/eWallet)
5. Complete payment
6. **If Manual QR**: Show organizer's QR code and instructions
7. Upload proof of payment
8. Organizer verifies and confirms ticket

### For Organizers (Receiving Payments)

#### ToyyibPay Method
- Money goes directly to your ToyyibPay account
- Can withdraw to bank account
- Track all transactions in ToyyibPay dashboard

#### Manual QR Method
- Money goes to your QR code account
- Manual verification required
- Track payments via finance dashboard

## API Endpoints

### Payment Endpoints

```javascript
// Start ticket purchase
POST /api/payments/tickets/purchase
Body: { eventId, quantity }

// Check payment status
GET /api/payments/status/:paymentId

// Club payment settings
PUT /api/payments/settings
Body: { categoryCode, toyyibpayEnabled, paymentMethod, qrCodeImageUrl }

// Finance dashboard
GET /api/payments/finance
```

### Event Endpoints (Updated)

```javascript
// Create event with payment method
POST /api/events
Body: { 
  paymentMethod: 'toyyibpay' | 'manual_qr',
  organizerQRCode: 'url...', // For manual QR
  paymentInstructions: 'instructions...'
}
```

## Webhook Configuration

Configure your ToyyibPay webhook to:
```
https://your-backend-url.com/api/payments/toyyibpay/callback
```

Webhook will automatically:
- Update ticket status to "confirmed"
- Increase event ticketsSold count
- Record payment in database

## Security

- All transactions are encrypted
- Webhook signature verification
- Payment status tracking
- Automatic reconciliation

## Support

For ToyyibPay account issues, contact [ToyyibPay Support](https://toyyibpay.com/support)

For platform issues, contact UMEvents admin.

