import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function GET(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
    })

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      service: session.metadata?.service,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email || session.metadata?.customerEmail,
      customerName: session.metadata?.customerName,
      phone: session.metadata?.phone,
      address: session.metadata?.address,
      date: session.metadata?.date,
      time: session.metadata?.time,
      instructions: session.metadata?.instructions,
      addons: session.metadata?.addons,
      paymentStatus: session.payment_status,
    })
  } catch (error) {
    console.error("Error fetching booking details:", error)
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 })
  }
}
