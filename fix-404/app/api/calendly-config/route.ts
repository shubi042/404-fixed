import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const eventType = searchParams.get('event_type') || 'booking-confirmation'
  
  // Calendly configuration for different event types
  const calendlyConfig = {
    'booking-confirmation': {
      url: 'https://calendly.com/services-tidymate/booking-confirmation',
      name: 'Booking Confirmation',
      duration: 15,
      description: 'Quick call to confirm your cleaning appointment details',
      questions: [
        'Service type booked',
        'Payment confirmation ID',
        'Property address',
        'Any special instructions'
      ]
    },
    'consultation': {
      url: 'https://calendly.com/services-tidymate/30min',
      name: 'Cleaning Service Consultation',
      duration: 30,
      description: 'Free consultation to discuss your cleaning needs and provide a personalized quote',
      questions: [
        'What type of cleaning service are you interested in?',
        'Property size (bedrooms/square footage)',
        'Preferred date and time for cleaning',
        'Any special requirements or instructions',
        'Property address'
      ]
    },
    'follow-up': {
      url: 'https://calendly.com/services-tidymate/follow-up',
      name: 'Service Follow-up',
      duration: 15,
      description: 'Follow-up call to ensure satisfaction and discuss future services'
    }
  }

  const config = calendlyConfig[eventType as keyof typeof calendlyConfig]
  
  if (!config) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
  }

  return NextResponse.json({
    config,
    embedOptions: {
      hideEventTypeDetails: true,
      hideGdprBanner: true,
      primaryColor: '000000',
      textColor: '4d4d4d',
      backgroundColor: 'ffffff'
    },
    branding: {
      businessName: 'TidyMate',
      primaryColor: '#000000',
      accentColor: '#0066cc'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { eventType, customization } = await request.json()
    
    // In a full implementation, you could save custom Calendly configurations
    // For now, we'll return the updated configuration
    
    return NextResponse.json({ 
      success: true, 
      message: 'Calendly configuration updated',
      eventType,
      customization 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}