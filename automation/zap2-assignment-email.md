## Zap 2: When assignment is ready → email subcontractor → update row

Purpose: Watch for new/updated `Bookings` rows; when `Assignment Ready = TRUE`, email the assigned subcontractor and mark the row as emailed.

### Prerequisites
- `Assigned Subcontractor`, `Assigned Email`, and `Assignment Ready` formulas implemented (see schema).
- Email connector of choice: Gmail, Outlook, SMTP, SendGrid, or Mailgun.

### Zap steps

1) Trigger: Google Sheets → New or Updated Spreadsheet Row
   - Spreadsheet: your booking spreadsheet
   - Worksheet: `Bookings`
   - Trigger on both new and updated rows.

2) Filter by Zapier
   Continue ONLY if ALL are true:
   - `Assignment Ready` = TRUE
   - `Assigned Email` is not empty
   - AND ( `Status` is not `emailed` OR `Trigger Resend` = `RESEND` )

3) Delay by Zapier → Delay For
   - 30–60 seconds to avoid racing with formula refresh on rapid updates.

4) Send Email (pick one)
   - Gmail/Outlook: Send Email
   - SMTP by Zapier
   - SendGrid or Mailgun: Send Email
   Mapping:
   - To = `Assigned Email`
   - From / Sender = your business mailbox
   - Subject = see template in `email-template-subcontractor.md`
   - Body = use the template and map the booking fields
   - Reply-To = your dispatch/support email

5) Google Sheets → Update Spreadsheet Row
   - Row: the one from the trigger
   - Set `Status = emailed`
   - Set `Email Sent At = Zap Meta Human Now`
   - Clear `Trigger Resend` (blank)
   - Optionally set `Error Message` = blank

### Optional: Reassignment handling
- If `Assigned Subcontractor` changes after emailing, set `Trigger Resend = RESEND` manually to force a re-send to the new subcontractor. The Filter allows this and step 5 clears the flag.
- For fully automated reassignments, add a "Paths" step comparing a stored "Notified Email" column vs. current `Assigned Email`. If different, send reassign email and update the stored value.

### Failure handling
- If the email step fails, this Zap will stop before the Update Row step, leaving `Status` unchanged. You can:
  - Add a catch-up Zap that finds rows with `Assignment Ready = TRUE` and `Email Sent At` blank for > X minutes and re-triggers.
  - Add a Slack/Email alert Zap on rows where `Status = failed` or `Error Message` is populated.

