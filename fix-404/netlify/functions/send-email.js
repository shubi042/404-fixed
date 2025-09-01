const nodemailer = require("nodemailer")
const { google } = require("googleapis")

async function handleGoogleSheetsBooking(bookingData) {
	try {
		const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
		const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings"
		
		if (!SPREADSHEET_ID || !process.env.GOOGLE_SHEETS_CREDENTIALS) {
			console.log("Google Sheets not configured, skipping...")
			return
		}
		
		const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
		const auth = new google.auth.GoogleAuth({
			credentials,
			scopes: ['https://www.googleapis.com/auth/spreadsheets'],
		})
		
		const sheets = google.sheets({ version: 'v4', auth })
		
		// Prepare booking row
		const bookingRow = [
			new Date().toISOString(),
			bookingData.customerName || "",
			bookingData.serviceName || "",
			bookingData.date || "",
			bookingData.time || "",
			"", // Will be filled by formula
			"", // Will be filled by formula
			""  // Will be filled by formula
		]
		
		console.log("📊 Adding booking to Google Sheets...")
		
		// Add booking to sheet
		const appendResult = await sheets.spreadsheets.values.append({
			spreadsheetId: SPREADSHEET_ID,
			range: `${SHEET_NAME}!A:H`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [bookingRow],
			},
		})
		
		const updatedRange = appendResult.data.updates?.updatedRange
		const rowNumber = updatedRange ? parseInt(updatedRange.split(':')[1].replace(/[^\d]/g, '')) : 0
		
		console.log(`📍 Booking added to row ${rowNumber}`)
		
		// Wait for formulas
		await new Promise(resolve => setTimeout(resolve, 3000))
		
		// Read assignment
		const readResult = await sheets.spreadsheets.values.get({
			spreadsheetId: SPREADSHEET_ID,
			range: `${SHEET_NAME}!F${rowNumber}:G${rowNumber}`,
		})
		
		const subcontractorData = readResult.data.values?.[0]
		
		if (subcontractorData && subcontractorData[0] && subcontractorData[1]) {
			console.log(`👷 Subcontractor assigned: ${subcontractorData[0]}`)
			
			// Send subcontractor email via SMTP
			await sendSubcontractorEmailSMTP(bookingData, {
				name: subcontractorData[0],
				email: subcontractorData[1]
			})
		}
		
	} catch (error) {
		console.error("Google Sheets integration error:", error)
	}
}

async function sendSubcontractorEmailSMTP(booking, subcontractor) {
	try {
		const transporter = nodemailer.createTransporter({
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