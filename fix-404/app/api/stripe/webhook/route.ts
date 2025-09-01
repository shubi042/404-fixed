import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"
import { sendOwnerBookingEmail, sendCustomerBookingEmail, sendSubcontractorNotificationEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function addBookingToGoogleSheets(bookingData: any) {
	try {
		const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
		const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings"
		
		if (!SPREADSHEET_ID || !process.env.GOOGLE_SHEETS_CREDENTIALS) {
			console.log("❌ Google Sheets not configured")
			return
		}
		
		console.log("📊 Adding booking to Google Sheets via REST API...")
		
		const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
		
		// Get access token
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				assertion: await createJWT(credentials)
			})
		})
		
		const tokenData = await tokenResponse.json()
		
		if (!tokenData.access_token) {
			throw new Error('Failed to get access token')
		}
		
		// Prepare booking row
		const values = [[
			new Date().toISOString(),
			bookingData.customerName,
			bookingData.serviceName,
			bookingData.date,
			bookingData.time,
			"", // Formula will fill
			"", // Formula will fill
			""  // Formula will fill
		]]
		
		// Add to sheet
		const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`
		
		const appendResponse = await fetch(appendUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${tokenData.access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ values })
		})
		
		const appendData = await appendResponse.json()
		
		if (appendData.updates) {
			const rowNumber = parseInt(appendData.updates.updatedRange.split(':')[1].replace(/[^\d]/g, ''))
			console.log(`✅ Booking added to row ${rowNumber}`)
			
			// Wait for formulas
			await new Promise(resolve => setTimeout(resolve, 4000))
			
			// Read subcontractor assignment
			const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!F${rowNumber}:G${rowNumber}`
			
			const readResponse = await fetch(readUrl, {
				headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
			})
			
			const readData = await readResponse.json()
			const subcontractorData = readData.values?.[0]
			
			if (subcontractorData && subcontractorData[0] && subcontractorData[1]) {
				console.log(`🎯 Subcontractor assigned: ${subcontractorData[0]}`)
				
				// Send subcontractor email
				await sendSubcontractorNotificationEmail({
					customerName: bookingData.customerName,
					customerEmail: bookingData.customerEmail,
					phone: bookingData.phone,
					address: bookingData.address,
					date: bookingData.date,
					time: bookingData.time,
					serviceName: bookingData.serviceName,
					addons: Array.isArray(bookingData.addons) ? bookingData.addons : [bookingData.addons],
					totalAmount: bookingData.totalAmount,
					currency: bookingData.currency,
					sessionId: bookingData.sessionId,
					instructions: bookingData.instructions
				}, {
					name: subcontractorData[0],
					email: subcontractorData[1],
					phone: "",
					specialties: []
				})
				
				console.log(`📧 Subcontractor notification sent to ${subcontractorData[1]}`)
			}
		}
		
	} catch (error) {
		console.error("Google Sheets REST API error:", error)
	}
}

async function createJWT(credentials: any) {
	const crypto = await import('crypto')
	
	const header = { alg: 'RS256', typ: 'JWT' }
	const now = Math.floor(Date.now() / 1000)
	const payload = {
		iss: credentials.client_email,
		scope: 'https://www.googleapis.com/auth/spreadsheets',
		aud: 'https://oauth2.googleapis.com/token',
		exp: now + 3600,
		iat: now
	}
	
	const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
	const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
	const signatureInput = `${headerB64}.${payloadB64}`
	
	const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), credentials.private_key)
	const signatureB64 = signature.toString('base64url')
	
	return `${headerB64}.${payloadB64}.${signatureB64}`
}

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

			// Send owner notification
			await sendOwnerBookingEmail(ownerPayload)
			
			// Send customer confirmation
			if (ownerPayload.customerEmail && ownerPayload.customerEmail !== "unknown@example.com") {
				await sendCustomerBookingEmail(ownerPayload, ownerPayload.customerEmail)
			}
			
			// Add to Google Sheets using direct REST API
			try {
				await addBookingToGoogleSheets({
					customerName: ownerPayload.customerName,
					customerEmail: ownerPayload.customerEmail,
					phone: ownerPayload.phone,
					address: ownerPayload.address,
					date: ownerPayload.date,
					time: ownerPayload.time,
					serviceName: ownerPayload.serviceName,
					addons: ownerPayload.addons,
					totalAmount: ownerPayload.totalAmountCents ? ownerPayload.totalAmountCents / 100 : 0,
					currency: ownerPayload.currency || "CAD",
					sessionId: ownerPayload.sessionId,
					instructions: metadata.instructions || "",
				})
				console.log("📊 Google Sheets integration completed")
			} catch (sheetsError) {
				console.error("Google Sheets integration error:", sheetsError)
				// Don't fail the whole webhook if sheets integration fails
			}
			
			// Fallback email method
			sendOwnerViaFunction(ownerPayload)
		} catch (err) {
			console.error("Error handling checkout.session.completed:", err)
		}
	}

	return NextResponse.json({ received: true })
}