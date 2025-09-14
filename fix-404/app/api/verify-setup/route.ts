import { type NextRequest, NextResponse } from "next/server"
import { google } from 'googleapis'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		console.log("🔍 Verifying complete system setup...")

		// Check environment variables
		const config = {
			hasResendKey: !!process.env.RESEND_API_KEY,
			hasGoogleSheetId: !!process.env.GOOGLE_SHEET_ID,
			hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
			hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
			hasStripeKeys: !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
		}

		console.log("📋 Environment variables check:", config)

		const results = {
			environmentVariables: config,
			googleSheetsConnection: null,
			contractorSheetAccess: null,
			emailSystem: null
		}

		// Test Google Sheets connection
		if (config.hasGoogleSheetId && config.hasGoogleClientEmail && config.hasGooglePrivateKey) {
			try {
				const auth = new google.auth.GoogleAuth({
					credentials: {
						client_email: process.env.GOOGLE_CLIENT_EMAIL!,
						private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
					},
					scopes: ['https://www.googleapis.com/auth/spreadsheets'],
				})

				const sheets = google.sheets({ version: 'v4', auth })

				// Test connection to main sheet
				const sheetInfo = await sheets.spreadsheets.get({
					spreadsheetId: process.env.GOOGLE_SHEET_ID!
				})

				results.googleSheetsConnection = {
					success: true,
					sheetTitle: sheetInfo.data.properties?.title || 'Unknown',
					sheetCount: sheetInfo.data.sheets?.length || 0
				}

				console.log(`✅ Connected to Google Sheet: ${sheetInfo.data.properties?.title}`)

				// Test subcontractors sheet access
				try {
					const contractorsResponse = await sheets.spreadsheets.values.get({
						spreadsheetId: process.env.GOOGLE_SHEET_ID!,
						range: 'subcontractors!A1:H10'
					})

					const contractorRows = contractorsResponse.data.values || []
					results.contractorSheetAccess = {
						success: true,
						hasHeaders: contractorRows.length > 0,
						contractorCount: Math.max(0, contractorRows.length - 1), // Subtract header row
						sampleData: contractorRows.slice(0, 3) // First 3 rows for verification
					}

					console.log(`✅ Subcontractors sheet accessible with ${contractorRows.length - 1} contractors`)

				} catch (error) {
					results.contractorSheetAccess = {
						success: false,
						error: error.message
					}
					console.log("❌ Cannot access subcontractors sheet:", error.message)
				}

			} catch (error) {
				results.googleSheetsConnection = {
					success: false,
					error: error.message
				}
				console.log("❌ Google Sheets connection failed:", error.message)
			}
		} else {
			results.googleSheetsConnection = {
				success: false,
				error: "Missing Google Sheets environment variables"
			}
		}

		// Test email system
		if (config.hasResendKey) {
			results.emailSystem = {
				success: true,
				configured: true,
				message: "Email system ready for sending"
			}
			console.log("✅ Email system ready")
		} else {
			results.emailSystem = {
				success: false,
				configured: false,
				message: "RESEND_API_KEY not configured"
			}
		}

		// Overall readiness assessment
		const isReady = 
			config.hasResendKey &&
			config.hasStripeKeys &&
			results.googleSheetsConnection?.success &&
			results.contractorSheetAccess?.success

		return NextResponse.json({
			ready: isReady,
			message: isReady ? "🎉 System fully configured and ready for deployment!" : "⚠️ Some configuration missing",
			details: results,
			nextSteps: isReady ? [
				"Deploy your site",
				"Make a test booking", 
				"Check all three email addresses",
				"Verify Google Sheets updates"
			] : [
				"Fix missing environment variables",
				"Ensure subcontractors sheet exists",
				"Share sheet with service account",
				"Test again"
			]
		})

	} catch (error: any) {
		console.error("❌ Setup verification error:", error)
		return NextResponse.json({ 
			ready: false,
			error: error.message,
			message: "Setup verification failed"
		}, { status: 500 })
	}
}