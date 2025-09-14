# 👷 SUBCONTRACTORS GOOGLE SHEET SETUP

## 📊 **CONTRACTOR MANAGEMENT VIA GOOGLE SHEETS**

Your system now reads contractors from your Google Sheets "subcontractors" sheet and only sends emails to registered, active contractors.

---

## 🔧 **GOOGLE SHEET STRUCTURE**

### **Sheet Name**: `subcontractors`

### **Column Structure** (Row 1 = Headers):

| Column | Header | Example | Description |
|--------|--------|---------|-------------|
| A | ID | contractor-001 | Unique contractor ID |
| B | Name | Maria Santos | Full contractor name |
| C | Email | maria@tidymate.ca | Contractor email (for job notifications) |
| D | Phone | (416) 555-0101 | Contractor phone number |
| E | Specialties | airbnb,residential,deep-clean | Comma-separated service types |
| F | Availability | monday,tuesday,wednesday,thursday,friday | Comma-separated days available |
| G | Max Jobs Per Day | 3 | Maximum jobs contractor can handle daily |
| H | Status | active | active/inactive (only active get assignments) |

---

## 📋 **SAMPLE CONTRACTOR DATA**

```
Row 1 (Headers):
ID | Name | Email | Phone | Specialties | Availability | Max Jobs Per Day | Status

Row 2:
contractor-001 | Maria Santos | maria@tidymate.ca | (416) 555-0101 | airbnb,residential | monday,tuesday,wednesday,thursday,friday | 3 | active

Row 3:
contractor-002 | David Chen | david@tidymate.ca | (416) 555-0102 | post-construction,commercial | tuesday,wednesday,thursday,friday,saturday | 2 | active

Row 4:
contractor-003 | Sarah Johnson | sarah@tidymate.ca | (416) 555-0103 | airbnb,residential | monday,wednesday,thursday,friday,saturday | 4 | active
```

---

## 🎯 **SPECIALTIES MATCHING**

### **Service Type → Contractor Specialty:**
- **Airbnb/Residential** services → Contractors with `airbnb` or `residential` specialty
- **Post-Construction** services → Contractors with `post-construction` specialty  
- **Commercial** services → Contractors with `commercial` specialty

### **Availability Matching:**
- **Monday bookings** → Contractors with `monday` in availability
- **Tuesday bookings** → Contractors with `tuesday` in availability
- etc.

---

## ✅ **AUTOMATIC EMAIL SENDING**

### **Who Gets Emails:**
1. **✅ Business Owner** (services@tidymate.ca): Always gets booking + contractor info
2. **✅ Customer**: Always gets booking confirmation (no contractor details)
3. **✅ Assigned Contractor**: Only if they're in the "subcontractors" sheet and status = "active"

### **Email Content:**
- **Business Email**: Includes contractor assignment details
- **Customer Email**: Booking details only (no contractor info)
- **Contractor Email**: Job assignment with customer contact info and address

---

## 🔧 **SETUP STEPS**

### **1. Create Subcontractors Sheet**
1. **In your existing Google Sheet** (same one used for bookings)
2. **Add new sheet tab** called `subcontractors`
3. **Add headers** in row 1 (A1:H1)
4. **Add contractor data** starting from row 2

### **2. Contractor Status Management**
- **active**: Contractor gets job assignments ✅
- **inactive**: Contractor skipped for assignments ❌
- **Update status** anytime to control assignments

### **3. Add/Remove Contractors**
- **Add new row**: New contractor available for assignments
- **Set status to inactive**: Temporarily disable contractor
- **Delete row**: Permanently remove contractor

---

## 🧪 **TESTING THE SYSTEM**

### **Test Contractor Assignment:**
1. **Add test contractors** to your subcontractors sheet
2. **Make a booking** on your live site
3. **Check emails**:
   - You should get email with contractor assignment
   - Customer should get booking confirmation
   - Assigned contractor should get job notification
4. **Check Google Sheets** - booking should include contractor details

---

## 📞 **FALLBACK SYSTEM**

If Google Sheets is unavailable or not configured:
- **System uses fallback contractors** (Maria, David, Sarah, Ahmed)
- **Emails still sent** to business and customer
- **Contractor emails** sent to fallback contractor emails

---

## 🎉 **BENEFITS**

- ✅ **Easy contractor management** via Google Sheets
- ✅ **Real-time updates** (add/remove contractors anytime)
- ✅ **Automatic assignment** based on specialty and availability
- ✅ **Email notifications** to all parties
- ✅ **Complete tracking** in your booking sheet

**Set up your subcontractors sheet and the system will automatically assign jobs to your registered contractors! 🚀**