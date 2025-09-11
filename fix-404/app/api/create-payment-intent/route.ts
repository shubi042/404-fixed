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

		// ULTRA MINIMAL - only what Stripe absolutely requires
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "cad",
						product_data: {
							name: "Cleaning Service"
						},
						unit_amount: amount,
					},
					quantity: 1,
				}
			],
			mode: "payment",
			success_url: "https://tidymate.ca/booking/success",
			cancel_url: "https://tidymate.ca/booking"
		})

		return NextResponse.json({ sessionId: session.id })
	} catch (error: any) {
		console.error("Stripe error:", error)
		return NextResponse.json({ error: "Payment setup failed" }, { status: 500 })
	}
}