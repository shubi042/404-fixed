import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"
import { sendOwnerBookingEmail, sendCustomerBookingEmail } from "@/lib/email"
import { addBookingToSheets, type BookingData } from "@/lib/google-sheets"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function sendOwnerViaFunction(payload: any) {
	try {
		const baseUrl = process.env.PUBLIC_BASE_URL
		if (!baseUrl) return
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
	const stripeSecret = process.env.STRIPE_SECRET_KEY
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

	if (!stripeSecret || !webhookSecret) {
		console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET")
		return NextResponse.json({ received: true }, { status: 200 })
	}

	const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
	const body = await request.text()
	const sig = request.headers.get("stripe-signature")
	if (!sig) {
		return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
	}

	let event: Stripe.Event
	try {
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
	} catch (err: any) {
		console.error("Webhook signature verification failed:", err?.message)
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session
		try {
			const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
				expand: ["line_items", "customer"],
			})

			const metadata = sessionWithLineItems.metadata || {}
			const addons = (metadata.addons ? String(metadata.addons) : "")
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)

			const ownerPayload = {
				customerName: String(metadata.customerName || "Unknown"),
				customerEmail: String(sessionWithLineItems.customer_email || metadata.customerEmail || "unknown@example.com"),
				phone: String(metadata.phone || ""),
				address: String(metadata.address || ""),
				date: String(metadata.date || ""),
				time: String(metadata.time || ""),
				serviceName: String(metadata.service || sessionWithLineItems?.line_items?.data?.[0]?.description || "Cleaning Service"),
				addons,
				totalAmountCents: typeof sessionWithLineItems.amount_total === "number" ? sessionWithLineItems.amount_total : undefined,
				currency: sessionWithLineItems.currency || undefined,
				sessionId: sessionWithLineItems.id,
			}

			await sendOwnerBookingEmail(ownerPayload)
			if (ownerPayload.customerEmail && ownerPayload.customerEmail !== "unknown@example.com") {
				await sendCustomerBookingEmail(ownerPayload, ownerPayload.customerEmail)
			}
			sendOwnerViaFunction(ownerPayload)

			// Add booking to Google Sheets
			const sheetsData: BookingData = {
				timestamp: new Date().toISOString(),
				customerName: ownerPayload.customerName,
				customerEmail: ownerPayload.customerEmail,
				phone: ownerPayload.phone,
				address: ownerPayload.address,
				service: ownerPayload.serviceName,
				addons: ownerPayload.addons.join(", "),
				totalAmount: ownerPayload.totalAmountCents ? `$${(ownerPayload.totalAmountCents / 100).toFixed(2)} ${ownerPayload.currency?.toUpperCase() || 'CAD'}` : 'Unknown',
				date: ownerPayload.date,
				time: ownerPayload.time,
				instructions: metadata.instructions || "",
				sessionId: ownerPayload.sessionId || "",
				paymentStatus: "Completed"
			}

			const sheetsResult = await addBookingToSheets(sheetsData)
			if (sheetsResult.success) {
				console.log("✅ Booking added to Google Sheets")
			} else {
				console.warn("⚠️ Failed to add booking to Google Sheets:", sheetsResult.error)
			}
		} catch (err) {
			console.error("Error handling checkout.session.completed:", err)
		}
	}

	return NextResponse.json({ received: true })
}