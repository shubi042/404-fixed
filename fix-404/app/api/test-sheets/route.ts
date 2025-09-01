import { NextResponse } from "next/server"
import { addBookingToSheet } from "@/lib/google-sheets"

export async function GET() {
  try {
    // Test booking data
    const testBooking = {
      timestamp: new Date().toISOString(),
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      phone: "(416) 123-4567",
      address: "123 Test Street, Toronto, ON",
      date: "2024-01-15",
      time: "Morning (8AM - 12PM)",
      serviceName: "Airbnb 2 Bedrooms",
      addons: "Window Cleaning",
      totalAmount: 180,
      currency: "CAD",
      sessionId: `test_${Date.now()}`,
      instructions: "Test booking for system verification",
      status: "Test"
    }

    console.log("🧪 Testing Google Sheets integration...")
    
    const result = await addBookingToSheet(testBooking)
    
    return NextResponse.json({
      success: true,
      message: "Google Sheets integration test successful",
      result: {
        rowNumber: result.rowNumber,
        assignedSubcontractor: result.assignedSubcontractor,
      },
      testData: testBooking
    })

  } catch (error: any) {
    console.error("Google Sheets test failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        message: "Google Sheets integration test failed"
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({ 
    message: "Use GET method to test Google Sheets integration" 
  })
}