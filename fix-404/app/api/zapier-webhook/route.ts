import { NextResponse, type NextRequest } from "next/server"
import { google } from "googleapis"
import { sendSubcontractorNotificationEmail } from "@/lib/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings"

interface BookingData {
  customerName: string
  customerEmail: string
  phone: string
  address: string
  date: string
  time: string
  serviceName: string
  addons: string[]
  totalAmount: number
  currency: string
  sessionId: string
  instructions?: string
}

interface SubcontractorInfo {
  name: string
  email: string
  phone: string
  specialties: string[]
}

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}')
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  
  return google.sheets({ version: 'v4', auth })
}

async function addBookingToSheet(booking: BookingData): Promise<{ assignedSubcontractor: SubcontractorInfo | null, rowNumber: number }> {
  try {
    const sheets = await getGoogleSheetsClient()
    
    if (!SPREADSHEET_ID) {
      throw new Error("Google Sheets ID not configured")
    }

    // Prepare booking data for the sheet
    const bookingRow = [
      new Date().toISOString(), // Timestamp
      booking.customerName,
      booking.customerEmail,
      booking.phone,
      booking.address,
      booking.date,
      booking.time,
      booking.serviceName,
      booking.addons.join(", "),
      booking.totalAmount,
      booking.currency,
      booking.sessionId,
      booking.instructions || "",
      "", // Assigned subcontractor (will be filled by formula)
      "", // Subcontractor email (will be filled by formula)
      "", // Subcontractor phone (will be filled by formula)
      "Pending", // Status
    ]

    // Add the booking to the sheet
    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Q`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [bookingRow],
      },
    })

    // Get the row number that was just added
    const updatedRange = appendResult.data.updates?.updatedRange
    const rowNumber = updatedRange ? parseInt(updatedRange.split(':')[1].replace(/[^\d]/g, '')) : 0

    // Wait a moment for formulas to calculate
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Read back the row to get the assigned subcontractor info
    const readResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!N${rowNumber}:P${rowNumber}`, // Columns N, O, P for subcontractor info
    })

    const subcontractorData = readResult.data.values?.[0]
    let assignedSubcontractor: SubcontractorInfo | null = null

    if (subcontractorData && subcontractorData[0] && subcontractorData[1]) {
      assignedSubcontractor = {
        name: subcontractorData[0],
        email: subcontractorData[1],
        phone: subcontractorData[2] || "",
        specialties: [], // Can be expanded based on your sheet structure
      }
    }

    return { assignedSubcontractor, rowNumber }
  } catch (error) {
    console.error("Error adding booking to sheet:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Zapier (optional - add authentication header if needed)
    const authHeader = request.headers.get("authorization")
    const expectedAuth = process.env.ZAPIER_WEBHOOK_SECRET
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookingData: BookingData = await request.json()

    // Validate required fields
    if (!bookingData.customerEmail || !bookingData.customerName || !bookingData.serviceName) {
      return NextResponse.json({ error: "Missing required booking data" }, { status: 400 })
    }

    console.log("📋 Processing booking from Zapier:", {
      customer: bookingData.customerName,
      service: bookingData.serviceName,
      date: bookingData.date,
    })

    // Add booking to Google Sheets and get assigned subcontractor
    const { assignedSubcontractor, rowNumber } = await addBookingToSheet(bookingData)

    if (assignedSubcontractor) {
      console.log("👷 Subcontractor assigned:", assignedSubcontractor.name)
      
      // Send notification email to the assigned subcontractor
      try {
        await sendSubcontractorNotificationEmail(bookingData, assignedSubcontractor)
        console.log("📧 Subcontractor notification sent to:", assignedSubcontractor.email)
      } catch (emailError) {
        console.error("Failed to send subcontractor email:", emailError)
        // Don't fail the whole process if email fails
      }
    } else {
      console.warn("⚠️ No subcontractor was assigned for this booking")
    }

    return NextResponse.json({
      success: true,
      message: "Booking processed successfully",
      assignedSubcontractor: assignedSubcontractor?.name || null,
      rowNumber,
    })

  } catch (error: any) {
    console.error("Error processing Zapier webhook:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process booking" },
      { status: 500 }
    )
  }
}