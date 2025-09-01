## Testing checklist and edge cases

### Happy path test
1) Send a test booking with a unique `Booking ID`.
2) Confirm Zap 1 created/updated a row in `Bookings` and set `Status = pending`.
3) Within ~2 minutes, verify `Assigned Subcontractor`, `Assigned Email`, and `Assignment Ready = TRUE` are populated.
4) Confirm Zap 2 sent the email and updated `Status = emailed` and `Email Sent At` has a timestamp.

### Dedupe test
1) Send the same `Booking ID` again.
2) Confirm the existing row was updated (not duplicated) and email did not re-send because `Status = emailed`.

### No eligible subcontractor
1) Temporarily set all subcontractors to `Active = FALSE` (or make filters exclude everyone).
2) Send a test booking. After Zap 1 delay, confirm `Status = failed` and `Error Message` explains why. Adjust filters and retest.

### Resend flow
1) On an emailed row, set `Trigger Resend = RESEND`.
2) Edit a non-critical field (e.g., add text to `Notes`) to cause an update event.
3) Confirm Zap 2 re-sent the email and cleared the flag and re-wrote `Email Sent At`.

### Reassignment scenario (optional)
1) Change `Assigned Subcontractor` to a different eligible provider so formulas update `Assigned Email`.
2) Manually set `Trigger Resend = RESEND`.
3) Edit any cell in the row to trigger an update. Confirm new email is sent and prior value is superseded.

### Reliability practices
- Keep a short delay between write and read steps (Zap 1) and before emailing (Zap 2).
- Do not overwrite formula columns from Zap steps.
- Use data validation for `Status` and correct date/time formats.
- Consider adding a periodic monitor Zap to flag any rows where `Assignment Ready = TRUE` and `Email Sent At` is blank for > 10 minutes.

