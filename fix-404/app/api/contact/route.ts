import { type NextRequest, NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		const { name, email, subject, message } = await request.json()
		if (!name || !email || !message) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
		}
		await sendContactEmail({ name, email, subject, message })
		return NextResponse.json({ ok: true })
	} catch (error: any) {
		console.error("Contact API error:", error)
		return NextResponse.json({ error: error?.message || "Failed to send message" }, { status: 500 })
	}
}