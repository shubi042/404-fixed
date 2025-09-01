import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL || "services@tidymate.ca"
const fromEmail = process.env.FROM_EMAIL || "noreply@tidymate.ca"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET
    
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get('calendly-webhook-signature')
      // In production, implement proper signature verification
      // For now, we'll proceed without verification for initial setup
    }

    const payload = await request.json()
    
    // Handle different Calendly webhook events
    switch (payload.event) {
      case 'invitee.created':
        await handleInviteeCreated(payload.payload)
        break
      case 'invitee.canceled':
        await handleInviteeCanceled(payload.payload)
        break
      default:
        console.log(`Unhandled Calendly webhook event: ${payload.event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleInviteeCreated(payload: any) {
  try {
    const invitee = payload.invitee
    const event = payload.event
    
    if (!resendApiKey) {
      console.warn("Email not sent: RESEND_API_KEY is not configured.")
      return
    }

    const resend = new Resend(resendApiKey)
    
    // Send confirmation to business owner
    await resend.emails.send({
      from: fromEmail,
      to: ownerEmail,
      subject: `✅ New Calendly Booking: ${invitee.name}`,
      html: `
        <h2>🎉 New Calendly Appointment Booked</h2>
        
        <div style="background: #e6f7e6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3>📅 Appointment Details:</h3>
          <p><strong>Customer:</strong> ${invitee.name}</p>
          <p><strong>Email:</strong> ${invitee.email}</p>
          <p><strong>Event:</strong> ${event.name}</p>
          <p><strong>Date & Time:</strong> ${new Date(event.start_time).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${event.duration} minutes</p>
        </div>
        
        <h3>📋 Next Steps:</h3>
        <ol>
          <li>Review appointment details in your Calendly dashboard</li>
          <li>Prepare for the ${event.name.toLowerCase()}</li>
          <li>Send any pre-appointment materials if needed</li>
        </ol>
        
        <p><strong>Calendly Event URL:</strong> <a href="${event.location?.join_url || '#'}">${event.location?.join_url || 'Check Calendly dashboard'}</a></p>
        
        <hr style="margin: 20px 0;"/>
        <p><em>This notification was automatically generated from your Calendly integration.</em></p>
      `
    })

    // Send confirmation to customer
    await resend.emails.send({
      from: fromEmail,
      to: invitee.email,
      subject: `✅ Appointment Confirmed - ${event.name}`,
      html: `
        <h2>Hi ${invitee.name}! 👋</h2>
        <p>Your appointment with TidyMate has been confirmed!</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <h3>📅 Your Appointment Details</h3>
          <p><strong>Service:</strong> ${event.name}</p>
          <p><strong>Date & Time:</strong> ${new Date(event.start_time).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${event.duration} minutes</p>
        </div>
        
        <div style="background: #e6f7e6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>✅ What's Confirmed:</h3>
          <ul>
            <li>Your appointment is locked in our calendar</li>
            <li>You'll receive a calendar invite shortly</li>
            <li>Our team is prepared to provide excellent service</li>
          </ul>
        </div>
        
        <h3>📞 Contact Information:</h3>
        <p>If you need to make changes or have questions:</p>
        <ul>
          <li>Email: services@tidymate.ca</li>
          <li>Or reply directly to this email</li>
        </ul>
        
        <p style="margin-top: 20px;"><em>We look forward to serving you!</em></p>
        <p><em>- The TidyMate Team</em></p>
      `
    })

    console.log(`✅ Calendly booking confirmed for ${invitee.name}`)
  } catch (error) {
    console.error('Error handling invitee.created:', error)
  }
}

async function handleInviteeCanceled(payload: any) {
  try {
    const invitee = payload.invitee
    const event = payload.event
    
    if (!resendApiKey) {
      console.warn("Email not sent: RESEND_API_KEY is not configured.")
      return
    }

    const resend = new Resend(resendApiKey)
    
    // Notify business owner of cancellation
    await resend.emails.send({
      from: fromEmail,
      to: ownerEmail,
      subject: `❌ Calendly Appointment Canceled: ${invitee.name}`,
      html: `
        <h2>📅 Appointment Cancellation Notice</h2>
        
        <div style="background: #fee; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3>❌ Canceled Appointment:</h3>
          <p><strong>Customer:</strong> ${invitee.name}</p>
          <p><strong>Email:</strong> ${invitee.email}</p>
          <p><strong>Event:</strong> ${event.name}</p>
          <p><strong>Was scheduled for:</strong> ${new Date(event.start_time).toLocaleString()}</p>
        </div>
        
        <p><strong>Action Required:</strong> You may want to follow up with the customer to reschedule or address any concerns.</p>
        
        <hr style="margin: 20px 0;"/>
        <p><em>This notification was automatically generated from your Calendly integration.</em></p>
      `
    })

    console.log(`❌ Calendly booking canceled for ${invitee.name}`)
  } catch (error) {
    console.error('Error handling invitee.canceled:', error)
  }
}