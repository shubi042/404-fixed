# Zapier Configuration Guide

## 🎯 Two Integration Options

You have **two ways** to integrate with Google Sheets and automate subcontractor assignments:

### Option 1: Direct Integration (Recommended) ✅
**Your current Stripe webhook already handles everything automatically!**
- ✅ No additional Zapier setup needed
- ✅ Booking → Google Sheets → Subcontractor Email (all automatic)
- ✅ Just configure environment variables and deploy

### Option 2: Zapier-Driven Flow
**Use this if you want Zapier to control the entire flow**

---

## 🚀 Option 1: Direct Integration (Recommended)

### What's Already Working:
1. Customer books service → Stripe processes payment
2. Stripe webhook → Automatically adds to Google Sheets
3. Google Sheets formulas → Assign subcontractor (round-robin)
4. System → Sends email to assigned subcontractor

### Setup Required:
1. **Configure environment variables** (see `.env.example`)
2. **Set up Google Sheets API** (see `AUTOMATED_BOOKING_SETUP.md`)
3. **Deploy your application**
4. **Test with a booking**

**That's it!** Your system is fully automated.

---

## 📋 Option 2: Zapier Configuration

If you prefer to use Zapier to trigger the Google Sheets integration:

### Step 1: Create Zapier Webhook

1. **Create new Zap** in Zapier
2. **Trigger**: Stripe → "Payment Succeeded" or "Invoice Payment Succeeded"
3. **Filter** (optional): Only for specific products/services
4. **Action**: Webhooks by Zapier → POST

### Step 2: Configure Webhook Action

**URL**: `https://your-domain.com/api/zapier-webhook`

**Method**: POST

**Headers**:
```
Content-Type: application/json
Authorization: Bearer your_zapier_secret  (optional)
```

**Data** (JSON):
```json
{
  "customerName": "{{customer_name}}",
  "customerEmail": "{{customer_email}}",
  "phone": "{{customer_phone}}",
  "address": "{{customer_address}}",
  "date": "{{service_date}}",
  "time": "{{service_time}}",
  "serviceName": "{{service_name}}",
  "addons": ["{{addon1}}", "{{addon2}}"],
  "totalAmount": {{total_amount}},
  "currency": "{{currency}}",
  "sessionId": "{{stripe_session_id}}",
  "instructions": "{{special_instructions}}"
}
```

### Step 3: Map Stripe Data

Map these Stripe fields to the webhook data:

| Webhook Field | Stripe Field | Example |
|---------------|--------------|---------|
| customerName | Customer Name | John Doe |
| customerEmail | Customer Email | john@example.com |
| phone | Customer Phone | (416) 123-4567 |
| address | Customer Address | 123 Main St, Toronto |
| date | Service Date | 2024-01-15 |
| time | Service Time | Morning (8AM - 12PM) |
| serviceName | Product Name | Airbnb 2 Bedrooms |
| addons | Add-on Services | ["Window Cleaning"] |
| totalAmount | Amount Paid | 180.00 |
| currency | Currency | CAD |
| sessionId | Session ID | cs_test_... |
| instructions | Special Notes | Use side entrance |

### Step 4: Test Your Zap

1. **Test the trigger** with a sample Stripe payment
2. **Verify webhook** receives the data correctly
3. **Check Google Sheets** for new booking row
4. **Confirm subcontractor** assignment via your formulas
5. **Verify email** was sent to assigned subcontractor

---

## 🔍 Webhook Response

Your Zapier webhook will receive this response:

```json
{
  "success": true,
  "message": "Booking processed successfully",
  "assignedSubcontractor": "John Smith",
  "rowNumber": 15
}
```

---

## 📧 Email Automation Details

### What Subcontractors Receive:

- **Professional email** with complete job details
- **Customer information** (name, email, phone, address)
- **Service details** (type, add-ons, total value)
- **Scheduling info** (date, time, special instructions)
- **Clear next steps** and action items
- **Reference ID** for tracking

### Email Template Features:

- 🎨 **Professional design** with clear sections
- 📱 **Mobile-friendly** formatting
- 🔗 **Clickable links** for phone and email
- 📋 **Structured layout** for easy scanning
- ✅ **Action-oriented** next steps

---

## 🧪 Testing Your Setup

### Test Endpoints Available:

1. **Test Google Sheets Integration**:
   ```
   GET https://your-domain.com/api/test-sheets
   ```

2. **Test Complete Webhook Flow**:
   ```
   POST https://your-domain.com/api/zapier-webhook
   Content-Type: application/json
   
   {
     "customerName": "Test Customer",
     "customerEmail": "test@example.com",
     "phone": "(416) 123-4567",
     "address": "123 Test St, Toronto",
     "date": "2024-01-15",
     "time": "Morning",
     "serviceName": "Test Service",
     "addons": ["Test Addon"],
     "totalAmount": 100,
     "currency": "CAD",
     "sessionId": "test_123",
     "instructions": "Test booking"
   }
   ```

### What to Check:

- ✅ **Google Sheets**: New row appears with booking data
- ✅ **Formula calculation**: Subcontractor assigned in column N
- ✅ **Email sent**: Subcontractor receives notification
- ✅ **Logs**: No errors in server logs

---

## 🔧 Google Sheets Formula Examples

If you need help with your round-robin formulas, here are examples:

### Subcontractor Assignment (Column N):
```
=IF(ROW()=1,"Assigned Subcontractor",INDEX(Subcontractors!A:A,MOD(ROW()-2,COUNTA(Subcontractors!A:A))+1))
```

### Email Lookup (Column O):
```
=IF(ROW()=1,"Subcontractor Email",INDEX(Subcontractors!B:B,MATCH(N2,Subcontractors!A:A,0)))
```

### Phone Lookup (Column P):
```
=IF(ROW()=1,"Subcontractor Phone",INDEX(Subcontractors!C:C,MATCH(N2,Subcontractors!A:A,0)))
```

---

## 🎉 You're Ready!

Once configured, every booking will automatically:
1. 📊 **Update your Google Sheets**
2. 🔄 **Trigger round-robin assignment**
3. 📧 **Notify the assigned subcontractor**
4. 📋 **Provide complete job details**

No manual intervention required! 🚀