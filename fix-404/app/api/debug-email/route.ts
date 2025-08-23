import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		// Environment variable check
		const config = {
			hasResendKey: !!process.env.RESEND_API_KEY,
			resendKeyPreview: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : "NOT SET",
			contactEmail: process.env.CONTACT_TO_EMAIL || "services@tidymate.ca",
			fromEmail: process.env.FROM_EMAIL || "onboarding@resend.dev",
			ownerEmail: process.env.OWNER_NOTIFICATION_EMAIL || "services@tidymate.ca"
		}

		console.log("🔍 Email Debug Configuration:", config)

		if (!process.env.RESEND_API_KEY) {
			return NextResponse.json({
				success: false,
				error: "RESEND_API_KEY not configured",
				config,
				solution: "Add RESEND_API_KEY to your Netlify environment variables"
			})
		}

		// Test Resend connection
		const resend = new Resend(process.env.RESEND_API_KEY)
		
		const testEmailData = {
			from: config.fromEmail,
			to: config.contactEmail,
			subject: `🧪 TidyMate Email Debug Test - ${new Date().toISOString()}`,
			html: `
				<h2>🧪 Email Debug Test</h2>
				<p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
				<p><strong>From:</strong> ${config.fromEmail}</p>
				<p><strong>To:</strong> ${config.contactEmail}</p>
				<p><strong>Status:</strong> ✅ Email system is working!</p>
				
				<h3>Configuration Used:</h3>
				<ul>
					<li><strong>API Key:</strong> ${config.resendKeyPreview}</li>
					<li><strong>From Email:</strong> ${config.fromEmail}</li>
					<li><strong>Contact Email:</strong> ${config.contactEmail}</li>
				</ul>
				
				<p><em>If you receive this email, your email system is configured correctly!</em></p>
			`
		}

		console.log("📧 Sending debug email with data:", testEmailData)

		const result = await resend.emails.send(testEmailData)
		
		console.log("✅ Debug email sent successfully:", result)

		return NextResponse.json({
			success: true,
			message: "Debug email sent successfully!",
			config,
			resendResult: result,
			instructions: [
				"1. Check your email inbox: " + config.contactEmail,
				"2. Check spam/junk folder",
				"3. If no email received, there may be a domain/DNS issue",
				"4. Check Resend dashboard for delivery logs"
			]
		})

	} catch (error: any) {
		console.error("❌ Debug email failed:", error)
		
		return NextResponse.json({
			success: false,
			error: error.message,
			details: error.stack,
			config: {
				hasResendKey: !!process.env.RESEND_API_KEY,
				resendKeyPreview: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : "NOT SET",
				contactEmail: process.env.CONTACT_TO_EMAIL || "services@tidymate.ca",
				fromEmail: process.env.FROM_EMAIL || "onboarding@resend.dev"
			},
			solutions: [
				"Check if RESEND_API_KEY is valid",
				"Verify FROM_EMAIL domain is verified in Resend", 
				"Check if TO_EMAIL exists and can receive emails",
				"Review Resend dashboard for API limits or issues"
			]
		}, { status: 500 })
	}
}