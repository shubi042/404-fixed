import { type NextRequest, NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const normalize = (value?: string) => (value || "").trim()
const normalizeEmail = (value?: string) =>
	normalize(value)
		.replace(/[\u200B-\u200D\uFEFF]/g, "")
		.toLowerCase()

export async function POST(request: NextRequest) {
	try {
		const { name, email, subject, message } = await request.json()
		const normalizedEmail = normalizeEmail(email)

		if (!normalize(name) || !normalizedEmail || !normalize(message)) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
		}

		if (!emailRegex.test(normalizedEmail)) {
			return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 })
		}

		await sendContactEmail({ name: normalize(name), email: normalizedEmail, subject: normalize(subject), message: normalize(message) })
		return NextResponse.json({ ok: true })
	} catch (error: any) {
		console.error("Contact API error:", error)
		return NextResponse.json({ error: error?.message || "Failed to send message" }, { status: 500 })
	}
}