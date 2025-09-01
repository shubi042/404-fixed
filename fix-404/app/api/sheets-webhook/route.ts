import { NextResponse, type NextRequest } from "next/server"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()
    
    console.log("📋 Received booking data:", bookingData)
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
    const API_KEY = process.env.GOOGLE_API_KEY // We'll use API key instead of service account
    
    if (!SPREADSHEET_ID || !API_KEY) {
      return NextResponse.json({
        error: "Google Sheets not configured",
        hasSpreadsheetId: !!SPREADSHEET_ID,
        hasApiKey: !!API_KEY
      }, { status: 500 })
    }
    
    // Use Google Sheets API with API key (simpler than service account)
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Bookings!A:H:append?valueInputOption=USER_ENTERED&key=${API_KEY}`
    
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
    
    const response = await fetch(sheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log("✅ Successfully added to Google Sheets")
      return NextResponse.json({
        success: true,
        message: "Booking added to Google Sheets",
        result
      })
    } else {
      console.error("❌ Google Sheets API error:", result)
      return NextResponse.json({
        error: "Failed to add to Google Sheets",
        details: result
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}