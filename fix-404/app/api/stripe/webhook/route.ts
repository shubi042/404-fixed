import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"
import { sendOwnerBookingEmail, sendCustomerBookingEmail, sendContractorBookingEmail } from "@/lib/email"
import { addBookingToSheets } from "@/lib/google-sheets"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function sendOwnerViaFunction(payload: any) {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
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
				expand: ["line_items"],
			})

			const metadata = sessionWithLineItems.metadata || {}

			// All metadata fields are now set by create-payment-intent
			const ownerPayload = {
				customerName: String(metadata.customerName || "Unknown"),
				customerEmail: String(metadata.customerEmail || sessionWithLineItems.customer_email || "unknown@example.com"),
				phone: String(metadata.phone || ""),
				address: String(metadata.address || ""),
				date: String(metadata.date || ""),
				time: String(metadata.time || ""),
				instructions: String(metadata.instructions || ""),
				serviceName: String(metadata.service || sessionWithLineItems?.line_items?.data?.[0]?.description || "Cleaning Service"),
				addons: (metadata.addons || "").split(",").map((s) => s.trim()).filter(Boolean),
				totalAmountCents: typeof sessionWithLineItems.amount_total === "number" ? sessionWithLineItems.amount_total : undefined,
				currency: sessionWithLineItems.currency || undefined,
				sessionId: sessionWithLineItems.id,
			}

			// Contractor list — update these with real contractor emails
			const contractors = [
				{ name: "Contractor 1", email: process.env.CONTRACTOR_1_EMAIL || "services@tidymate.ca", phone: "(416) 555-0001", specialties: ["airbnb", "residential"] },
				{ name: "Contractor 2", email: process.env.CONTRACTOR_2_EMAIL || "services@tidymate.ca", phone: "(416) 555-0002", specialties: ["post-construction", "commercial"] },
				{ name: "Contractor 3", email: process.env.CONTRACTOR_3_EMAIL || "services@tidymate.ca", phone: "(416) 555-0003", specialties: ["airbnb", "residential"] },
				{ name: "Contractor 4", email: process.env.CONTRACTOR_4_EMAIL || "services@tidymate.ca", phone: "(416) 555-0004", specialties: ["post-construction"] },
			]

			const isPostConstruction = ownerPayload.serviceName.toLowerCase().includes("post-construction")
			const assignedContractor = isPostConstruction
				? contractors.find((c) => c.specialties.includes("post-construction")) ?? contractors[1]
				: contractors.find((c) => c.specialties.includes("airbnb") || c.specialties.includes("residential")) ?? contractors[0]

			const contractorAssignment = {
				contractorName: assignedContractor.name,
				contractorEmail: assignedContractor.email,
				contractorPhone: assignedContractor.phone,
				estimatedDuration: isPostConstruction ? "4-6 hours" : "2-3 hours",
			}

			// Send confirmation emails to all parties in parallel
			await Promise.allSettled([
				sendOwnerBookingEmail(ownerPayload, contractorAssignment),
				ownerPayload.customerEmail !== "unknown@example.com"
					? sendCustomerBookingEmail(ownerPayload, ownerPayload.customerEmail)
					: Promise.resolve(),
				sendContractorBookingEmail(assignedContractor.email, assignedContractor.name, {
					service: ownerPayload.serviceName,
					addons: ownerPayload.addons.join(", "),
					estimatedDuration: contractorAssignment.estimatedDuration,
					date: ownerPayload.date,
					time: ownerPayload.time,
					address: ownerPayload.address,
					instructions: ownerPayload.instructions,
					customerName: ownerPayload.customerName,
					phone: ownerPayload.phone,
					customerEmail: ownerPayload.customerEmail,
				}),
			])

			// Log booking to Google Sheets (non-blocking)
			addBookingToSheets({
				timestamp: new Date().toISOString(),
				customerName: ownerPayload.customerName,
				customerEmail: ownerPayload.customerEmail,
				phone: ownerPayload.phone,
				address: ownerPayload.address,
				service: ownerPayload.serviceName,
				addons: ownerPayload.addons.join(", "),
				totalAmount: ownerPayload.totalAmountCents
					? `$${(ownerPayload.totalAmountCents / 100).toFixed(2)} ${ownerPayload.currency?.toUpperCase() || "CAD"}`
					: "Unknown",
				date: ownerPayload.date,
				time: ownerPayload.time,
				instructions: ownerPayload.instructions,
				sessionId: ownerPayload.sessionId || "",
				paymentStatus: "Completed",
				contractorName: assignedContractor.name,
				contractorEmail: assignedContractor.email,
				contractorPhone: assignedContractor.phone,
				estimatedDuration: contractorAssignment.estimatedDuration,
			}).catch((err) => console.error("Google Sheets logging failed:", err))

			sendOwnerViaFunction(ownerPayload)

			console.log(`✅ Booking processed: ${ownerPayload.serviceName} for ${ownerPayload.customerName}`)
			console.log(`✅ Assigned to: ${assignedContractor.name} (${assignedContractor.email})`)
		} catch (err) {
			console.error("Error handling checkout.session.completed:", err)
		}
	}

	return NextResponse.json({ received: true })
}