// Simple Google Sheets API integration using fetch
// This avoids complex dependencies while still accessing your real contractor data

export interface Contractor {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  availability: string[]
  maxJobsPerDay: number
  status: string
}

export async function getAccessToken(): Promise<string | null> {
  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
  const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn('Google credentials not configured')
    return null
  }

  try {
    // Create JWT for Google API authentication
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: GOOGLE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    // Simple JWT creation (avoiding jsonwebtoken dependency)
    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    
    const crypto = require('crypto')
    const signature = crypto
      .createSign('RSA-SHA256')
      .update(`${base64Header}.${base64Payload}`)
      .sign(GOOGLE_PRIVATE_KEY, 'base64url')

    const jwt = `${base64Header}.${base64Payload}.${signature}`

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    })

    const tokenData = await tokenResponse.json()
    
    if (tokenData.access_token) {
      console.log('✅ Google API access token obtained')
      return tokenData.access_token
    } else {
      console.error('❌ Failed to get access token:', tokenData)
      return null
    }

  } catch (error) {
    console.error('❌ Google authentication error:', error)
    return null
  }
}

export async function getContractorsFromSheet(): Promise<Contractor[]> {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  
  if (!SHEET_ID) {
    console.warn('GOOGLE_SHEET_ID not configured')
    return []
  }

  try {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      console.warn('Could not authenticate with Google Sheets')
      return []
    }

    // Read from subcontractors sheet
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/subcontractors!A1:H100`
    const response = await fetch(sheetsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    const data = await response.json()
    
    if (!data.values || data.values.length === 0) {
      console.warn('No contractors found in subcontractors sheet')
      return []
    }

    const rows = data.values
    const headers = rows[0] || []
    const contractorRows = rows.slice(1) // Skip header row

    const contractors: Contractor[] = []

    for (const row of contractorRows) {
      if (row.length >= 3) { // At least ID, name, email
        const contractor: Contractor = {
          id: row[0] || `contractor-${Date.now()}`,
          name: row[1] || 'Unknown',
          email: row[2] || '',
          phone: row[3] || '',
          specialties: (row[4] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
          availability: (row[5] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
          maxJobsPerDay: parseInt(row[6]) || 2,
          status: (row[7] || 'active').toLowerCase()
        }

        // Only include active contractors with valid email
        if (contractor.status === 'active' && contractor.email && contractor.email.includes('@')) {
          contractors.push(contractor)
        }
      }
    }

    console.log(`✅ Loaded ${contractors.length} active contractors from Google Sheets:`)
    contractors.forEach(c => console.log(`   - ${c.name} (${c.email})`))

    return contractors

  } catch (error) {
    console.error('❌ Failed to load contractors from Google Sheets:', error)
    return []
  }
}

export async function addBookingToSheet(bookingData: any): Promise<{ success: boolean; error?: string }> {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID
  
  if (!SHEET_ID) {
    console.log('📊 Booking data (sheets not configured):', bookingData)
    return { success: false, error: 'Google Sheets not configured' }
  }

  try {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      console.log('📊 Booking data (auth failed):', bookingData)
      return { success: false, error: 'Authentication failed' }
    }

    // Prepare row data
    const values = [[
      bookingData.timestamp,
      bookingData.customerName,
      bookingData.customerEmail,
      bookingData.phone,
      bookingData.address,
      bookingData.service,
      bookingData.addons,
      bookingData.totalAmount,
      bookingData.date,
      bookingData.time,
      bookingData.instructions,
      bookingData.sessionId,
      bookingData.paymentStatus,
      bookingData.contractorName || 'Unassigned',
      bookingData.contractorEmail || '',
      bookingData.contractorPhone || '',
      bookingData.estimatedDuration || ''
    ]]

    // Add to Bookings sheet
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Bookings!A:Q:append?valueInputOption=USER_ENTERED`
    const appendResponse = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    })

    if (appendResponse.ok) {
      console.log('✅ Booking added to Google Sheets successfully')
      return { success: true }
    } else {
      const error = await appendResponse.text()
      console.error('❌ Failed to add booking to sheets:', error)
      return { success: false, error }
    }

  } catch (error: any) {
    console.error('❌ Sheets API error:', error)
    return { success: false, error: error.message }
  }
}