## Zap 1: Booking intake → Google Sheets with dedupe and formula settle

Purpose: Ingest a new booking from your booking source (or Webhook), write/update a row in `Bookings`, give formulas time to compute the assignment, and set initial status.

### Prerequisites
- Google Sheet with tabs per `google-sheets-schema.md`.
- A unique `Booking ID` from your booking platform.

### Zap steps

1) Trigger: Your booking app (or Webhooks by Zapier → Catch Hook)
   - Example triggers: "New Booking" (Calendly, Acuity, etc.) or Webhook payload from your site.

2) [Optional] Formatter by Zapier → Date/Time
   - Normalize `Service Date` to a date and `Service Time` to a time string if needed.

3) Google Sheets → Lookup Spreadsheet Row (recommended) OR Find Row
   - Spreadsheet: your booking spreadsheet
   - Worksheet: `Bookings`
   - Lookup Column: `Booking ID`
   - Lookup Value: trigger’s Booking ID
   - Enable: Create Google Sheets Row if it doesn’t exist = ON (if available in your account)

4) If creating a new row, map fields as follows
   - Booking ID = trigger.BookingID
   - Created At = Zap Meta Human Now
   - Client Name / Email / Phone = trigger fields
   - Service Name / Date / Time / Address / Notes = trigger fields
   - Status = `pending`
   - Email Sent At = blank
   - Error Message = blank
   - Trigger Resend = blank

   If updating existing row, only update the core booking fields; do NOT overwrite `Status`, `Email Sent At`, or formula-driven columns.

5) Delay by Zapier → Delay For
   - 1–2 minutes. This lets formulas compute `Assigned Subcontractor`, `Assigned Email`, and `Assignment Ready` reliably.

6) Google Sheets → Lookup Spreadsheet Row (again)
   - Same lookup by `Booking ID` to fetch the updated, formula-populated row.

7) [Optional] Google Sheets → Update Spreadsheet Row
   - If `Assigned Email` is not blank, set `Status = assigned`.
   - Else set `Status = failed` and write a short `Error Message` (e.g., "No eligible subcontractor"). Zap 2 will not run when failed.

### Notes
- Idempotent: Using Lookup by `Booking ID` prevents duplicates and updates the same row if the booking is re-sent.
- If your booking app lacks a stable Booking ID, generate one upstream (e.g., UUID at form submit) and persist it.
- Keep the column headers EXACT as in the schema so mappings are stable.

