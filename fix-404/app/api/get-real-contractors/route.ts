import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
	return handleContractorRequest(request)
}

export async function POST(request: NextRequest) {
	return handleContractorRequest(request)
}

async function handleContractorRequest(request: NextRequest) {
	try {
		console.log("📊 Accessing real subcontractors from Google Sheets...")

		const SHEET_ID = process.env.GOOGLE_SHEET_ID
		const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
		const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY

		if (!SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
			return NextResponse.json({ 
				error: "Google Sheets not configured",
				message: "Need GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY"
			}, { status: 400 })
		}

		// Use Google Sheets API via HTTP request instead of googleapis library
		try {
			// Create JWT token for Google API authentication
			const jwt = require('jsonwebtoken')
			
			const now = Math.floor(Date.now() / 1000)
			const payload = {
				iss: GOOGLE_CLIENT_EMAIL,
				scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
				aud: 'https://oauth2.googleapis.com/token',
				exp: now + 3600,
				iat: now
			}

			const token = jwt.sign(payload, GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), { algorithm: 'RS256' })

			// Get access token
			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
			})

			const tokenData = await tokenResponse.json()
			
			if (!tokenData.access_token) {
				throw new Error('Failed to get access token')
			}

			// Read from subcontractors sheet
			const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/subcontractors!A1:H100`
			const sheetsResponse = await fetch(sheetsUrl, {
				headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
			})

			const sheetsData = await sheetsResponse.json()
			
			if (!sheetsData.values) {
				return NextResponse.json({ 
					error: "No data found in subcontractors sheet",
					message: "Check if 'subcontractors' sheet exists and has data"
				}, { status: 400 })
			}

			const rows = sheetsData.values
			const headers = rows[0] || []
			const contractorRows = rows.slice(1) // Skip header row

			const contractors = contractorRows.map((row, index) => ({
				id: row[0] || `contractor-${index + 1}`,
				name: row[1] || 'Unknown',
				email: row[2] || '',
				phone: row[3] || '',
				specialties: (row[4] || '').split(',').map(s => s.trim()).filter(Boolean),
				availability: (row[5] || '').split(',').map(s => s.trim()).filter(Boolean),
				maxJobsPerDay: parseInt(row[6]) || 2,
				status: (row[7] || 'active').toLowerCase()
			})).filter(c => c.email && c.email.includes('@') && c.status === 'active')

			console.log(`✅ Found ${contractors.length} active contractors in Google Sheets`)

			return NextResponse.json({
				success: true,
				contractors,
				sheetData: {
					headers,
					totalRows: contractorRows.length,
					activeContractors: contractors.length
				}
			})

		} catch (error: any) {
			console.error("❌ Google Sheets access error:", error)
			return NextResponse.json({ 
				error: error.message,
				message: "Failed to access Google Sheets"
			}, { status: 500 })
		}

	} catch (error: any) {
		console.error("❌ Get contractors error:", error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}