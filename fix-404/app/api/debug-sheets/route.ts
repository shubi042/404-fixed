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
    const sheets = await getGoogleSheetsClient()
    
    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    })
    
    const sheetNames = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title) || []
    
    // Read bookings sheet
    const bookingsData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:H15`,
    })
    
    // Try to read subcontractors sheet
    let subcontractorsData = null
    let subcontractorSheetName = null
    
    // Try different possible names
    const possibleNames = ['Subcontractors', 'subcontractors', 'Subcontractor', 'Team', 'Staff']
    
    for (const name of possibleNames) {
      if (sheetNames.includes(name)) {
        try {
          subcontractorsData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${name}!A1:C10`,
          })
          subcontractorSheetName = name
          break
        } catch (e) {
          // Continue trying
        }
      }
    }
    
    // Check what's in F and G columns
    const assignmentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!F1:G15`,
    })
    
    return NextResponse.json({
      success: true,
      debug: {
        spreadsheetId: SPREADSHEET_ID,
        allSheetNames: sheetNames,
        subcontractorSheetFound: subcontractorSheetName,
        bookingsData: bookingsData.data.values || [],
        subcontractorsData: subcontractorsData?.data.values || null,
        assignmentColumns: assignmentData.data.values || [],
        lastRow: bookingsData.data.values?.length || 0
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      debug: {
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME
      }
    }, { status: 500 })
  }
}