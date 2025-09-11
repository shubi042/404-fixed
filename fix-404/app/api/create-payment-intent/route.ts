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

		const { amount, currency, service, customerInfo } = await request.json()

		// Create minimal Stripe Checkout Session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: currency || "cad",
						product_data: {
							name: service.name,
							description: "Professional cleaning service",
						},
						unit_amount: amount,
					},
					quantity: 1,
				}
			],
			mode: "payment",
			success_url: `https://tidymate.ca/booking/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `https://tidymate.ca/booking`,
			customer_email: customerInfo.email,
			metadata: {
				customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
				phone: customerInfo.phone,
				address: customerInfo.address,
				service: service.name,
			},
		})

		return NextResponse.json({ sessionId: session.id })
	} catch (error: any) {
		console.error("Error creating payment intent:", error)
		return NextResponse.json({ error: error?.message || "Failed to create payment intent" }, { status: 500 })
	}
}