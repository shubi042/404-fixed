import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"

async function getAccessToken(credentials: any) {
  try {
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
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })
    
    const tokenData = await tokenResponse.json()
    return tokenData.access_token
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()
    
    console.log("📋 Received booking data:", bookingData)
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
    const CREDENTIALS = process.env.GOOGLE_SHEETS_CREDENTIALS
    
    if (!SPREADSHEET_ID || !CREDENTIALS) {
      return NextResponse.json({
        error: "Google Sheets not configured",
        hasSpreadsheetId: !!SPREADSHEET_ID,
        hasCredentials: !!CREDENTIALS
      }, { status: 500 })
    }
    
    // Get access token using service account
    const credentials = JSON.parse(CREDENTIALS)
    const accessToken = await getAccessToken(credentials)
    
    if (!accessToken) {
      return NextResponse.json({
        error: "Failed to authenticate with Google Sheets"
      }, { status: 500 })
    }
    
    // Use Google Sheets API with access token
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Bookings!A:H:append?valueInputOption=USER_ENTERED`
    
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
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log("✅ Successfully added to Google Sheets")
      
      // Get the row number that was added
      const rowNumber = result.updates?.updatedRange ? 
        parseInt(result.updates.updatedRange.split(':')[1].replace(/[^\d]/g, '')) : 0
      
      if (rowNumber) {
        console.log(`📍 Booking added to row ${rowNumber}`)
        
        // Wait for formulas to calculate
        console.log("⏳ Waiting for round-robin formulas to calculate...")
        await new Promise(resolve => setTimeout(resolve, 4000))
        
        // Read the assigned subcontractor
        const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Bookings!F${rowNumber}:G${rowNumber}`
        
        const readResponse = await fetch(readUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        
        const readData = await readResponse.json()
        const subcontractorData = readData.values?.[0]
        
        if (subcontractorData && subcontractorData[0] && subcontractorData[1]) {
          console.log(`🎯 Subcontractor assigned: ${subcontractorData[0]}`)
          console.log(`📧 Email: ${subcontractorData[1]}`)
          
          // Send subcontractor notification email
          try {
            const emailResponse = await fetch('https://tidymate.ca/.netlify/functions/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'subcontractor',
                to: subcontractorData[1],
                subcontractorName: subcontractorData[0],
                customerName: bookingData.customerName,
                customerEmail: bookingData.customerEmail,
                phone: bookingData.phone,
                address: bookingData.address,
                date: bookingData.date,
                time: bookingData.time,
                serviceName: bookingData.serviceName,
                totalAmount: bookingData.totalAmount,
                currency: bookingData.currency,
                sessionId: bookingData.sessionId,
                instructions: bookingData.instructions
              })
            })
            
            if (emailResponse.ok) {
              console.log(`✅ Subcontractor notification sent to ${subcontractorData[1]}`)
            } else {
              console.error("❌ Failed to send subcontractor email")
            }
          } catch (emailError) {
            console.error("Email sending error:", emailError)
          }
          
          return NextResponse.json({
            success: true,
            message: "Booking processed successfully",
            result: {
              ...result,
              assignedSubcontractor: {
                name: subcontractorData[0],
                email: subcontractorData[1]
              },
              rowNumber,
              emailSent: true
            }
          })
        } else {
          console.log("⚠️ No subcontractor assigned - check your formulas in columns F & G")
          return NextResponse.json({
            success: true,
            message: "Booking added but no subcontractor assigned",
            result: {
              ...result,
              rowNumber,
              warning: "Check round-robin formulas in columns F & G"
            }
          })
        }
      }
      
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