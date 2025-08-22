import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL || "services@tidymate.ca"
const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev"

export type OwnerBookingEmailPayload = {
	customerName: string
	customerEmail: string
	phone: string
	address: string
	date: string
	time: string
	serviceName: string
	addons: string[]
	totalAmountCents?: number
	currency?: string
	sessionId?: string
}

export async function sendOwnerBookingEmail(payload: OwnerBookingEmailPayload) {
	if (!resendApiKey) {
		console.warn("Email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}

	const resend = new Resend(resendApiKey)
	const subject = `New Booking: ${payload.serviceName} for ${payload.customerName}`

	const addonsList = payload.addons && payload.addons.length > 0 ? payload.addons.join(", ") : "None"
	const total = payload.totalAmountCents && payload.currency
		? `${(payload.totalAmountCents / 100).toFixed(2)} ${payload.currency.toUpperCase()}`
		: "(total shown in Stripe)"

	const html = `
		<h2>New Booking Received</h2>
		<p><strong>Service:</strong> ${payload.serviceName}</p>
		<p><strong>Add-ons:</strong> ${addonsList}</p>
		<p><strong>Total:</strong> ${total}</p>
		${payload.sessionId ? `<p><strong>Session:</strong> ${payload.sessionId}</p>` : ""}
		<hr/>
		<p><strong>Customer:</strong> ${payload.customerName} (${payload.customerEmail})</p>
		<p><strong>Phone:</strong> ${payload.phone}</p>
		<p><strong>Address:</strong> ${payload.address}</p>
		<p><strong>Preferred Date & Time:</strong> ${payload.date} at ${payload.time}</p>
		<hr/>
		<p><strong>📅 Next Steps:</strong></p>
		<ul>
			<li>Send Calendly booking confirmation to customer</li>
			<li>Schedule the cleaning service in your calendar</li>
			<li>Confirm availability and send final confirmation</li>
		</ul>
		<p><em>💡 Tip: Use your Calendly integration to send the customer a booking confirmation with the exact time slot.</em></p>
	`

	await resend.emails.send({
		from: fromEmail,
		to: ownerEmail,
		subject,
		html,
	})

	return { success: true }
}

export type ContactEmailPayload = {
	name: string
	email: string
	subject: string
	message: string
}

export async function sendContactEmail(payload: ContactEmailPayload) {
	if (!resendApiKey) {
		console.warn("Contact email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}
	const resend = new Resend(resendApiKey)
	const to = process.env.CONTACT_TO_EMAIL || "services@tidymate.ca"
	const subject = `[Contact] ${payload.subject || "New message"} — ${payload.name}`
	const html = `
		<h2>New Contact Form Submission</h2>
		<p><strong>Name:</strong> ${payload.name}</p>
		<p><strong>Email:</strong> ${payload.email}</p>
		<p><strong>Subject:</strong> ${payload.subject}</p>
		<p><strong>Message:</strong><br/>${payload.message.replace(/\n/g, "<br/>")}</p>
	`

	await resend.emails.send({
		from: fromEmail,
		to,
		subject,
		html,
	})

	return { success: true }
}

export async function sendCustomerBookingEmail(payload: OwnerBookingEmailPayload, toEmail: string) {
	if (!resendApiKey) {
		console.warn("Customer email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}
	const resend = new Resend(resendApiKey)
	const subject = `Your TidyMate Booking is Confirmed`
	const addonsList = payload.addons && payload.addons.length > 0 ? payload.addons.join(", ") : "None"
	const total = payload.totalAmountCents && payload.currency
		? `${(payload.totalAmountCents / 100).toFixed(2)} ${payload.currency.toUpperCase()}`
		: "(total shown in receipt)"
	const html = `
		<h2>Thank you, ${payload.customerName}!</h2>
		<p>Your booking is confirmed and payment has been processed.</p>
		<p><strong>Service:</strong> ${payload.serviceName}</p>
		<p><strong>Add-ons:</strong> ${addonsList}</p>
		<p><strong>Total:</strong> ${total}</p>
		${payload.sessionId ? `<p><strong>Reference:</strong> ${payload.sessionId}</p>` : ""}
		<hr/>
		<p><strong>Scheduled:</strong> ${payload.date} at ${payload.time}</p>
		<p><strong>📅 What's Next:</strong></p>
		<ul>
			<li>You'll receive a Calendly booking confirmation with the exact time slot</li>
			<li>Our team will confirm availability within 24 hours</li>
			<li>We'll send you final preparation instructions before your cleaning</li>
		</ul>
		<p>We look forward to serving you!</p>
		<p><em>Questions? Reply to this email or contact us at services@tidymate.ca</em></p>
	`
	await resend.emails.send({ from: fromEmail, to: toEmail, subject, html })
	return { success: true }
}