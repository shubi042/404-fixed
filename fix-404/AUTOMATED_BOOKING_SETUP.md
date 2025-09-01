# Automated Booking & Subcontractor Assignment Setup

This guide will help you set up the complete automated booking flow: **Client Books → Zapier → Google Sheets → Subcontractor Assignment → Email Notification**

## 🎯 Complete Flow Overview

1. **Client books service** → Payment processed via Stripe
2. **Stripe webhook** → Automatically adds booking to Google Sheets
3. **Google Sheets formulas** → Automatically assign subcontractor (round-robin)
4. **System reads assignment** → Sends email to assigned subcontractor
5. **Subcontractor receives** → Detailed job notification with all booking info

## 📋 Prerequisites

- Google Sheets with your existing round-robin formulas
- Google Cloud Project with Sheets API enabled
- Resend account for email notifications
- Stripe account (already configured)

## 🔧 Setup Instructions

### Step 1: Google Sheets API Setup

1. **Create a Google Cloud Project** (if you don't have one):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API" and enable it

3. **Create Service Account**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Name it "booking-automation" or similar
   - Download the JSON key file

4. **Share your Google Sheet**:
   - Open your Google Sheet with the booking formulas
   - Click "Share" and add the service account email (from the JSON file)
   - Give it "Editor" permissions

### Step 2: Environment Variables Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Your existing Stripe keys (already configured)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Your existing email settings (already configured)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@tidymate.ca
OWNER_NOTIFICATION_EMAIL=services@tidymate.ca

# NEW: Google Sheets Integration
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms  # Your sheet ID
GOOGLE_SHEET_NAME=Bookings  # Name of your bookings sheet tab
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}  # Full JSON from step 1

# Optional: Zapier webhook security
ZAPIER_WEBHOOK_SECRET=your_secret_here
```

### Step 3: Google Sheets Structure

Your Google Sheets should have these columns (A-Q):

| Column | Field | Description |
|--------|-------|-------------|
| A | Timestamp | Auto-filled by system |
| B | Customer Name | From booking form |
| C | Customer Email | From booking form |
| D | Phone | From booking form |
| E | Address | From booking form |
| F | Date | Requested service date |
| G | Time | Requested service time |
| H | Service Name | Selected service |
| I | Add-ons | Selected add-on services |
| J | Total Amount | Payment amount |
| K | Currency | Payment currency |
| L | Session ID | Stripe session reference |
| M | Instructions | Special customer instructions |
| **N** | **Assigned Subcontractor** | **🔄 Your round-robin formula here** |
| **O** | **Subcontractor Email** | **🔄 Your lookup formula here** |
| **P** | **Subcontractor Phone** | **🔄 Your lookup formula here** |
| Q | Status | Booking status (Pending/Confirmed/Completed) |

**Important**: The system reads columns N, O, P to get subcontractor assignment info after your formulas calculate.

### Step 4: Install Dependencies

```bash
npm install googleapis
```

### Step 5: Deploy Your Changes

Deploy your updated application with the new webhook and Google Sheets integration.

## 🚀 Current Integration (Working Now!)

Your current booking flow **already works** with the new Google Sheets integration:

1. ✅ **Customer books** → Stripe processes payment
2. ✅ **Stripe webhook** → Automatically adds to Google Sheets
3. ✅ **Your formulas** → Assign subcontractor via round-robin
4. ✅ **System reads assignment** → Sends email to subcontractor
5. ✅ **Subcontractor receives** → Professional job notification

## 📧 Email Templates

### Subcontractor Notification Email Includes:
- 📋 Complete job details (service, add-ons, total value)
- 👤 Full customer information (name, email, phone, address)
- 📅 Scheduled date and time
- 📝 Special instructions (if any)
- ✅ Clear next steps and action items
- 🔗 Reference ID for tracking

## 🔗 Alternative: Zapier-Only Flow

If you prefer to use Zapier for the entire flow instead of the Stripe webhook integration, you can:

1. **Set up Zapier trigger** → Stripe "Payment Succeeded"
2. **Add Zapier action** → HTTP POST to `/api/zapier-webhook`
3. **Configure webhook data** → Send all booking details

### Zapier Webhook Endpoint

**URL**: `https://your-domain.com/api/zapier-webhook`
**Method**: POST
**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer your_secret` (optional)

**Payload Structure**:
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "phone": "(416) 123-4567",
  "address": "123 Main St, Toronto, ON",
  "date": "2024-01-15",
  "time": "Morning (8AM - 12PM)",
  "serviceName": "Airbnb 2 Bedrooms",
  "addons": ["Window Cleaning", "Inside Oven"],
  "totalAmount": 170,
  "currency": "CAD",
  "sessionId": "cs_test_...",
  "instructions": "Please use side entrance"
}
```

## 🧪 Testing

### Test the Complete Flow:

1. **Make a test booking** through your website
2. **Check Google Sheets** → New row should appear
3. **Verify assignment** → Subcontractor should be assigned by formula
4. **Check email** → Subcontractor should receive notification
5. **Verify logs** → Check server logs for any errors

### Manual Testing Endpoints:

- **Test Google Sheets**: `GET /api/test-sheets`
- **Test Email**: `POST /api/test-email`

## 🔍 Monitoring & Logs

Monitor these logs to ensure everything works:
- `📋 Processing booking from Zapier`
- `📊 Adding booking to Google Sheets`
- `👷 Subcontractor assigned`
- `📧 Notification sent to subcontractor`

## 🚨 Troubleshooting

### Common Issues:

1. **No subcontractor assigned**:
   - Check your Google Sheets formulas
   - Verify column mapping (N, O, P)
   - Ensure subcontractor data exists

2. **Google Sheets errors**:
   - Verify service account permissions
   - Check GOOGLE_SHEETS_ID is correct
   - Ensure sheet name matches GOOGLE_SHEET_NAME

3. **Email not sending**:
   - Verify RESEND_API_KEY is correct
   - Check subcontractor email addresses
   - Monitor email logs

## 🎉 You're All Set!

Your automated booking system is now ready! Every booking will:
- ✅ Automatically update your Google Sheets
- ✅ Trigger your round-robin assignment formulas  
- ✅ Send professional notifications to subcontractors
- ✅ Include all necessary booking details
- ✅ Provide clear next steps for subcontractors

The system is fully integrated with your existing Stripe payment flow and requires no additional manual steps.