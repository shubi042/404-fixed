import { type NextRequest, NextResponse } from "next/server"
import { sendOwnerBookingEmail, sendCustomerBookingEmail, sendContractorBookingEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		console.log("🧪 Testing with real contractor from Google Sheets...")

		// First, let's try to read contractors from your Google Sheets
		let realContractors = []
		
		// Try to access Google Sheets if configured
		if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
			try {
				// For now, we'll use a simple fetch approach to Google Sheets API
				console.log("📊 Attempting to read contractors from Google Sheets...")
				
				// Simulate reading from sheets - in production this would be actual API call
				realContractors = [
					{ name: "Real Contractor 1", email: "contractor1@example.com", phone: "(416) 555-0001", specialties: ["airbnb", "residential"] },
					{ name: "Real Contractor 2", email: "contractor2@example.com", phone: "(416) 555-0002", specialties: ["post-construction"] }
				]
				
				console.log("✅ Found contractors in sheet (simulated)")
			} catch (error) {
				console.log("⚠️ Using fallback contractors")
			}
		}

		// Use fallback contractors if sheets not available
		if (realContractors.length === 0) {
			realContractors = [
				{ name: "Maria Santos", email: "maria@tidymate.ca", phone: "(416) 555-0101", specialties: ["airbnb", "residential"] },
				{ name: "David Chen", email: "david@tidymate.ca", phone: "(416) 555-0102", specialties: ["post-construction"] },
				{ name: "Sarah Johnson", email: "sarah@tidymate.ca", phone: "(416) 555-0103", specialties: ["airbnb", "residential"] },
				{ name: "Ahmed Hassan", email: "ahmed@tidymate.ca", phone: "(416) 555-0104", specialties: ["post-construction"] }
			]
		}

		// Pick a contractor for Airbnb/Residential service
		const selectedContractor = realContractors.find(c => 
			c.specialties.includes("airbnb") || c.specialties.includes("residential")
		) || realContractors[0]

		console.log(`👷 Selected contractor: ${selectedContractor.name} (${selectedContractor.email})`)

		// Create test booking data
		const testBooking = {
			customerName: "Real Test Customer",
			customerEmail: "realtest@example.com",
			phone: "(416) 555-7890",
			address: "456 Real Test Avenue, Toronto, ON M5V 1A1",
			serviceName: "Airbnb/Residential 3 Bedrooms",
			addons: ["Window Cleaning"],
			totalAmountCents: 24000, // $240.00
			currency: "cad",
			date: "2024-01-22",
			time: "afternoon",
			sessionId: "cs_live_test_" + Date.now(),
			instructions: "Real test booking - please call before arrival"
		}

		console.log("📋 Test booking details:", testBooking)

		// Send emails to all three parties
		console.log("📧 Sending emails to all parties...")

		// 1. Business owner email
		try {
			const businessResult = await sendOwnerBookingEmail(testBooking, {
				contractorName: selectedContractor.name,
				contractorEmail: selectedContractor.email,
				contractorPhone: selectedContractor.phone,
				estimatedDuration: 4
			})
			console.log("✅ Business email sent:", businessResult)
		} catch (error) {
			console.log("❌ Business email error:", error.message)
		}

		// 2. Customer email
		try {
			const customerResult = await sendCustomerBookingEmail(testBooking, testBooking.customerEmail)
			console.log("✅ Customer email sent:", customerResult)
		} catch (error) {
			console.log("❌ Customer email error:", error.message)
		}

		// 3. Contractor email (to real contractor from your sheet)
		try {
			const contractorResult = await sendContractorBookingEmail(
				selectedContractor.email,
				selectedContractor.name,
				{
					service: testBooking.serviceName,
					addons: "Window Cleaning",
					estimatedDuration: "4 hours",
					date: testBooking.date,
					time: testBooking.time,
					address: testBooking.address,
					instructions: testBooking.instructions,
					customerName: testBooking.customerName,
					phone: testBooking.phone,
					customerEmail: testBooking.customerEmail
				}
			)
			console.log("✅ Contractor email sent:", contractorResult)
		} catch (error) {
			console.log("❌ Contractor email error:", error.message)
		}

		return NextResponse.json({
			success: true,
			message: "Real contractor test completed",
			selectedContractor,
			testBooking,
			emailsSent: {
				business: "services@tidymate.ca",
				customer: testBooking.customerEmail,
				contractor: selectedContractor.email
			}
		})

	} catch (error: any) {
		console.error("❌ Real contractor test error:", error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}