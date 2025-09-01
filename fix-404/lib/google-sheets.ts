import { google } from "googleapis"

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Bookings"

export interface BookingRowData {
  timestamp: string
  customerName: string
  customerEmail: string
  phone: string
  address: string
  date: string
  time: string
  serviceName: string
  addons: string
  totalAmount: number
  currency: string
  sessionId: string
  instructions: string
  assignedSubcontractor?: string
  subcontractorEmail?: string
  subcontractorPhone?: string
  status: string
}

export interface SubcontractorInfo {
  name: string
  email: string
  phone: string
  specialties: string[]
}

async function getGoogleSheetsClient() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}')
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    
    return google.sheets({ version: 'v4', auth })
  } catch (error) {
    console.error("Error creating Google Sheets client:", error)
    throw new Error("Failed to authenticate with Google Sheets")
  }
}

export async function addBookingToSheet(bookingData: Partial<BookingRowData>): Promise<{ 
  assignedSubcontractor: SubcontractorInfo | null, 
  rowNumber: number 
}> {
  try {
    const sheets = await getGoogleSheetsClient()
    
    if (!SPREADSHEET_ID) {
      throw new Error("Google Sheets ID not configured. Please set GOOGLE_SHEETS_ID environment variable.")
    }

    // Prepare booking data for the sheet
    const bookingRow = [
      bookingData.timestamp || new Date().toISOString(),
      bookingData.customerName || "",
      bookingData.customerEmail || "",
      bookingData.phone || "",
      bookingData.address || "",
      bookingData.date || "",
      bookingData.time || "",
      bookingData.serviceName || "",
      bookingData.addons || "",
      bookingData.totalAmount || 0,
      bookingData.currency || "CAD",
      bookingData.sessionId || "",
      bookingData.instructions || "",
      "", // Assigned subcontractor (will be filled by your existing formula)
      "", // Subcontractor email (will be filled by your existing formula)
      "", // Subcontractor phone (will be filled by your existing formula)
      bookingData.status || "Pending",
    ]

    console.log("📊 Adding booking to Google Sheets:", {
      customer: bookingData.customerName,
      service: bookingData.serviceName,
      sheetId: SPREADSHEET_ID,
    })

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

    console.log(`📍 Booking added to row ${rowNumber}`)

    // Wait for formulas to calculate (your round-robin assignment)
    console.log("⏳ Waiting for Google Sheets formulas to calculate...")
    await new Promise(resolve => setTimeout(resolve, 3000))

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
      
      console.log("👷 Subcontractor assigned:", assignedSubcontractor.name)
    } else {
      console.warn("⚠️ No subcontractor was assigned by the formula")
    }

    return { assignedSubcontractor, rowNumber }
  } catch (error) {
    console.error("Error adding booking to Google Sheets:", error)
    throw error
  }
}

export async function updateBookingStatus(rowNumber: number, status: string): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient()
    
    if (!SPREADSHEET_ID) {
      throw new Error("Google Sheets ID not configured")
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!Q${rowNumber}`, // Status column
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[status]],
      },
    })

    console.log(`📊 Updated booking status to "${status}" for row ${rowNumber}`)
  } catch (error) {
    console.error("Error updating booking status:", error)
    throw error
  }
}

export async function getSubcontractorList(): Promise<SubcontractorInfo[]> {
  try {
    const sheets = await getGoogleSheetsClient()
    
    if (!SPREADSHEET_ID) {
      throw new Error("Google Sheets ID not configured")
    }

    // Assuming you have a "Subcontractors" sheet with subcontractor details
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Subcontractors!A:D', // Adjust range based on your subcontractor sheet structure
    })

    const rows = result.data.values || []
    const subcontractors: SubcontractorInfo[] = []

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row[0] && row[1]) { // Name and email are required
        subcontractors.push({
          name: row[0],
          email: row[1],
          phone: row[2] || "",
          specialties: row[3] ? row[3].split(",").map((s: string) => s.trim()) : [],
        })
      }
    }

    return subcontractors
  } catch (error) {
    console.error("Error fetching subcontractor list:", error)
    return []
  }
}