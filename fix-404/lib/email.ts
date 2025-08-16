import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL
const fromEmail = process.env.FROM_EMAIL || "no-reply@tidymate.ca"

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
}

export async function sendOwnerBookingEmail(payload: OwnerBookingEmailPayload) {
	if (!resendApiKey || !ownerEmail) {
		console.warn("Email not sent: RESEND_API_KEY or OWNER_NOTIFICATION_EMAIL is not configured.")
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
		<hr/>
		<p><strong>Customer:</strong> ${payload.customerName} (${payload.customerEmail})</p>
		<p><strong>Phone:</strong> ${payload.phone}</p>
		<p><strong>Address:</strong> ${payload.address}</p>
		<p><strong>Preferred Date & Time:</strong> ${payload.date} at ${payload.time}</p>
	`

	await resend.emails.send({
		from: fromEmail,
		to: ownerEmail,
		subject,
		html,
	})

	return { success: true }
}