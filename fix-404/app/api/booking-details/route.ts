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
    let sessionId: string | null = searchParams.get("session_id")
    const paymentIntentId: string | null = searchParams.get("payment_intent")

    // If only payment_intent is provided, resolve the related Checkout Session
    if (!sessionId && paymentIntentId) {
      const sessionsList = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
      sessionId = sessionsList.data?.[0]?.id || null
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID or payment_intent required" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })

    const pi: any = session.payment_intent || {}
    const meta = {
      ...(session.metadata || {}),
      ...(pi?.metadata || {}),
    }

    return NextResponse.json({
      service: meta.service,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email || meta.customerEmail,
      customerName: meta.customerName,
      phone: meta.phone,
      address: meta.address,
      date: meta.date,
      time: meta.time,
      instructions: meta.instructions,
      addons: meta.addons,
      paymentStatus: session.payment_status,
    })
  } catch (error) {
    console.error("Error fetching booking details:", error)
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 })
  }
}
