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

export async function sendOwnerBookingEmail(payload: OwnerBookingEmailPayload, contractorInfo?: any) {
	if (!resendApiKey) {
		console.warn("Email not sent: RESEND_API_KEY is not configured.")
		return { skipped: true }
	}

	const resend = new Resend(resendApiKey)
	const subject = `New Booking: ${payload.serviceName} for ${payload.customerName}${contractorInfo ? ` - Assigned to ${contractorInfo.contractorName}` : ''}`

	const addonsList = payload.addons && payload.addons.length > 0 ? payload.addons.join(", ") : "None"
	const total = payload.totalAmountCents && payload.currency
		? `${(payload.totalAmountCents / 100).toFixed(2)} ${payload.currency.toUpperCase()}`
		: "(total shown in Stripe)"

	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #059669;">💼 New Booking Received - ${contractorInfo ? 'Contractor Assigned' : 'Action Required'}</h2>
			
			${contractorInfo ? `
			<div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
				<h3 style="margin-top: 0; color: #065f46;">👷 CONTRACTOR ASSIGNED</h3>
				<p><strong>Assigned to:</strong> ${contractorInfo.contractorName}</p>
				<p><strong>Contractor Email:</strong> ${contractorInfo.contractorEmail}</p>
				<p><strong>Contractor Phone:</strong> ${contractorInfo.contractorPhone}</p>
				<p><strong>Estimated Duration:</strong> ${contractorInfo.estimatedDuration || '2-3 hours'}</p>
				<p><em>✅ Contractor has been automatically notified via email</em></p>
			</div>
			` : `
			<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
				<h3>⚠️ MANUAL ASSIGNMENT NEEDED:</h3>
				<p>No contractor was automatically assigned. Please assign manually.</p>
			</div>
			`}
			
			<div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
				<h3 style="margin-top: 0; color: #1d4ed8;">📋 Booking Details</h3>
				<p><strong>Service:</strong> ${payload.serviceName}</p>
				<p><strong>Add-ons:</strong> ${addonsList}</p>
				<p><strong>Total Paid:</strong> ${total}</p>
				<p><strong>Date:</strong> ${payload.date}</p>
				<p><strong>Time:</strong> ${payload.time}</p>
				${payload.sessionId ? `<p><strong>Payment Session:</strong> ${payload.sessionId}</p>` : ""}
			</div>
			
			<div style="background: #fef7cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
				<h3 style="margin-top: 0; color: #92400e;">👤 Customer Information</h3>
				<p><strong>Name:</strong> ${payload.customerName}</p>
				<p><strong>Email:</strong> ${payload.customerEmail}</p>
				<p><strong>Phone:</strong> ${payload.phone}</p>
				<p><strong>Address:</strong> ${payload.address}</p>
				<p><strong>Special Instructions:</strong> ${payload.address}</p>
			</div>
			
			<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
				<h3 style="margin-top: 0; color: #15803d;">📋 Your Action Items</h3>
				<ol style="color: #166534;">
					${contractorInfo ? 
						`<li><strong>Contractor notified</strong> - ${contractorInfo.contractorName} has been emailed</li>
						 <li><strong>Monitor progress</strong> - Follow up with contractor if needed</li>
						 <li><strong>Customer contact</strong> - Confirm final scheduling with customer</li>` :
						`<li><strong>Assign contractor manually</strong> - No automatic assignment made</li>
						 <li><strong>Contact customer</strong> - Confirm scheduling details</li>
						 <li><strong>Send contractor details</strong> - Once assigned</li>`
					}
					<li><strong>Quality check</strong> - Ensure service meets TidyMate standards</li>
				</ol>
			</div>
			
			<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/>
			<p style="text-align: center; color: #6b7280;">
				<strong>📊 Booking tracked in Google Sheets</strong><br/>
				All details automatically recorded for your records
			</p>
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
	const subject = `Your TidyMate Booking is Confirmed - ${payload.serviceName}`
	const addonsList = payload.addons && payload.addons.length > 0 ? payload.addons.join(", ") : "None"
	const total = payload.totalAmountCents && payload.currency
		? `${(payload.totalAmountCents / 100).toFixed(2)} ${payload.currency.toUpperCase()}`
		: "(total shown in receipt)"
	
	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #2563eb;">🎉 Booking Confirmed - Thank you, ${payload.customerName}!</h2>
			<p>Your cleaning service has been booked and payment processed successfully!</p>
			
			<div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
				<h3 style="margin-top: 0; color: #1d4ed8;">📋 Your Booking Details</h3>
				<p><strong>Service:</strong> ${payload.serviceName}</p>
				<p><strong>Add-ons:</strong> ${addonsList}</p>
				<p><strong>Total Paid:</strong> ${total}</p>
				<p><strong>Requested Date:</strong> ${payload.date}</p>
				<p><strong>Preferred Time:</strong> ${payload.time}</p>
				<p><strong>Service Address:</strong> ${payload.address}</p>
				${payload.sessionId ? `<p><strong>Booking Reference:</strong> ${payload.sessionId}</p>` : ""}
			</div>
			
			<div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
				<h3 style="color: #1e40af;">📅 What Happens Next:</h3>
				<ol style="color: #374151;">
					<li><strong>We'll contact you within 2 hours</strong> to confirm the exact time slot</li>
					<li><strong>Our professional cleaner will arrive</strong> at your scheduled time</li>
					<li><strong>Enjoy your spotless space!</strong></li>
				</ol>
			</div>
			
			<div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981;">
				<h4 style="margin-top: 0; color: #065f46;">🔒 Payment Confirmation</h4>
				<p style="color: #047857;">✅ Your payment has been securely processed</p>
				<p style="color: #047857;">✅ Booking is confirmed and scheduled</p>
			</div>
			
			<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
				<h4 style="margin-top: 0; color: #92400e;">📞 Important Reminders</h4>
				<ul style="color: #78350f;">
					<li><strong>Cancellation Policy:</strong> No refunds after booking. Cancellations within 24 hours result in payment forfeiture.</li>
					<li><strong>Access:</strong> Please ensure someone is available to provide access to the property</li>
					<li><strong>Contact:</strong> Call or email us immediately if you need to make changes</li>
				</ul>
			</div>
			
			<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/>
			<p style="text-align: center; color: #6b7280;">
				<strong>Questions or concerns?</strong><br/>
				Email: <a href="mailto:services@tidymate.ca" style="color: #2563eb;">services@tidymate.ca</a><br/>
				We're here to help ensure your cleaning experience is perfect!
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
	const subject = `New Job Assignment - ${bookingDetails.service} on ${bookingDetails.date}`
	
	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #dc2626;">🔧 New Job Assignment - ${contractorName}</h2>
			<p>You have been assigned a new cleaning job. Please review the details below:</p>
			
			<div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
				<h3 style="margin-top: 0; color: #991b1b;">📋 Job Details</h3>
				<p><strong>Service:</strong> ${bookingDetails.service}</p>
				<p><strong>Add-ons:</strong> ${bookingDetails.addons || "None"}</p>
				<p><strong>Estimated Duration:</strong> ${bookingDetails.estimatedDuration || "2-3 hours"}</p>
				<p><strong>Date:</strong> ${bookingDetails.date}</p>
				<p><strong>Time:</strong> ${bookingDetails.time}</p>
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
					<li><strong>Contact customer</strong> to confirm exact arrival time</li>
					<li><strong>Arrive punctually</strong> with all necessary equipment</li>
					<li><strong>Complete service</strong> according to TidyMate standards</li>
					<li><strong>Send completion confirmation</strong> to services@tidymate.ca</li>
				</ol>
			</div>
			
			<hr style="margin: 30px 0; border: 1px solid #e5e7eb;"/>
			<p style="text-align: center; color: #6b7280;">
				<strong>Questions about this assignment?</strong><br/>
				Contact: <a href="mailto:services@tidymate.ca" style="color: #2563eb;">services@tidymate.ca</a><br/>
				<strong>Payment:</strong> You'll be paid according to your contractor agreement
			</p>
		</div>
	`
	
	await resend.emails.send({ from: fromEmail, to: contractorEmail, subject, html })
	return { success: true }
}