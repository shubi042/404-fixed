import { type NextRequest, NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		const testPayload = {
			name: "Test User",
			email: "test@example.com",
			subject: "Email Configuration Test",
			message: "This is a test message to verify email configuration is working properly. If you receive this, your contact form email setup is functioning correctly!"
		}

		console.log("Testing email with payload:", testPayload)
		console.log("Environment check:")
		console.log("- RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY)
		console.log("- CONTACT_TO_EMAIL:", process.env.CONTACT_TO_EMAIL || "services@tidymate.ca")
		console.log("- FROM_EMAIL:", process.env.FROM_EMAIL || "noreply@tidymate.ca")

		const result = await sendContactEmail(testPayload)
		
		return NextResponse.json({ 
			success: true, 
			result,
			config: {
				hasResendKey: !!process.env.RESEND_API_KEY,
				contactEmail: process.env.CONTACT_TO_EMAIL || "services@tidymate.ca",
				fromEmail: process.env.FROM_EMAIL || "noreply@tidymate.ca"
			}
		})
	} catch (error: any) {
		console.error("Test email error:", error)
		return NextResponse.json({ 
			error: error?.message || "Test email failed",
			details: error?.stack || "No stack trace available"
		}, { status: 500 })
	}
}