import { NextResponse } from "next/server"
import { addBookingToSheet } from "@/lib/google-sheets"
import { sendSubcontractorNotificationEmail } from "@/lib/email"

export async function GET() {
  try {
    console.log('🧪 Testing Complete Booking Flow...')
    
    // Test booking data
    const testBooking = {
      timestamp: new Date().toISOString(),
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      phone: "(416) 123-4567",
      address: "123 Test St, Toronto, ON",
      date: "2024-01-15",
      time: "Morning (8AM - 12PM)",
      serviceName: "Airbnb 2 Bedrooms",
      addons: "Window Cleaning",
      totalAmount: 180,
      currency: "CAD",
      sessionId: "test_complete_flow_" + Date.now(),
      instructions: "Test booking for complete flow verification",
      status: "Test"
    }

    console.log('📊 Step 1: Adding booking to Google Sheets...')
    const { assignedSubcontractor, rowNumber } = await addBookingToSheet(testBooking)
    
    console.log(`✅ Booking added to row ${rowNumber}`)
    
    let emailSent = false
    
    if (assignedSubcontractor) {
      console.log(`🎯 Subcontractor assigned: ${assignedSubcontractor.name}`)
      console.log(`📧 Email: ${assignedSubcontractor.email}`)
      
      console.log('📧 Step 2: Sending subcontractor notification...')
      
      // Prepare email data
      const emailData = {
        customerName: testBooking.customerName,
        customerEmail: testBooking.customerEmail,
        phone: testBooking.phone,
        address: testBooking.address,
        date: testBooking.date,
        time: testBooking.time,
        serviceName: testBooking.serviceName,
        addons: [testBooking.addons],
        totalAmount: testBooking.totalAmount,
        currency: testBooking.currency,
        sessionId: testBooking.sessionId,
        instructions: testBooking.instructions
      }
      
      try {
        await sendSubcontractorNotificationEmail(emailData, assignedSubcontractor)
        console.log('✅ Subcontractor notification sent successfully!')
        emailSent = true
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Complete flow test completed",
      results: {
        googleSheets: {
          success: true,
          rowNumber: rowNumber,
          message: `Booking added to row ${rowNumber}`
        },
        subcontractorAssignment: {
          success: !!assignedSubcontractor,
          subcontractor: assignedSubcontractor ? {
            name: assignedSubcontractor.name,
            email: assignedSubcontractor.email
          } : null,
          message: assignedSubcontractor ? 
            `Assigned to ${assignedSubcontractor.name}` : 
            'No subcontractor assigned - check formulas in columns F, G, H'
        },
        emailNotification: {
          success: emailSent,
          message: emailSent ? 
            'Subcontractor notification sent successfully' : 
            'Email not sent - check RESEND_API_KEY or subcontractor assignment'
        }
      },
      testBooking: testBooking,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Complete flow test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Complete flow test failed",
      troubleshooting: {
        googleSheets: "Check GOOGLE_SHEETS_ID, GOOGLE_SHEETS_CREDENTIALS, and service account permissions",
        email: "Check RESEND_API_KEY and subcontractor email addresses",
        formulas: "Ensure your Google Sheet has formulas in columns F (name), G (email), H (status)"
      }
    }, { status: 500 })
  }
}