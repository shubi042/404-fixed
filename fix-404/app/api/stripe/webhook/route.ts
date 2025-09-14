import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"
import { sendOwnerBookingEmail, sendCustomerBookingEmail, sendContractorBookingEmail } from "@/lib/email"

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

			// Simple contractor assignment (using fallback contractors)
			const contractors = [
				{ name: "Maria Santos", email: "maria@tidymate.ca", phone: "(416) 555-0101", specialties: ["airbnb", "residential"] },
				{ name: "David Chen", email: "david@tidymate.ca", phone: "(416) 555-0102", specialties: ["post-construction", "commercial"] },
				{ name: "Sarah Johnson", email: "sarah@tidymate.ca", phone: "(416) 555-0103", specialties: ["airbnb", "residential"] },
				{ name: "Ahmed Hassan", email: "ahmed@tidymate.ca", phone: "(416) 555-0104", specialties: ["post-construction", "commercial"] }
			]

			// Simple assignment logic
			let assignedContractor = contractors[0] // Default to Maria Santos
			if (ownerPayload.serviceName.toLowerCase().includes("post-construction")) {
				assignedContractor = contractors[1] // David Chen for post-construction
			}

			const contractorAssignment = {
				contractorName: assignedContractor.name,
				contractorEmail: assignedContractor.email,
				contractorPhone: assignedContractor.phone,
				estimatedDuration: 3
			}

			// Send emails to all parties
			await sendOwnerBookingEmail(ownerPayload, contractorAssignment)
			
			if (ownerPayload.customerEmail && ownerPayload.customerEmail !== "unknown@example.com") {
				await sendCustomerBookingEmail(ownerPayload, ownerPayload.customerEmail)
			}

			// Send email to assigned contractor
			await sendContractorBookingEmail(assignedContractor.email, assignedContractor.name, {
				service: ownerPayload.serviceName,
				addons: ownerPayload.addons.join(", "),
				estimatedDuration: "3 hours",
				date: ownerPayload.date,
				time: ownerPayload.time,
				address: ownerPayload.address,
				instructions: metadata.instructions || "",
				customerName: ownerPayload.customerName,
				phone: ownerPayload.phone,
				customerEmail: ownerPayload.customerEmail
			})

			sendOwnerViaFunction(ownerPayload)

			console.log("✅ Booking processed and emails sent to all parties")
			console.log(`✅ Contractor assigned: ${assignedContractor.name}`)

		} catch (err) {
			console.error("Error handling checkout.session.completed:", err)
		}
	}

	return NextResponse.json({ received: true })
}