# 📊 GOOGLE SHEETS INTEGRATION SETUP

## 🎯 **AUTOMATIC BOOKING TRACKING**

Every booking will now automatically be added to a Google Sheet with all customer details and payment information.

---

## 🔧 **SETUP STEPS**

### **STEP 1: Create Google Cloud Project**
1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Create new project** or select existing one
3. **Enable Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### **STEP 2: Create Service Account**
1. **Go to**: "APIs & Services" → "Credentials"
2. **Click "Create Credentials"** → **"Service Account"**
3. **Name**: `tidymate-bookings`
4. **Description**: `Service account for booking sheet updates`
5. **Click "Create and Continue"**
6. **Skip role assignment** → **Click "Done"**

### **STEP 3: Generate Service Account Key**
1. **Click on the service account** you just created
2. **Go to "Keys" tab**
3. **Click "Add Key"** → **"Create new key"**
4. **Choose "JSON"** → **Click "Create"**
5. **Download the JSON file** (keep it safe!)

### **STEP 4: Create Google Sheet**
1. **Go to**: [Google Sheets](https://sheets.google.com)
2. **Create new spreadsheet**
3. **Name it**: "TidyMate Bookings"
4. **Rename the first sheet** to: `Bookings`
5. **Copy the Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### **STEP 5: Share Sheet with Service Account**
1. **In your Google Sheet** → **Click "Share"**
2. **Add the service account email** (from the JSON file):
   ```
   tidymate-bookings@your-project.iam.gserviceaccount.com
   ```
3. **Give "Editor" permissions**
4. **Click "Send"**

---

## 🔑 **ENVIRONMENT VARIABLES TO ADD**

Add these to your **new Netlify site**:

```bash
# Google Sheets Integration
GOOGLE_SHEET_ID=your_sheet_id_from_url
GOOGLE_CLIENT_EMAIL=tidymate-bookings@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_private_key_from_json_file
-----END PRIVATE KEY-----"
```

**⚠️ Important**: Copy the entire private key including the BEGIN/END lines, and wrap it in quotes.

---

## 📋 **SHEET STRUCTURE**

Your Google Sheet will automatically get these columns:

| Column | Data |
|--------|------|
| A | Timestamp |
| B | Customer Name |
| C | Email |
| D | Phone |
| E | Address |
| F | Service |
| G | Add-ons |
| H | Total Amount |
| I | Preferred Date |
| J | Preferred Time |
| K | Instructions |
| L | Session ID |
| M | Payment Status |

---

## 🧪 **TESTING THE INTEGRATION**

After setting up:

1. **Deploy your site** with the new environment variables
2. **Make a test booking** (use Stripe test mode)
3. **Check your Google Sheet** - new row should appear automatically
4. **Check server logs** for success/error messages

---

## 🎉 **WHAT YOU'LL GET**

- ✅ **Automatic booking tracking** in Google Sheets
- ✅ **Real-time updates** when payments complete
- ✅ **All customer details** organized in spreadsheet
- ✅ **Easy to export/analyze** booking data
- ✅ **Backup of all bookings** in case emails are missed

---

## 🔍 **TROUBLESHOOTING**

### **If bookings don't appear in sheets:**
1. **Check Netlify function logs** for Google Sheets errors
2. **Verify service account** has editor access to sheet
3. **Check environment variables** are set correctly
4. **Test with a simple booking** first

### **Common Issues:**
- **Private key formatting**: Make sure it includes BEGIN/END lines
- **Sheet permissions**: Service account must have editor access
- **Sheet ID**: Copy from URL, not sheet name

---

## 📞 **READY TO SET UP?**

Follow the steps above, then add the environment variables to your new Netlify site.

**After setup, every booking will automatically appear in your Google Sheet! 📊**