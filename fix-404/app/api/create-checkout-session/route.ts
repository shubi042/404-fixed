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

		const { service, addons = [], customerInfo } = await request.json()

		if (!service || !customerInfo) {
			return NextResponse.json({ error: "Missing service or customer info" }, { status: 400 })
		}

		const cleanString = (str: string, maxLength = 100) => {
			if (!str) return ""
			return str.replace(/[^\w\s\-,.]/g, "").trim().substring(0, maxLength)
		}

		const cleanPhone = (phone: string) => {
			if (!phone) return ""
			return phone.replace(/\D/g, "").substring(0, 15)
		}

		const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
			{
				price_data: {
					currency: "cad",
					product_data: {
						name: cleanString(service.name),
						description: cleanString(service.category || "Professional cleaning service"),
					},
					unit_amount: Number(service.price) * 100,
				},
				quantity: 1,
			},
			...addons
				.map((addon: any) => {
					if (!addon?.name || typeof addon.price !== "number") {
						return null
					}

					return {
						price_data: {
							currency: "cad",
							product_data: {
								name: cleanString(addon.name),
								description: "Add-on service",
							},
							unit_amount: addon.price * 100,
						},
						quantity: 1,
					} satisfies Stripe.Checkout.SessionCreateParams.LineItem
				})
				.filter(Boolean) as Stripe.Checkout.SessionCreateParams.LineItem[],
		]

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items: lineItems,
			success_url: "https://tidymate.ca/booking/success?session_id={CHECKOUT_SESSION_ID}",
			cancel_url: "https://tidymate.ca/booking",
			customer_email: cleanString(customerInfo.email, 200),
			metadata: {
				name: cleanString(`${customerInfo.firstName} ${customerInfo.lastName}`, 100),
				phone: cleanPhone(customerInfo.phone),
				service: cleanString(service.name),
			},
		})

		if (!session.url) {
			return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 })
		}

		return NextResponse.json({ id: session.id, url: session.url })
	} catch (error: any) {
		console.error("Error creating checkout session:", error)
		return NextResponse.json(
			{ error: error?.message || "Failed to create checkout session" },
			{ status: 500 },
		)
	}
}
