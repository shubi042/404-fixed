const nodemailer = require("nodemailer")
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
		const sanitizeEmail = (email) => (typeof email === "string" ? email.replace(/\s+/g, "").toLowerCase() : "")
		const replyToCandidate = sanitizeEmail(body.email)
		const type = body.type || "contact"

		let subject = body.subject || ""
		let html = ""
		let to = body.to || MAIL_TO
		const from = SMTP_USER // enforce sender matches mailbox to avoid rejection
		const replyTo = replyToCandidate && EMAIL_REGEX.test(replyToCandidate) ? replyToCandidate : undefined

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