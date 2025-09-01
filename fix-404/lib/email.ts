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
		<h2>🎉 New Booking Received - Action Required</h2>
		<div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
			<h3>📅 CALENDLY ACTION NEEDED:</h3>
			<p><strong>Send this link to customer to confirm their exact time slot:</strong></p>
			<p><a href="https://calendly.com/services-tidymate/booking-confirmation" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Customer Calendly Booking Link</a></p>
			<p><em>Send this link to customer via email or text</em></p>
		</div>
		
		<h3>Booking Details:</h3>
		<p><strong>Service:</strong> ${payload.serviceName}</p>
		<p><strong>Add-ons:</strong> ${addonsList}</p>
		<p><strong>Total Paid:</strong> ${total}</p>
		${payload.sessionId ? `<p><strong>Payment Session:</strong> ${payload.sessionId}</p>` : ""}
		
		<h3>Customer Information:</h3>
		<p><strong>Name:</strong> ${payload.customerName}</p>
		<p><strong>Email:</strong> ${payload.customerEmail}</p>
		<p><strong>Phone:</strong> ${payload.phone}</p>
		<p><strong>Address:</strong> ${payload.address}</p>
		<p><strong>Requested Date & Time:</strong> ${payload.date} at ${payload.time}</p>
		
		<hr style="margin: 20px 0;"/>
		<h3>📋 Your Action Items:</h3>
		<ol>
			<li><strong>Send Calendly link above to customer</strong> - They'll pick exact time slot</li>
			<li><strong>You'll get Calendly notification</strong> when they book</li>
			<li><strong>Confirm service availability</strong> and send final details</li>
		</ol>
		
		<div style="background: #f0f9ff; padding: 10px; border-radius: 5px; margin-top: 15px;">
			<p><strong>💡 Pro Tip:</strong> All customer bookings through Calendly will automatically appear in your calendar at calendly.com/services-tidymate!</p>
		</div>
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
		console.error("❌ RESEND_API_KEY is not configured")
		return { skipped: true, error: "RESEND_API_KEY not configured" }
	}
	
	const resend = new Resend(resendApiKey)
	const to = process.env.CONTACT_TO_EMAIL || "services@tidymate.ca"
	const subject = `[Contact] ${payload.subject || "New message"} — ${payload.name}`
	
	console.log("📧 Attempting to send email:", {
		from: fromEmail,
		to: to,
		subject: subject,
		hasApiKey: !!resendApiKey
	})
	
	const html = `
		<h2>New Contact Form Submission</h2>
		<p><strong>Name:</strong> ${payload.name}</p>
		<p><strong>Email:</strong> ${payload.email}</p>
		<p><strong>Subject:</strong> ${payload.subject}</p>
		<p><strong>Message:</strong><br/>${payload.message.replace(/\n/g, "<br/>")}</p>
	`

	try {
		const result = await resend.emails.send({
			from: fromEmail,
			to,
			subject,
			html,
		})
		
		console.log("✅ Email sent successfully:", result)
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
	const subject = `Your TidyMate Booking is Confirmed`
	const addonsList = payload.addons && payload.addons.length > 0 ? payload.addons.join(", ") : "None"
	const total = payload.totalAmountCents && payload.currency
		? `${(payload.totalAmountCents / 100).toFixed(2)} ${payload.currency.toUpperCase()}`
		: "(total shown in receipt)"
	const html = `
		<h2>🎉 Thank you, ${payload.customerName}!</h2>
		<p>Your booking is confirmed and payment has been processed successfully!</p>
		
		<div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
			<h3>📅 Next Step: Choose Your Exact Time Slot</h3>
			<p>You'll receive a <strong>Calendly booking link</strong> from us within 2 hours to select your preferred time slot.</p>
		</div>
		
		<h3>Your Booking Details:</h3>
		<p><strong>Service:</strong> ${payload.serviceName}</p>
		<p><strong>Add-ons:</strong> ${addonsList}</p>
		<p><strong>Total Paid:</strong> ${total}</p>
		${payload.sessionId ? `<p><strong>Reference ID:</strong> ${payload.sessionId}</p>` : ""}
		
		<p><strong>Requested Date & Time:</strong> ${payload.date} at ${payload.time}</p>
		
		<hr style="margin: 20px 0;"/>
		<h3>📋 What Happens Next:</h3>
		<ol>
			<li><strong>We'll send you a Calendly link</strong> to pick your exact time slot</li>
			<li><strong>Book your preferred time</strong> through Calendly</li>
			<li><strong>Receive final confirmation</strong> with cleaner details</li>
			<li><strong>Enjoy your professional cleaning!</strong></li>
		</ol>
		
		<div style="background: #e6f7e6; padding: 10px; border-radius: 5px; margin-top: 15px;">
			<p><strong>✅ Your payment is secure and confirmed!</strong></p>
			<p>We look forward to providing you with exceptional cleaning service!</p>
		</div>
		
		<p style="margin-top: 20px;"><em>Questions? Reply to this email or contact us at services@tidymate.ca</em></p>
	`
	await resend.emails.send({ from: fromEmail, to: toEmail, subject, html })
	return { success: true }
}

export type SubcontractorInfo = {
	name: string
	email: string
	phone: string
	specialties: string[]
}

export type BookingData = {
	customerName: string
	customerEmail: string
	phone: string
	address: string
	date: string
	time: string
	serviceName: string
	addons: string[]
	totalAmount: number
	currency: string
	sessionId: string
	instructions?: string
}

export async function sendSubcontractorNotificationEmail(
	booking: BookingData,
	subcontractor: SubcontractorInfo
) {
	if (!resendApiKey) {
		console.warn("Subcontractor email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}

	const resend = new Resend(resendApiKey)
	const subject = `🧹 New Job Assignment: ${booking.serviceName} - ${booking.date}`
	
	const addonsList = booking.addons && booking.addons.length > 0 ? booking.addons.join(", ") : "None"
	const total = `${booking.totalAmount.toFixed(2)} ${booking.currency.toUpperCase()}`

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #0066cc;">🧹 New Job Assignment</h2>
			<p>Hi ${subcontractor.name},</p>
			<p>You've been assigned a new cleaning job through our automated system. Please review the details below:</p>
			
			<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0; color: #333;">📋 Job Details</h3>
				<table style="width: 100%; border-collapse: collapse;">
					<tr><td style="padding: 5px 0; font-weight: bold;">Service:</td><td>${booking.serviceName}</td></tr>
					<tr><td style="padding: 5px 0; font-weight: bold;">Add-ons:</td><td>${addonsList}</td></tr>
					<tr><td style="padding: 5px 0; font-weight: bold;">Date & Time:</td><td>${booking.date} at ${booking.time}</td></tr>
					<tr><td style="padding: 5px 0; font-weight: bold;">Total Value:</td><td style="font-weight: bold; color: #0066cc;">${total}</td></tr>
				</table>
			</div>

			<div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0; color: #333;">👤 Customer Information</h3>
				<table style="width: 100%; border-collapse: collapse;">
					<tr><td style="padding: 5px 0; font-weight: bold;">Name:</td><td>${booking.customerName}</td></tr>
					<tr><td style="padding: 5px 0; font-weight: bold;">Email:</td><td><a href="mailto:${booking.customerEmail}">${booking.customerEmail}</a></td></tr>
					<tr><td style="padding: 5px 0; font-weight: bold;">Phone:</td><td><a href="tel:${booking.phone}">${booking.phone}</a></td></tr>
					<tr><td style="padding: 5px 0; font-weight: bold;">Address:</td><td>${booking.address}</td></tr>
				</table>
			</div>

			${booking.instructions ? `
			<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
				<h4 style="margin-top: 0; color: #856404;">📝 Special Instructions</h4>
				<p style="margin-bottom: 0;">${booking.instructions}</p>
			</div>
			` : ''}

			<div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h3 style="margin-top: 0; color: #155724;">✅ Next Steps</h3>
				<ol style="margin: 0; padding-left: 20px;">
					<li><strong>Confirm availability</strong> - Reply to this email or call the office</li>
					<li><strong>Contact customer</strong> if needed for clarifications</li>
					<li><strong>Arrive on time</strong> with all necessary equipment</li>
					<li><strong>Complete the service</strong> to our high standards</li>
					<li><strong>Update job status</strong> when finished</li>
				</ol>
			</div>

			<div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
				<p style="color: #6c757d; font-size: 14px;">
					<strong>Reference ID:</strong> ${booking.sessionId}<br>
					<strong>Assigned via:</strong> Round Robin System<br>
					<strong>Questions?</strong> Contact the office at services@tidymate.ca
				</p>
			</div>
		</div>
	`

	try {
		await resend.emails.send({
			from: fromEmail,
			to: subcontractor.email,
			subject,
			html,
		})
		
		console.log(`✅ Subcontractor notification sent to ${subcontractor.name} (${subcontractor.email})`)
		return { success: true }
	} catch (error) {
		console.error("Failed to send subcontractor notification:", error)
		throw error
	}
}