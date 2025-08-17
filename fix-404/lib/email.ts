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