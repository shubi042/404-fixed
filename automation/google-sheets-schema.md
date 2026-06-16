## Google Sheets schema for automated booking → assignment → email

Use three tabs: `Bookings`, `Subcontractors`, and `Config`.

### Bookings (primary table)
Columns (left to right, exact headers recommended):

- Booking ID
- Created At
- Client Name
- Client Email
- Client Phone
- Service Name
- Service Date
- Service Time
- Service Address
- Notes
- Assigned Subcontractor (formula)
- Assigned Email (formula)
- Assignment Ready (formula)
- Status
- Email Sent At
- Zap Run ID
- Error Message
- Trigger Resend (manual flag)

Guidance:

- Booking ID: unique id from the booking app. Use this for deduplication.
- Status: one of `pending`, `assigned`, `emailed`, `failed`.
- Assigned Subcontractor (formula): round-robin output. You already have this; keep it writing a subcontractor name that exactly matches `Subcontractors!A:A`.
- Assigned Email (formula): VLOOKUP into the `Subcontractors` table by `Assigned Subcontractor`.
  - Example: `=IFNA(VLOOKUP([@[Assigned Subcontractor]], Subcontractors!A:E, 2, FALSE), "")`
- Assignment Ready (formula): only TRUE when all necessary fields are present.
  - Example: `=AND([@[Assigned Subcontractor]]<>"", [@[Assigned Email]]<>"", [@[Status]]<>"emailed")`
- Trigger Resend: leave blank normally. Set to `RESEND` to force Zap 2 to re-send.

Formatting/Data Validation:

- Enforce text for IDs/emails, date for `Service Date`, time for `Service Time`.
- Add data validation (dropdown list) for `Status` with the four allowed values.

Recommended filter view for Zapier troubleshooting: show rows where `Assignment Ready = TRUE` and `Email Sent At` is blank.

### Subcontractors (lookup table)
Columns (exact headers recommended):

- Subcontractor Name
- Email
- Service Types (comma-separated)
- Region
- Active (TRUE/FALSE)
- Capacity Per Day
- Last Assigned At (optional, if your formula uses it)
- Round Robin Counter (optional)

Guidance:

- Keep `Subcontractor Name` unique; this is the key used by formulas.
- Ensure `Active = TRUE` for eligible subcontractors.
- Your round-robin can filter by `Active`, `Service Types`, and `Region` as needed.

### Config (optional helpers)
Suggested keys/values to make formulas simple and auditable:

- RR Scope: `by service` | `global` | `by region`
- Default Lead Time Minutes: e.g., `60`
- Email From Name: e.g., `Your Company`

### Round-robin pattern (reference only)
If useful, here is a robust RR selection pattern concept (adapt to your sheet):

1) Build an eligible list: `=FILTER(Subcontractors!A:A, Subcontractors!E:E=TRUE)`
2) Use a deterministic index based on count of prior bookings (by scope):
   `=INDEX(eligibleList, MOD(priorCount, ROWS(eligibleList))+1)`
3) VLOOKUP the email from `Subcontractors`.

Because your RR is already implemented, you can keep your existing logic. The Zap setup below assumes these outputs exist:

- `Assigned Subcontractor` resolves to an exact name
- `Assigned Email` resolves to a single email address
- `Assignment Ready` TRUE when assignment is ready to email

### Idempotency & reliability

- Always populate Booking ID; Zaps will look up and update rows by this ID to avoid duplicates.
- Zaps will set `Status` to `pending` on intake, then to `emailed` after email is sent. This prevents duplicate emails.
- A small delay (e.g., 1–2 minutes) between intake and readback allows formulas to compute reliably under load.

