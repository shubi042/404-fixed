import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.FROM_EMAIL || "noreply@tidymate.ca"
const calendlyConfirmationUrl = process.env.CALENDLY_CONFIRMATION_URL || "https://calendly.com/services-tidymate/booking-confirmation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		const { customerEmail, customerName, serviceName, bookingDate, bookingTime } = await request.json()
		
		if (!customerEmail || !customerName) {
			return NextResponse.json({ error: "Customer email and name required" }, { status: 400 })
		}

		if (!resendApiKey) {
			return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
		}

		const resend = new Resend(resendApiKey)
		const subject = `📅 Choose Your Cleaning Time Slot - ${serviceName || 'TidyMate Service'}`
		
		const html = `
			<h2>Hi ${customerName}! 👋</h2>
			<p>Thank you for your booking! Now it's time to choose your exact time slot.</p>
			
			<div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
				<h3>🗓️ Click Below to Choose Your Time</h3>
				<p style="margin: 15px 0;">Select the exact time that works best for you:</p>
				<a href="${calendlyConfirmationUrl}" 
				   style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
					📅 BOOK YOUR TIME SLOT
				</a>
			</div>
			
			<h3>Your Booking Details:</h3>
			<ul>
				<li><strong>Service:</strong> ${serviceName || 'Professional Cleaning'}</li>
				<li><strong>Requested Date:</strong> ${bookingDate || 'As discussed'}</li>
				<li><strong>Requested Time:</strong> ${bookingTime || 'As discussed'}</li>
			</ul>
			
			<p><strong>What happens next:</strong></p>
			<ol>
				<li>Click the button above to access our calendar</li>
				<li>Choose your preferred time slot</li>
				<li>Receive final confirmation from our team</li>
				<li>Enjoy your professional cleaning service!</li>
			</ol>
			
			<div style="background: #e6f7e6; padding: 15px; border-radius: 8px; margin-top: 20px;">
				<p><strong>✅ Your payment is already confirmed!</strong></p>
				<p>This is just to select your preferred time slot.</p>
			</div>
			
			<p style="margin-top: 20px;"><em>Questions? Reply to this email or contact us at services@tidymate.ca</em></p>
		`

		await resend.emails.send({
			from: fromEmail,
			to: customerEmail,
			subject,
			html,
		})

		return NextResponse.json({ success: true, message: "Calendly link sent successfully" })
	} catch (error: any) {
		console.error("Send Calendly link error:", error)
		return NextResponse.json({ error: error?.message || "Failed to send Calendly link" }, { status: 500 })
	}
}