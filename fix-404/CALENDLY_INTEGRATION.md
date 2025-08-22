# Calendly Integration Guide for TidyMate

## Overview
This guide explains how to set up Calendly integration for your TidyMate cleaning service booking system. The integration provides customers with two booking options:
1. **Instant Booking & Payment** - Direct booking with Stripe payment
2. **Schedule Consultation** - Calendly-powered consultation booking

## Setting Up Calendly

### 1. Create a Calendly Account
1. Go to [calendly.com](https://calendly.com) and create a business account
2. Choose a username (e.g., `tidymate-cleaning` or your business name)
3. Set up your profile with business information

### 2. Create Event Types
Create the following event types in Calendly:

#### A. Cleaning Consultation (30 minutes)
- **Name**: "Cleaning Service Consultation"
- **Duration**: 30 minutes
- **Description**: "Free consultation to discuss your cleaning needs and provide a personalized quote"
- **Questions to ask**:
  - What type of cleaning service are you interested in?
  - Property size (bedrooms/square footage)
  - Preferred date and time for cleaning
  - Any special requirements or instructions
  - Property address

#### B. Booking Confirmation (15 minutes)
- **Name**: "Booking Confirmation Call"
- **Duration**: 15 minutes
- **Description**: "Quick call to confirm your cleaning appointment details"

### 3. Update the Calendly URL in the Code

In the file `fix-404/app/booking/page.tsx`, update line 19:

```typescript
src={`https://calendly.com/YOUR_CALENDLY_USERNAME/cleaning-consultation?embed_domain=${typeof window !== 'undefined' ? window.location.hostname : ''}&embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1&primary_color=000000&text_color=4d4d4d&prefill_1=${encodedService}`}
```

Replace `your-calendly-username` with your actual Calendly username.

### 4. Calendly Webhook Configuration (Optional but Recommended)

To automatically sync bookings, set up webhooks:

1. In Calendly, go to **Integrations & Apps** > **API & Webhooks**
2. Create a new webhook with the endpoint: `https://your-domain.com/api/calendly-webhook`
3. Select events: `invitee.created`, `invitee.canceled`

## Business Workflow

### For Instant Bookings (Stripe Payment)
1. Customer completes booking and payment
2. You receive email notification with booking details
3. **Action Required**: Send customer a Calendly booking confirmation link
4. Customer books specific time slot via Calendly
5. Proceed with cleaning service

### For Consultation Bookings
1. Customer books consultation via Calendly
2. You receive Calendly notification
3. Conduct consultation call
4. Provide quote and book service if customer agrees
5. Send booking confirmation

## Email Templates

### Booking Confirmation Email Template
```
Subject: Booking Confirmation - Please Schedule Your Cleaning Time

Hi [Customer Name],

Thank you for your booking! Your payment has been processed successfully.

To complete your booking, please select your preferred time slot using our scheduling system:
[Insert Calendly Link]

Service Details:
- Service: [Service Type]
- Amount Paid: $[Amount]
- Reference: [Payment ID]

We'll confirm your appointment within 24 hours of your time selection.

Best regards,
TidyMate Team
```

## Technical Implementation

The system includes:
- ✅ Calendly widget embedded in booking page
- ✅ Two booking methods (instant vs consultation)
- ✅ Email notifications mentioning Calendly confirmation
- ✅ Contact form sending to business email (services@tidymate.ca)
- ✅ Updated success page with Calendly workflow

## Environment Variables

Make sure these are set:
```
RESEND_API_KEY=your_resend_api_key
OWNER_NOTIFICATION_EMAIL=services@tidymate.ca
CONTACT_TO_EMAIL=services@tidymate.ca
FROM_EMAIL=noreply@yourdomain.com
```

## Next Steps

1. Set up your Calendly account and event types
2. Update the Calendly URL in the code
3. Test the integration with a test booking
4. Train your team on the new workflow
5. Consider setting up Calendly webhooks for automatic sync

## Support

For technical support with this integration, contact your development team or refer to:
- [Calendly Developer Documentation](https://developer.calendly.com/)
- [Calendly Embedding Guide](https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview)