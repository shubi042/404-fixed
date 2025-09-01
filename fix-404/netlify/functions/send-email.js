const nodemailer = require("nodemailer")
const https = require("https")

async function handleGoogleSheetsBooking(bookingData) {
	try {
		console.log("🔍 Using Google Sheets REST API directly...")
		
		const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
		const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings"
		
		if (!SPREADSHEET_ID || !process.env.GOOGLE_SHEETS_CREDENTIALS) {
			console.log("❌ Google Sheets not configured, skipping...")
			return
		}
		
		const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
		
		// Get OAuth token using service account
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
				assertion: createJWT(credentials)
			})
		})
		
		const tokenData = await tokenResponse.json()
		const accessToken = tokenData.access_token
		
		if (!accessToken) {
			throw new Error('Failed to get access token')
		}
		
		console.log("✅ Got access token")
		
		// Prepare booking data
		const values = [[
			new Date().toISOString(),
			bookingData.customerName || "",
			bookingData.serviceName || "",
			bookingData.date || "",
			bookingData.time || "",
			"", // Formula will fill
			"", // Formula will fill
			""  // Formula will fill
		]]
		
		// Add to Google Sheets using REST API
		const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`
		
		const appendResponse = await fetch(appendUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ values })
		})
		
		const appendData = await appendResponse.json()
		console.log("📊 Append response:", appendData)
		
		if (appendData.updates) {
			const updatedRange = appendData.updates.updatedRange
			const rowNumber = updatedRange ? parseInt(updatedRange.split(':')[1].replace(/[^\d]/g, '')) : 0
			
			console.log(`✅ Booking added to row ${rowNumber}`)
			
			// Wait for formulas
			console.log("⏳ Waiting for formulas...")
			await new Promise(resolve => setTimeout(resolve, 4000))
			
			// Read assignment
			const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!F${rowNumber}:G${rowNumber}`
			
			const readResponse = await fetch(readUrl, {
				headers: { 'Authorization': `Bearer ${accessToken}` }
			})
			
			const readData = await readResponse.json()
			const subcontractorData = readData.values?.[0]
			
			if (subcontractorData && subcontractorData[0] && subcontractorData[1]) {
				console.log(`🎯 Subcontractor assigned: ${subcontractorData[0]}`)
				
				// Send subcontractor email
				await sendSubcontractorEmailSMTP(bookingData, {
					name: subcontractorData[0],
					email: subcontractorData[1]
				})
				console.log("✅ Subcontractor notification sent!")
			}
		}
		
	} catch (error) {
		console.error("Google Sheets integration error:", error)
	}
}

function createJWT(credentials) {
	const header = {
		alg: 'RS256',
		typ: 'JWT'
	}
	
	const now = Math.floor(Date.now() / 1000)
	const payload = {
		iss: credentials.client_email,
		scope: 'https://www.googleapis.com/auth/spreadsheets',
		aud: 'https://oauth2.googleapis.com/token',
		exp: now + 3600,
		iat: now
	}
	
	// Simple JWT creation (for production, use a proper JWT library)
	const crypto = require('crypto')
	const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
	const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
	const signatureInput = `${headerB64}.${payloadB64}`
	
	const privateKey = credentials.private_key
	const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), privateKey)
	const signatureB64 = signature.toString('base64url')
	
	return `${headerB64}.${payloadB64}.${signatureB64}`
}

async function sendSubcontractorEmailSMTP(booking, subcontractor) {
	try {
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "mail.privateemail.com",
			port: Number(process.env.SMTP_PORT || "465"),
			secure: true,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		})
		
		const subject = `🧹 New Job Assignment: ${booking.serviceName} - ${booking.date}`
		const html = `
			<h2>🧹 New Job Assignment</h2>
			<p>Hi ${subcontractor.name},</p>
			<p>You've been assigned a new cleaning job:</p>
			
			<h3>📋 Job Details</h3>
			<p><strong>Service:</strong> ${booking.serviceName}</p>
			<p><strong>Date & Time:</strong> ${booking.date} at ${booking.time}</p>
			<p><strong>Total Value:</strong> $${booking.totalAmount} ${booking.currency}</p>
			
			<h3>👤 Customer Information</h3>
			<p><strong>Name:</strong> ${booking.customerName}</p>
			<p><strong>Email:</strong> ${booking.customerEmail}</p>
			<p><strong>Phone:</strong> ${booking.phone}</p>
			<p><strong>Address:</strong> ${booking.address}</p>
			
			<p><strong>Reference:</strong> ${booking.sessionId}</p>
		`
		
		await transporter.sendMail({
			from: process.env.SMTP_USER,
			to: subcontractor.email,
			subject,
			html,
		})
		
		console.log(`📧 Subcontractor email sent to ${subcontractor.email}`)
	} catch (error) {
		console.error("Failed to send subcontractor email:", error)
	}
}

exports.handler = async function (event) {
	// CORS preflight
	if (event.httpMethod === "OPTIONS") {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
			},
			body: "",
		}
	}

	if (event.httpMethod !== "POST") {
		return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) }
	}

	try {
		const {
			SMTP_HOST = "mail.privateemail.com",
			SMTP_PORT = "465",
			SMTP_SECURE,
			SMTP_USER,
			SMTP_PASS,
			MAIL_TO = process.env.CONTACT_TO_EMAIL || process.env.OWNER_NOTIFICATION_EMAIL || "services@tidymate.ca",
		} = process.env

		if (!SMTP_USER || !SMTP_PASS) {
			return { statusCode: 500, body: JSON.stringify({ error: "SMTP credentials not configured" }) }
		}

		const secure = SMTP_SECURE ? SMTP_SECURE === "true" : Number(SMTP_PORT) === 465
		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: Number(SMTP_PORT),
			secure,
			auth: { user: SMTP_USER, pass: SMTP_PASS },
		})

		const body = JSON.parse(event.body || "{}")
		const type = body.type || "contact"

		let subject = body.subject || ""
		let html = ""
		let to = body.to || MAIL_TO
		const from = SMTP_USER // enforce sender matches mailbox to avoid rejection
		const replyTo = body.email && typeof body.email === "string" ? body.email : undefined

		if (type === "contact") {
			subject = subject || `[Contact] ${body.name || "New Message"}`
			html = `
				<h2>New Contact Form Submission</h2>
				<p><strong>Name:</strong> ${body.name || ""}</p>
				<p><strong>Email:</strong> ${body.email || ""}</p>
				<p><strong>Subject:</strong> ${body.subject || ""}</p>
				<p><strong>Message:</strong><br/>${(body.message || "").replace(/\n/g, "<br/>")}</p>
			`
		} else if (type === "booking") {
			// Handle Google Sheets integration for bookings
			try {
				await handleGoogleSheetsBooking(body)
			} catch (sheetsError) {
				console.error("Google Sheets error:", sheetsError)
			}
			
			subject = subject || `New Booking: ${body.serviceName || "Cleaning Service"} for ${body.customerName || "Customer"}`
			html = `
				<h2>New Booking Received</h2>
				<p><strong>Service:</strong> ${body.serviceName || ""}</p>
				<p><strong>Add-ons:</strong> ${(body.addons || []).join(", ") || "None"}</p>
				<p><strong>Total:</strong> ${body.total || "(see Stripe)"}</p>
				<hr/>
				<p><strong>Customer:</strong> ${body.customerName || ""} (${body.customerEmail || ""})</p>
				<p><strong>Phone:</strong> ${body.phone || ""}</p>
				<p><strong>Address:</strong> ${body.address || ""}</p>
				<p><strong>Preferred Date & Time:</strong> ${body.date || ""} ${body.time ? "at " + body.time : ""}</p>
				<p><strong>Stripe Session:</strong> ${body.sessionId || ""}</p>
			`
		} else {
			return { statusCode: 400, body: JSON.stringify({ error: "Invalid type" }) }
		}

		await transporter.sendMail({ from, to, subject, html, replyTo })

		return {
			statusCode: 200,
			headers: { "Access-Control-Allow-Origin": "*" },
			body: JSON.stringify({ ok: true }),
		}
	} catch (err) {
		console.error("send-email error:", err)
		return { statusCode: 500, body: JSON.stringify({ error: "Failed to send email", details: String(err && err.message || err) }) }
	}
}