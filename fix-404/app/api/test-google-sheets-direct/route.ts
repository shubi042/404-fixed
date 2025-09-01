import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Testing Google Sheets REST API directly...")
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
    const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings"
    
    console.log("📊 Config:", {
      hasSpreadsheetId: !!SPREADSHEET_ID,
      hasCredentials: !!process.env.GOOGLE_SHEETS_CREDENTIALS,
      sheetName: SHEET_NAME,
      spreadsheetId: SPREADSHEET_ID
    })
    
    if (!SPREADSHEET_ID || !process.env.GOOGLE_SHEETS_CREDENTIALS) {
      return NextResponse.json({
        error: "Google Sheets not configured",
        config: {
          hasSpreadsheetId: !!SPREADSHEET_ID,
          hasCredentials: !!process.env.GOOGLE_SHEETS_CREDENTIALS
        }
      }, { status: 500 })
    }
    
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
    
    console.log("🔑 Service account:", credentials.client_email)
    
    // Create JWT for authentication
    const crypto = await import('crypto')
    
    const header = { alg: 'RS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }
    
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signatureInput = `${headerB64}.${payloadB64}`
    
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), credentials.private_key)
    const signatureB64 = signature.toString('base64url')
    
    const jwt = `${headerB64}.${payloadB64}.${signatureB64}`
    
    console.log("🔐 JWT created")
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })
    
    const tokenData = await tokenResponse.json()
    console.log("🔑 Token response:", { hasAccessToken: !!tokenData.access_token, error: tokenData.error })
    
    if (!tokenData.access_token) {
      return NextResponse.json({
        error: "Failed to get access token",
        tokenResponse: tokenData
      }, { status: 500 })
    }
    
    console.log("✅ Got access token")
    
    // Test reading the sheet first
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A1:H5`
    
    const readResponse = await fetch(readUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })
    
    const readData = await readResponse.json()
    console.log("📖 Read test:", { success: !!readData.values, rows: readData.values?.length })
    
    if (!readData.values) {
      return NextResponse.json({
        error: "Cannot read from Google Sheets",
        readResponse: readData
      }, { status: 500 })
    }
    
    // Test adding a row
    const values = [[
      new Date().toISOString(),
      "REST API Test Customer",
      "REST API Test Service",
      "2024-01-20",
      "Morning",
      "",
      "",
      ""
    ]]
    
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`
    
    const appendResponse = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    })
    
    const appendData = await appendResponse.json()
    console.log("📝 Append result:", appendData)
    
    if (appendData.updates) {
      const rowNumber = parseInt(appendData.updates.updatedRange.split(':')[1].replace(/[^\d]/g, ''))
      console.log(`✅ Test booking added to row ${rowNumber}`)
      
      return NextResponse.json({
        success: true,
        message: "Google Sheets REST API test successful",
        result: {
          rowNumber,
          updatedRange: appendData.updates.updatedRange
        },
        config: {
          spreadsheetId: SPREADSHEET_ID,
          sheetName: SHEET_NAME,
          serviceAccount: credentials.client_email
        }
      })
    } else {
      return NextResponse.json({
        error: "Failed to append to Google Sheets",
        appendResponse: appendData
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}