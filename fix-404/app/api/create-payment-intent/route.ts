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

		const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
		const { amount, currency, service, addons, customerInfo } = await request.json()

		const clean = (str: string, max = 500) =>
			(str ?? "").replace(/[<>"]/g, "").trim().substring(0, max)

		const cleanPhone = (phone: string) =>
			(phone ?? "").replace(/\D/g, "").substring(0, 15)

		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tidymate.ca"

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency,
						product_data: {
							name: clean(service.name),
							description: "Professional cleaning service by TidyMate",
						},
						unit_amount: service.price * 100,
					},
					quantity: 1,
				},
				...addons.map((addon: any) => ({
					price_data: {
						currency,
						product_data: {
							name: clean(addon.name),
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
				customerName: clean(`${customerInfo.firstName} ${customerInfo.lastName}`),
				customerEmail: clean(customerInfo.email),
				phone: cleanPhone(customerInfo.phone),
				address: clean(customerInfo.address),
				date: clean(customerInfo.date),
				time: clean(customerInfo.time),
				instructions: clean(customerInfo.instructions),
				service: clean(service.name),
				addons: addons.map((a: any) => clean(a.name)).join(", "),
			},
		})

		// Return both sessionId and url — client uses url for direct redirect
		return NextResponse.json({ sessionId: session.id, url: session.url })
	} catch (error: any) {
		console.error("Error creating checkout session:", error)
		return NextResponse.json({ error: error?.message || "Failed to create checkout session" }, { status: 500 })
	}
}