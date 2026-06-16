# 🚨 URGENT: Fix Calendly Booking Confirmation

## The Problem
Your booking confirmation Calendly event is returning a 404 error:
- ❌ `https://calendly.com/services-tidymate/booking-confirmation` → 404 Not Found
- ✅ `https://calendly.com/services-tidymate/30min` → Working

## Quick Fix Steps (5 minutes)

### Step 1: Log into Calendly
1. Go to [calendly.com](https://calendly.com)
2. Sign in to your `services-tidymate` account

### Step 2: Create Missing Event Type
1. Click **"+ Create"** → **"Event Type"**
2. Choose **"One-on-One"**
3. Fill in details:
   - **Event Name:** "Booking Confirmation Call"
   - **URL:** `booking-confirmation` (this creates the missing URL)
   - **Duration:** 15 minutes
   - **Description:** "Quick call to confirm your cleaning appointment details"

### Step 3: Configure the Event
1. **Availability:** Set your business hours
2. **Questions:** Add these:
   - "What's your booking reference/payment ID?"
   - "Confirm your preferred cleaning date"
   - "Any special instructions?"
3. **Notifications:** Enable email notifications
4. **Save** the event type

### Step 4: Test the Fix
1. Visit: `https://calendly.com/services-tidymate/booking-confirmation`
2. Should now show your booking confirmation calendar
3. Test booking a slot to verify it works

## Alternative Quick Fix
If you prefer a different URL structure, you can:
1. Create the event with any name you want
2. Update these files in your code:
   - `lib/email.ts` (line 40)
   - `app/api/send-calendly-link/route.ts` (line 32)
   - `CALENDLY_INTEGRATION.md` (line 40)

## Verification
After creating the event, run this test:
```bash
curl -I https://calendly.com/services-tidymate/booking-confirmation
# Should return: HTTP/2 200 (not 404)
```

## Impact
Once fixed, customers will be able to:
✅ Complete payments through Stripe
✅ Receive Calendly link via email  
✅ Successfully book their cleaning time slot
✅ Complete the entire booking workflow