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

### 3. ✅ Calendly URL Updated

Your Calendly integration is now active with username: **services-tidymate**

Current URLs in the system:
- Consultation bookings: `https://calendly.com/services-tidymate/30min`
- Customer booking confirmations: `https://calendly.com/services-tidymate/booking-confirmation`

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

### ✅ Current Features:
- **Enhanced Calendly Widget Component** (`/components/calendly-widget.tsx`)
  - Responsive design with loading states
  - Popup and inline embed options
  - Automatic prefill with customer data
  - Event scheduling callbacks
- **Dual Booking Methods** on main booking page
  - Instant booking with immediate payment
  - Consultation booking via Calendly
- **Success Page Integration** 
  - Immediate Calendly scheduling option
  - Both popup and inline calendar widgets
  - Automatic customer data prefill
- **Calendly Webhook Handler** (`/api/calendly-webhook`)
  - Automatic email notifications for new bookings
  - Cancellation handling
  - Business owner and customer notifications
- **Calendly API Integration** (`/lib/calendly.ts`)
  - Programmatic event management
  - Webhook setup utilities
  - Event type and booking retrieval
- **Admin Dashboard Component** (`/components/calendly-admin.tsx`)
  - Real-time booking overview
  - Event type management
  - Integration status monitoring

### 🔄 Automated Workflows:
1. **Instant Booking Flow:**
   - Customer pays → Success page → Immediate Calendly scheduling option
   - Automatic email with Calendly link
   - Webhook notifications for both parties

2. **Consultation Flow:**
   - Customer selects consultation → Direct Calendly booking
   - Automatic confirmation emails
   - Follow-up booking after consultation

## Environment Variables

Make sure these are set for full Calendly integration:

### Required Variables:
```
RESEND_API_KEY=your_resend_api_key
OWNER_NOTIFICATION_EMAIL=services@tidymate.ca
CONTACT_TO_EMAIL=services@tidymate.ca
FROM_EMAIL=noreply@tidymate.ca
```

### Optional (for advanced features):
```
CALENDLY_ACCESS_TOKEN=your_calendly_personal_access_token
CALENDLY_WEBHOOK_SECRET=your_webhook_signing_secret
```

### Getting Calendly API Credentials:

#### Personal Access Token:
1. Go to [Calendly Developer Portal](https://developer.calendly.com/)
2. Sign in with your Calendly account
3. Navigate to "Personal Access Tokens"
4. Create a new token with the following scopes:
   - `read:user`
   - `read:event_types`
   - `read:scheduled_events`
   - `read:invitees`
   - `write:webhook_subscriptions`
5. Copy the token and add it to your environment variables

#### Webhook Secret (Optional):
1. When setting up webhooks, Calendly provides a signing secret
2. Use this to verify webhook authenticity in production
3. Add it to your environment variables for security

## Next Steps

### Immediate Setup (Required):
1. ✅ Calendly account already configured: `services-tidymate`
2. ✅ Event types created and active
3. ✅ Website integration implemented
4. 🔄 Test the integration with a test booking

### Advanced Features (Optional):
1. **API Integration**: Add `CALENDLY_ACCESS_TOKEN` to environment variables for:
   - Real-time booking data
   - Automatic webhook setup
   - Admin dashboard functionality
   
2. **Webhook Security**: Add `CALENDLY_WEBHOOK_SECRET` for:
   - Webhook signature verification
   - Enhanced security
   
3. **Custom Branding**: Customize Calendly appearance in your account:
   - Match TidyMate brand colors
   - Add custom questions
   - Set business hours and availability

### Testing Checklist:
- [ ] Test consultation booking from homepage
- [ ] Test instant booking → Calendly scheduling flow
- [ ] Verify email notifications are sent
- [ ] Check webhook notifications (if API token configured)
- [ ] Test popup and inline calendar widgets

## Support

For technical support with this integration, contact your development team or refer to:
- [Calendly Developer Documentation](https://developer.calendly.com/)
- [Calendly Embedding Guide](https://help.calendly.com/hc/en-us/articles/223147027-Embed-options-overview)