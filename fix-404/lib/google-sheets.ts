import { google } from 'googleapis'

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

export interface BookingData {
  timestamp: string
  customerName: string
  customerEmail: string
  phone: string
  address: string
  service: string
  addons: string
  totalAmount: string
  date: string
  time: string
  instructions: string
  sessionId: string
  paymentStatus: string
  contractorName?: string
  contractorEmail?: string
  contractorPhone?: string
  estimatedDuration?: string
}

export async function addBookingToSheets(bookingData: BookingData) {
  if (!SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn('Google Sheets not configured - skipping sheets update')
    return { success: false, error: 'Google Sheets not configured' }
  }

  try {
    // Set up Google Sheets API authentication
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Prepare the row data
    const values = [
      [
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
        bookingData.contractorName || "Unassigned",
        bookingData.contractorEmail || "",
        bookingData.contractorPhone || "",
        bookingData.estimatedDuration || ""
      ]
    ]

    // Add the booking to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Bookings!A:Q', // Extended to include contractor columns
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    })

    console.log('✅ Booking added to Google Sheets successfully')
    return { success: true }

  } catch (error: any) {
    console.error('❌ Failed to add booking to Google Sheets:', error)
    return { success: false, error: error.message }
  }
}

export async function createBookingSheet(sheetId: string) {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Sheets credentials not configured')
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Create header row
    const headers = [
      'Timestamp',
      'Customer Name', 
      'Email',
      'Phone',
      'Address',
      'Service',
      'Add-ons',
      'Total Amount',
      'Preferred Date',
      'Preferred Time',
      'Instructions',
      'Session ID',
      'Payment Status',
      'Assigned Contractor',
      'Contractor Email',
      'Contractor Phone',
      'Estimated Duration (hrs)'
    ]

    // Add headers to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Bookings!A1:Q1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    })

    console.log('✅ Google Sheets headers created successfully')
    return { success: true }

  } catch (error: any) {
    console.error('❌ Failed to create Google Sheets headers:', error)
    throw error
  }
}