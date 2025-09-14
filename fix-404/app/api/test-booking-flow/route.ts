import { type NextRequest, NextResponse } from "next/server"
import { sendOwnerBookingEmail, sendCustomerBookingEmail, sendContractorBookingEmail } from "@/lib/email"
import { addBookingToSheets, type BookingData } from "@/lib/google-sheets"
import { assignContractor } from "@/lib/contractor-assignment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
	try {
		console.log("🧪 Testing complete booking flow...")

		// Simulate a real booking
		const testBooking = {
			customerName: "Jennifer Thompson",
			customerEmail: "jennifer.thompson@example.com",
			phone: "(416) 555-9876",
			address: "789 College Street, Unit 4B, Toronto, ON M6G 1C5",
			serviceName: "Airbnb/Residential 3 Bedrooms",
			addons: ["Window Cleaning", "Inside Refrigerator"],
			totalAmountCents: 26500, // $265.00
			currency: "cad",
			date: "2024-01-25",
			time: "morning",
			sessionId: "cs_test_" + Date.now(),
			instructions: "Please call 30 minutes before arrival. Building code is 1234."
		}

		console.log("📋 Test booking data:", testBooking)

		// Step 1: Assign contractor
		console.log("👷 Step 1: Assigning contractor...")
		const contractorAssignment = assignContractor(
			testBooking.serviceName,
			testBooking.date,
			1
		)

		if (contractorAssignment) {
			console.log(`✅ Contractor assigned: ${contractorAssignment.contractorName}`)
		} else {
			console.log("⚠️ No contractor assigned")
		}

		// Step 2: Send business owner email
		console.log("📧 Step 2: Sending business owner email...")
		try {
			const ownerResult = await sendOwnerBookingEmail(testBooking, contractorAssignment)
			console.log("✅ Business owner email result:", ownerResult)
		} catch (error) {
			console.log("❌ Business owner email error:", error.message)
		}

		// Step 3: Send customer email  
		console.log("📧 Step 3: Sending customer email...")
		try {
			const customerResult = await sendCustomerBookingEmail(testBooking, testBooking.customerEmail)
			console.log("✅ Customer email result:", customerResult)
		} catch (error) {
			console.log("❌ Customer email error:", error.message)
		}

		// Step 4: Send contractor email
		if (contractorAssignment) {
			console.log("📧 Step 4: Sending contractor email...")
			try {
				const contractorResult = await sendContractorBookingEmail(
					contractorAssignment.contractorEmail,
					contractorAssignment.contractorName,
					{
						service: testBooking.serviceName,
						addons: testBooking.addons.join(", "),
						estimatedDuration: `${contractorAssignment.estimatedDuration} hours`,
						date: testBooking.date,
						time: testBooking.time,
						address: testBooking.address,
						instructions: testBooking.instructions,
						customerName: testBooking.customerName,
						phone: testBooking.phone,
						customerEmail: testBooking.customerEmail
					}
				)
				console.log("✅ Contractor email result:", contractorResult)
			} catch (error) {
				console.log("❌ Contractor email error:", error.message)
			}
		}

		// Step 5: Add to Google Sheets
		console.log("📊 Step 5: Adding to Google Sheets...")
		const sheetsData: BookingData = {
			timestamp: new Date().toISOString(),
			customerName: testBooking.customerName,
			customerEmail: testBooking.customerEmail,
			phone: testBooking.phone,
			address: testBooking.address,
			service: testBooking.serviceName,
			addons: testBooking.addons.join(", "),
			totalAmount: `$${(testBooking.totalAmountCents / 100).toFixed(2)} ${testBooking.currency.toUpperCase()}`,
			date: testBooking.date,
			time: testBooking.time,
			instructions: testBooking.instructions,
			sessionId: testBooking.sessionId,
			paymentStatus: "Completed",
			contractorName: contractorAssignment?.contractorName,
			contractorEmail: contractorAssignment?.contractorEmail,
			contractorPhone: contractorAssignment?.contractorPhone,
			estimatedDuration: contractorAssignment?.estimatedDuration ? `${contractorAssignment.estimatedDuration} hours` : ""
		}

		try {
			const sheetsResult = await addBookingToSheets(sheetsData)
			console.log("✅ Google Sheets result:", sheetsResult)
		} catch (error) {
			console.log("❌ Google Sheets error:", error.message)
		}

		return NextResponse.json({ 
			success: true, 
			message: "Complete booking flow tested",
			contractorAssignment,
			testBooking,
			sheetsData
		})

	} catch (error: any) {
		console.error("❌ Test booking flow error:", error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}