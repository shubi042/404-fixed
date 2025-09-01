# 🔧 NETLIFY ENVIRONMENT VARIABLES SETUP

## **CRITICAL**: Set These in Netlify Dashboard

Go to **Netlify Dashboard** → **Your Site** → **Site Settings** → **Environment Variables**

### **REQUIRED VARIABLES:**

```bash
# Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
CONTACT_TO_EMAIL=services@tidymate.ca
OWNER_NOTIFICATION_EMAIL=services@tidymate.ca
FROM_EMAIL=noreply@tidymate.ca

# Stripe Configuration (if using payments)
STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxxxxxx
```

## **HOW TO ADD:**

1. **Netlify Dashboard** → **Sites** → **[Your Site Name]**
2. **Site Settings** → **Environment Variables** 
3. **Add Variable** (for each one above)
4. **Deploy** your site after adding

## **VERIFICATION:**

All emails will now go to: **services@tidymate.ca**
- ✅ Contact form submissions
- ✅ Booking notifications  
- ✅ Customer notifications

## **EMAIL FLOW:**

```
Contact Form → services@tidymate.ca
Booking Notifications → services@tidymate.ca  
From Address → noreply@tidymate.ca
Customer Emails → [Customer's booking receipt/confirmation]
```

**After setting these variables, redeploy your site for changes to take effect.**