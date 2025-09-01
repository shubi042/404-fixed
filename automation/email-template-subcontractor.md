## Subcontractor assignment email template

Use this with Gmail/Outlook/SMTP/SendGrid/Mailgun in Zap 2.

### Subject
New booking: {{Service Name}} on {{Service Date}} at {{Service Time}} — {{Client Name}}

### Plain text body
Hello {{Assigned Subcontractor}},

You have been assigned a new booking.

- Client: {{Client Name}} ({{Client Email}}, {{Client Phone}})
- Service: {{Service Name}}
- When: {{Service Date}} at {{Service Time}}
- Where: {{Service Address}}
- Notes: {{Notes}}

Please reply to this email to confirm acceptance. If you are unavailable, reply ASAP so we can reassign.

Thank you,
{{Company / From Name}}
Dispatch

### HTML body (optional)
<p>Hello {{Assigned Subcontractor}},</p>
<p>You have been assigned a new booking.</p>
<ul>
  <li><strong>Client:</strong> {{Client Name}} ({{Client Email}}, {{Client Phone}})</li>
  <li><strong>Service:</strong> {{Service Name}}</li>
  <li><strong>When:</strong> {{Service Date}} at {{Service Time}}</li>
  <li><strong>Where:</strong> {{Service Address}}</li>
  <li><strong>Notes:</strong> {{Notes}}</li>
  <li><strong>Booking ID:</strong> {{Booking ID}}</li>
 </ul>
<p>Please reply to this email to confirm acceptance. If you are unavailable, reply ASAP so we can reassign.</p>
<p>Thank you,<br/>
{{Company / From Name}}<br/>
Dispatch</p>

### Field mapping guidance
- Map placeholders to the columns from the Google Sheets trigger: they must match header names exactly.
- If your email app does not allow `{{placeholders}}`, just select the fields from the dropdown in the Zap step.

