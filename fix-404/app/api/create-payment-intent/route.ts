import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

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

		// Create Stripe Checkout Session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: currency,
						product_data: {
							name: service.name,
							description: `${service.cleaners} • Professional Equipment Included`,
						},
						unit_amount: service.price * 100, // Convert to cents
					},
					quantity: 1,
				},
				...addons.map((addon: any) => ({
					price_data: {
						currency: currency,
						product_data: {
							name: addon.name,
							description: "Add-on service",
						},
						unit_amount: addon.price * 100,
					},
					quantity: 1,
				})),
			],
			mode: "payment",
			success_url: `${request.headers.get("origin")}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${request.headers.get("origin")}/booking`,
			customer_email: customerInfo.email,
			metadata: {
				customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
				phone: customerInfo.phone,
				address: customerInfo.address,
				date: customerInfo.date,
				time: customerInfo.time,
				instructions: customerInfo.instructions || "",
				service: service.name,
				addons: addons.map((a: any) => a.name).join(", "),
			},
		})

		return NextResponse.json({ sessionId: session.id })
	} catch (error: any) {
		console.error("Error creating payment intent:", error)
		return NextResponse.json({ error: error?.message || "Failed to create payment intent" }, { status: 500 })
	}
}
