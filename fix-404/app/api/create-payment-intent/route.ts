import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Helper function to sanitize strings for Stripe metadata
function sanitizeForStripe(value: string, maxLength: number = 500): string {
	if (!value) return ""
	
	// Remove any characters that might cause validation issues
	// Stripe metadata allows: alphanumeric, spaces, and common punctuation
	const cleaned = value
		.replace(/[^\w\s\-.,!?@#$%&*()+=[\]{}|\\:";'<>?/~`]/g, '') // Remove special chars
		.replace(/\s+/g, ' ') // Normalize whitespace
		.trim()
		.substring(0, maxLength)
	
	return cleaned
}

// Helper function to validate and format URLs
function getValidUrl(origin: string | null, path: string): string {
	if (!origin) {
		// Fallback to a default domain if origin is missing
		return `https://tidymate.ca${path}`
	}
	
	// Ensure the URL is properly formatted
	try {
		const url = new URL(path, origin)
		return url.toString()
	} catch (error) {
		// If URL construction fails, use fallback
		return `https://tidymate.ca${path}`
	}
}

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

		// Validate required fields
		if (!service || !customerInfo) {
			return NextResponse.json({ error: "Missing required service or customer information" }, { status: 400 })
		}

		// Sanitize and validate customer info
		const sanitizedCustomerInfo = {
			firstName: sanitizeForStripe(customerInfo.firstName || "", 50),
			lastName: sanitizeForStripe(customerInfo.lastName || "", 50),
			email: (customerInfo.email || "").trim().toLowerCase(),
			phone: (customerInfo.phone || "").replace(/\D/g, ""), // Only digits
			address: sanitizeForStripe(customerInfo.address || "", 200),
			date: sanitizeForStripe(customerInfo.date || "", 20),
			time: sanitizeForStripe(customerInfo.time || "", 20),
			instructions: sanitizeForStripe(customerInfo.instructions || "", 300)
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(sanitizedCustomerInfo.email)) {
			return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
		}

		// Validate phone (must be at least 10 digits)
		if (sanitizedCustomerInfo.phone.length < 10) {
			return NextResponse.json({ error: "Phone number must be at least 10 digits" }, { status: 400 })
		}

		// Get origin and construct URLs safely
		const origin = request.headers.get("origin")
		const successUrl = getValidUrl(origin, "/booking/success?session_id={CHECKOUT_SESSION_ID}")
		const cancelUrl = getValidUrl(origin, "/booking")

		// Sanitize service and addon data
		const sanitizedService = {
			name: sanitizeForStripe(service.name || "Cleaning Service", 100),
			cleaners: sanitizeForStripe(service.cleaners || "Professional Team", 50),
			price: Math.round(Number(service.price) || 0)
		}

		const sanitizedAddons = (addons || []).map((addon: any) => ({
			name: sanitizeForStripe(addon.name || "Add-on Service", 100),
			price: Math.round(Number(addon.price) || 0)
		}))

		// Create Stripe Checkout Session with sanitized data
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: currency || "cad",
						product_data: {
							name: sanitizedService.name,
							description: `${sanitizedService.cleaners} - Professional Equipment Included`,
						},
						unit_amount: sanitizedService.price * 100, // Convert to cents
					},
					quantity: 1,
				},
				...sanitizedAddons.map((addon: any) => ({
					price_data: {
						currency: currency || "cad",
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
			success_url: successUrl,
			cancel_url: cancelUrl,
			customer_email: sanitizedCustomerInfo.email,
			metadata: {
				customerName: `${sanitizedCustomerInfo.firstName} ${sanitizedCustomerInfo.lastName}`.substring(0, 490),
				phone: sanitizedCustomerInfo.phone.substring(0, 15), // Max 15 digits for international
				address: sanitizedCustomerInfo.address.substring(0, 490),
				date: sanitizedCustomerInfo.date,
				time: sanitizedCustomerInfo.time,
				instructions: sanitizedCustomerInfo.instructions,
				service: sanitizedService.name,
				addons: sanitizedAddons.map((a: any) => a.name).join(", ").substring(0, 490),
			},
		})

		return NextResponse.json({ sessionId: session.id })
	} catch (error: any) {
		console.error("Error creating payment intent:", error)
		
		// Log detailed error information for debugging
		console.error("Error details:", {
			message: error.message,
			type: error.type,
			code: error.code,
			param: error.param,
			stack: error.stack
		})
		
		// Return more specific error messages
		let errorMessage = "Failed to create payment intent"
		if (error.message && error.message.includes("pattern")) {
			errorMessage = "Invalid data format. Please check your input and try again."
		} else if (error.type === "StripeInvalidRequestError") {
			errorMessage = "Invalid request to payment processor. Please try again."
		}
		
		return NextResponse.json({ error: errorMessage }, { status: 500 })
	}
}
