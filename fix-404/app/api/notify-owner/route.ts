import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { sendOwnerBookingEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY
		if (!stripeSecretKey) {
			return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 })
		}

		const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })

		let sessionId: string | null = null
		const { searchParams } = new URL(request.url)
		sessionId = searchParams.get("session_id")
		if (!sessionId) {
			try {
				const body = await request.json()
				sessionId = body?.sessionId || body?.session_id || null
			} catch (_) {}
		}

		if (!sessionId) {
			return NextResponse.json({ error: "Session ID required" }, { status: 400 })
		}

		const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items", "customer"] })
		if (session.payment_status !== "paid") {
			return NextResponse.json({ skipped: true, reason: "Session not paid" }, { status: 200 })
		}

		const metadata = session.metadata || {}
		const addons = (metadata.addons ? String(metadata.addons) : "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)

		await sendOwnerBookingEmail({
			customerName: String(metadata.customerName || "Unknown"),
			customerEmail: String(session.customer_email || metadata.customerEmail || "unknown@example.com"),
			phone: String(metadata.phone || ""),
			address: String(metadata.address || ""),
			date: String(metadata.date || ""),
			time: String(metadata.time || ""),
			serviceName: String(metadata.service || session?.line_items?.data?.[0]?.description || "Cleaning Service"),
			addons,
			totalAmountCents: typeof session.amount_total === "number" ? session.amount_total : undefined,
			currency: session.currency || undefined,
		})

		return NextResponse.json({ ok: true })
	} catch (error: any) {
		console.error("Notify owner error:", error)
		return NextResponse.json({ error: error?.message || "Failed to notify owner" }, { status: 500 })
	}
}