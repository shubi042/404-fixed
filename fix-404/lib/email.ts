import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL || "services@tidymate.ca"
const fromEmail = process.env.FROM_EMAIL || "noreply@tidymate.ca"

export type OwnerBookingEmailPayload = {
	customerName: string
	customerEmail: string
	phone: string
	address: string
	date: string
	time: string
	instructions: string
	serviceName: string
	addons: string[]
	totalAmountCents?: number
	currency?: string
	sessionId?: string
}

export async function sendOwnerBookingEmail(payload: OwnerBookingEmailPayload, contractorInfo?: any) {
	if (!resendApiKey) {
		console.warn("Email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}

	const resend = new Resend(resendApiKey)
	const subject = `New Booking: ${payload.serviceName} for ${payload.customerName}${contractorInfo ? ` — Assigned to ${contractorInfo.contractorName}` : ""}`

	const addonsList = payload.addons?.length > 0 ? payload.addons.join(", ") : "None"
	const total = payload.totalAmountCents && payload.currency
		? `${(payload.totalAmountCents / 100).toFixed(2)} ${payload.currency.toUpperCase()}`
		: "(see Stripe dashboard)"

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #059669;">💼 New Booking Received${contractorInfo ? " — Contractor Assigned" : " — Action Required"}</h2>

			${contractorInfo ? `
			<div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
				<h3 style="margin-top: 0; color: #065f46;">👷 Contractor Assigned</h3>
				<p><strong>Name:</strong> ${contractorInfo.contractorName}</p>
				<p><strong>Email:</strong> ${contractorInfo.contractorEmail}</p>
				<p><strong>Phone:</strong> ${contractorInfo.contractorPhone}</p>
				<p><strong>Estimated Duration:</strong> ${contractorInfo.estimatedDuration || "2-3 hours"}</p>
				<p><em>✅ Contractor notified automatically</em></p>
			</div>
			` : `
			<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
				<h3>⚠️ Manual assignment needed — no contractor auto-assigned.</h3>
			</div>
			`}

			<div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
				<h3 style="margin-top: 0; color: #1d4ed8;">📋 Booking Details</h3>
				<p><strong>Service:</strong> ${payload.serviceName}</p>
				<p><strong>Add-ons:</strong> ${addonsList}</p>
				<p><strong>Total Paid:</strong> ${total}</p>
				<p><strong>Date:</strong> ${payload.date || "Not specified"}</p>
				<p><strong>Time:</strong> ${payload.time || "Not specified"}</p>
				${payload.sessionId ? `<p><strong>Payment Session:</strong> ${payload.sessionId}</p>` : ""}
			</div>

			<div style="background: #fef7cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
				<h3 style="margin-top: 0; color: #92400e;">👤 Customer Information</h3>
				<p><strong>Name:</strong> ${payload.customerName}</p>
				<p><strong>Email:</strong> ${payload.customerEmail}</p>
				<p><strong>Phone:</strong> ${payload.phone}</p>
				<p><strong>Address:</strong> ${payload.address}</p>
				<p><strong>Special Instructions:</strong> ${payload.instructions || "None"}</p>
			</div>

			<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/>
			<p style="text-align: center; color: #6b7280;">
				<strong>📊 Booking logged to Google Sheets</strong><br/>
				All details automatically recorded for your records.
			</p>
		</div>
	`

	await resend.emails.send({ from: fromEmail, to: ownerEmail, subject, html })
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
		console.error("❌ RESEND_API_KEY is not configured")
		return { skipped: true, error: "RESEND_API_KEY not configured" }
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

	try {
		const result = await resend.emails.send({ from: fromEmail, to, subject, html })
		return { success: true, result }
	} catch (error: any) {
		console.error("❌ Email send failed:", error)
		throw new Error(`Email send failed: ${error.message}`)
	}
}

export async function sendCustomerBookingEmail(payload: OwnerBookingEmailPayload, toEmail: string) {
	if (!resendApiKey) {
		console.warn("Customer email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}

	const resend = new Resend(resendApiKey)
	const subject = `Your TidyMate Booking is Confirmed — ${payload.serviceName}`
	const addonsList = payload.addons?.length > 0 ? payload.addons.join(", ") : "None"
	const total = payload.totalAmountCents && payload.currency
		? `${(payload.totalAmountCents / 100).toFixed(2)} ${payload.currency.toUpperCase()}`
		: "(see your receipt)"

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #2563eb;">🎉 Booking Confirmed — Thank you, ${payload.customerName}!</h2>
			<p>Your cleaning service has been booked and payment processed successfully.</p>

			<div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
				<h3 style="margin-top: 0; color: #1d4ed8;">📋 Your Booking Details</h3>
				<p><strong>Service:</strong> ${payload.serviceName}</p>
				<p><strong>Add-ons:</strong> ${addonsList}</p>
				<p><strong>Total Paid:</strong> ${total}</p>
				<p><strong>Requested Date:</strong> ${payload.date || "To be confirmed"}</p>
				<p><strong>Preferred Time:</strong> ${payload.time || "To be confirmed"}</p>
				<p><strong>Service Address:</strong> ${payload.address}</p>
				${payload.instructions ? `<p><strong>Special Instructions:</strong> ${payload.instructions}</p>` : ""}
				${payload.sessionId ? `<p><strong>Booking Reference:</strong> ${payload.sessionId}</p>` : ""}
			</div>

			<div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
				<h3 style="color: #1e40af;">📅 What Happens Next:</h3>
				<ol style="color: #374151;">
					<li><strong>We'll contact you within 2 hours</strong> to confirm the exact time slot</li>
					<li><strong>Our professional cleaner will arrive</strong> at your scheduled time with all equipment</li>
					<li><strong>Enjoy your spotless space!</strong></li>
				</ol>
			</div>

			<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
				<h4 style="margin-top: 0; color: #92400e;">📞 Important Reminders</h4>
				<ul style="color: #78350f;">
					<li><strong>Cancellation Policy:</strong> No refunds after booking. Cancellations within 24 hours result in payment forfeiture.</li>
					<li><strong>Access:</strong> Please ensure someone is available to provide access to the property</li>
					<li><strong>Changes:</strong> Contact us immediately at services@tidymate.ca</li>
				</ul>
			</div>

			<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/>
			<p style="text-align: center; color: #6b7280;">
				<strong>Questions?</strong><br/>
				Email: <a href="mailto:services@tidymate.ca" style="color: #2563eb;">services@tidymate.ca</a>
			</p>
		</div>
	`

	await resend.emails.send({ from: fromEmail, to: toEmail, subject, html })
	return { success: true }
}

export async function sendContractorBookingEmail(contractorEmail: string, contractorName: string, bookingDetails: any) {
	if (!resendApiKey) {
		console.warn("Contractor email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}

	const resend = new Resend(resendApiKey)
	const subject = `New Job Assignment — ${bookingDetails.service} on ${bookingDetails.date || "TBD"}`

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #dc2626;">🔧 New Job Assignment — ${contractorName}</h2>

			<div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
				<h3 style="margin-top: 0; color: #991b1b;">📋 Job Details</h3>
				<p><strong>Service:</strong> ${bookingDetails.service}</p>
				<p><strong>Add-ons:</strong> ${bookingDetails.addons || "None"}</p>
				<p><strong>Estimated Duration:</strong> ${bookingDetails.estimatedDuration || "2-3 hours"}</p>
				<p><strong>Date:</strong> ${bookingDetails.date || "To be confirmed"}</p>
				<p><strong>Time:</strong> ${bookingDetails.time || "To be confirmed"}</p>
			</div>

			<div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
				<h3 style="margin-top: 0; color: #92400e;">📍 Location & Access</h3>
				<p><strong>Address:</strong> ${bookingDetails.address}</p>
				<p><strong>Special Instructions:</strong> ${bookingDetails.instructions || "None provided"}</p>
			</div>

			<div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
				<h3 style="margin-top: 0; color: #1d4ed8;">👤 Customer Information</h3>
				<p><strong>Customer:</strong> ${bookingDetails.customerName}</p>
				<p><strong>Phone:</strong> ${bookingDetails.phone}</p>
				<p><strong>Email:</strong> ${bookingDetails.customerEmail}</p>
			</div>

			<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
				<h3 style="margin-top: 0; color: #15803d;">✅ Action Required</h3>
				<ol style="color: #166534;">
					<li>Contact customer to confirm exact arrival time</li>
					<li>Arrive punctually with all necessary equipment</li>
					<li>Complete service to TidyMate standards</li>
					<li>Send completion confirmation to services@tidymate.ca</li>
				</ol>
			</div>

			<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/>
			<p style="text-align: center; color: #6b7280;">
				Questions? Contact: <a href="mailto:services@tidymate.ca" style="color: #2563eb;">services@tidymate.ca</a>
			</p>
		</div>
	`

	await resend.emails.send({ from: fromEmail, to: contractorEmail, subject, html })
	return { success: true }
}