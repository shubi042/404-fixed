import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY
		if (!stripeSecretKey) {
			return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 })
		}

		const stripe = new Stripe(stripeSecretKey, {
			apiVersion: "2024-06-20",
		})

		const { amount, currency, service, addons, customerInfo } = await request.json()

		// Clean all strings to remove ANY characters that could cause validation issues
		const cleanString = (str: string) => {
			if (!str) return ""
			return str.replace(/[^\w\s]/g, "").trim().substring(0, 100)
		}

		const cleanPhone = (phone: string) => {
			if (!phone) return ""
			return phone.replace(/\D/g, "").substring(0, 15)
		}

		// Prepare metadata and safe values for Stripe Checkout Session
		const baseUrl = process.env.PUBLIC_BASE_URL || "https://tidymate.ca"
		const addonNamesCsv = Array.isArray(addons)
			? addons.map((addon: any) => cleanString(addon?.name || "")).filter(Boolean).join(", ")
			: ""

		const customerName = cleanString(`${customerInfo.firstName} ${customerInfo.lastName}`)
		const customerEmail = String(customerInfo.email || "").trim()
		const address = cleanString(String(customerInfo.address || ""))
		const preferredDate = cleanString(String(customerInfo.date || ""))
		const preferredTime = cleanString(String(customerInfo.time || ""))
		const instructions = cleanString(String(customerInfo.instructions || ""))

		// Create Stripe Checkout Session with absolutely clean data
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: currency,
						product_data: {
							name: cleanString(service.name),
							description: "Professional cleaning service",
						},
						unit_amount: service.price * 100,
					},
					quantity: 1,
				},
				...addons.map((addon: any) => ({
					price_data: {
						currency: currency,
						product_data: {
							name: cleanString(addon.name),
							description: "Add-on service",
						},
						unit_amount: addon.price * 100,
					},
					quantity: 1,
				})),
			],
			mode: "payment",
			success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${baseUrl}/booking`,
			customer_email: customerInfo.email,
			metadata: {
				// Standardized fields consumed by webhook and notification APIs
				customerName,
				customerEmail,
				phone: cleanPhone(customerInfo.phone),
				address,
				date: preferredDate,
				time: preferredTime,
				instructions,
				service: cleanString(service.name),
				addons: addonNamesCsv,
			},
			payment_intent_data: {
				metadata: {
					customerName,
					customerEmail,
					phone: cleanPhone(customerInfo.phone),
					address,
					date: preferredDate,
					time: preferredTime,
					instructions,
					service: cleanString(service.name),
					addons: addonNamesCsv,
				},
			},
		})

		return NextResponse.json({ sessionId: session.id })
	} catch (error: any) {
		console.error("Error creating payment intent:", error)
		return NextResponse.json({ error: error?.message || "Failed to create payment intent" }, { status: 500 })
	}
}