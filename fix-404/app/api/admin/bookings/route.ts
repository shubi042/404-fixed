import { NextResponse } from "next/server"
import { google } from "googleapis"

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings"

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}')
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  
  return google.sheets({ version: 'v4', auth })
}

export async function GET() {
  try {
    if (!SPREADSHEET_ID) {
      return NextResponse.json({ error: "Google Sheets not configured" }, { status: 500 })
    }

    const sheets = await getGoogleSheetsClient()
    
    // Get recent bookings (last 10)
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:Q50`, // Adjust range as needed
    })

    const rows = result.data.values || []
    const headers = rows[0] || []
    const bookings = rows.slice(1).map(row => {
      const booking: any = {}
      headers.forEach((header, index) => {
        booking[header] = row[index] || ""
      })
      return booking
    })

    // Get summary statistics
    const totalBookings = bookings.length
    const pendingBookings = bookings.filter(b => b.Status === "Pending").length
    const completedBookings = bookings.filter(b => b.Status === "Completed").length
    const assignedBookings = bookings.filter(b => b["Assigned Subcontractor"]).length

    return NextResponse.json({
      success: true,
      summary: {
        totalBookings,
        pendingBookings,
        completedBookings,
        assignedBookings,
        assignmentRate: totalBookings > 0 ? Math.round((assignedBookings / totalBookings) * 100) : 0
      },
      recentBookings: bookings.slice(0, 10), // Last 10 bookings
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Error fetching booking data:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch booking data" },
      { status: 500 }
    )
  }
}