import { NextRequest, NextResponse } from "next/server"
import { setupCalendlyWebhooks } from "@/lib/calendly"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { baseUrl } = await request.json()
    
    if (!baseUrl) {
      return NextResponse.json({ error: 'Base URL is required' }, { status: 400 })
    }

    const success = await setupCalendlyWebhooks(baseUrl)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Calendly webhooks configured successfully',
        webhookUrl: `${baseUrl}/api/calendly-webhook`
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to setup webhooks. Check CALENDLY_ACCESS_TOKEN configuration.' 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Webhook setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}