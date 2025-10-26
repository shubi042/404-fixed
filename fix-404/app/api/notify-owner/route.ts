import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { sendOwnerBookingEmail, sendCustomerBookingEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function sendOwnerViaFunction(baseUrl: string, payload: any) {
	try {
		await fetch(`${baseUrl}/.netlify/functions/send-email`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type: "booking", ...payload }),
		})
	} catch (e) {
		console.error("SMTP fallback send failed:", e)
	}
}

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
    let paymentIntentId: string | null = searchParams.get("payment_intent")
		if (!sessionId) {
			try {
				const body = await request.json()
        sessionId = body?.sessionId || body?.session_id || null
        paymentIntentId = paymentIntentId || body?.payment_intent || body?.paymentIntent || null
			} catch (_) {}
		}

    // If we only have a payment_intent, resolve the latest Checkout Session for it
    if (!sessionId && paymentIntentId) {
      const sessionsList = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
      sessionId = sessionsList.data?.[0]?.id || null
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID or payment_intent required" }, { status: 400 })
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

		const ownerPayload = {
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
			sessionId: session.id,
			instructions: String(metadata.instructions || ""),
		}

		await sendOwnerBookingEmail(ownerPayload)

		// Also send customer confirmation if we have a real email
		if (ownerPayload.customerEmail && ownerPayload.customerEmail !== "unknown@example.com") {
			await sendCustomerBookingEmail({
				customerName: ownerPayload.customerName,
				customerEmail: ownerPayload.customerEmail,
				phone: ownerPayload.phone,
				address: ownerPayload.address,
				date: ownerPayload.date,
				time: ownerPayload.time,
				serviceName: ownerPayload.serviceName,
				addons,
				totalAmountCents: ownerPayload.totalAmountCents,
				currency: ownerPayload.currency,
				sessionId: ownerPayload.sessionId
			}, ownerPayload.customerEmail)
		}

		const origin = request.headers.get("origin") || new URL(request.url).origin
		sendOwnerViaFunction(origin, { type: "booking", ...ownerPayload })

		// SMTP fallback for customer if Resend is not configured
		if (!process.env.RESEND_API_KEY && ownerPayload.customerEmail && ownerPayload.customerEmail !== "unknown@example.com") {
			await sendOwnerViaFunction(origin, { type: "booking", target: "customer", to: ownerPayload.customerEmail, ...ownerPayload })
		}

		return NextResponse.json({ ok: true })
	} catch (error: any) {
		console.error("Notify owner error:", error)
		return NextResponse.json({ error: error?.message || "Failed to notify owner" }, { status: 500 })
	}
}