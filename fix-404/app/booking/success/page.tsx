"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendlyWidget, useCalendly } from "@/components/calendly-widget"
import Link from "next/link"

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCalendly, setShowCalendly] = useState(false)
  const { openPopup } = useCalendly()

  useEffect(() => {
    if (sessionId) {
      // Fetch booking details from Stripe session
      fetch(`/api/booking-details?session_id=${sessionId}`)
        .then((res) => res.json())
        .then(async (data) => {
          setBookingDetails(data)
          // Fallback notify owner if payment succeeded
          if (data?.paymentStatus === "paid") {
            try {
              await fetch(`/api/notify-owner?session_id=${sessionId}`, { method: "POST" })
              
              // Automatically send Calendly link to customer
              if (data.customerEmail && data.customerName) {
                try {
                  await fetch('/api/send-calendly-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customerEmail: data.customerEmail,
                      customerName: data.customerName,
                      serviceName: data.service,
                      bookingDate: data.date,
                      bookingTime: data.time
                    })
                  })
                } catch (e) {
                  console.error("Calendly link send failed:", e)
                }
              }
              
              // SMTP fallback via Netlify Function (best effort)
              try {
                const base = window.location.origin
                await fetch(`${base}/.netlify/functions/send-email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "booking", sessionId }),
                })
              } catch (e) {
                console.error("SMTP fallback call failed:", e)
              }
            } catch (e) {
              console.error("Fallback owner notification failed:", e)
            }
          }
          setLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching booking details:", error)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p>Loading your booking confirmation...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Thank you for choosing TidyMate. Your payment has been processed successfully.
            </p>
          </CardHeader>

          <CardContent className="space-y-5 sm:space-y-6">
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
              <h3 className="font-semibold mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-primary mr-2">1.</span>
                  <span>You'll receive a confirmation email at your provided email address within 5 minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">2.</span>
                  <span>📅 Schedule your exact time slot using the button below or the link in your email</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">3.</span>
                  <span>We'll contact you within 24 hours to confirm your appointment details and availability</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">4.</span>
                  <span>Our professional cleaners will arrive at your scheduled time with all equipment</span>
                </li>
              </ul>
            </div>

            {/* Immediate Calendly Scheduling */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">🎯 Schedule Your Time Slot Now</h3>
              <p className="text-blue-800 text-sm mb-4">
                Skip the email wait! Schedule your cleaning appointment right now by choosing your preferred time slot.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => setShowCalendly(true)}
                  className="flex-1"
                  size="lg"
                >
                  📅 Choose Your Time Slot
                </Button>
                <Button 
                  onClick={() => openPopup(
                    'https://calendly.com/services-tidymate/booking-confirmation',
                    {
                      prefill: {
                        name: bookingDetails?.customerName,
                        email: bookingDetails?.customerEmail
                      },
                      utm: {
                        utmCampaign: 'TidyMate Booking Success',
                        utmSource: 'success_page',
                        utmMedium: 'popup'
                      }
                    }
                  )}
                  variant="outline"
                  className="flex-1"
                >
                  🚀 Quick Schedule (Popup)
                </Button>
              </div>
            </div>

            {/* Inline Calendly Widget */}
            {showCalendly && (
              <div className="mt-6">
                <CalendlyWidget
                  url="https://calendly.com/services-tidymate/booking-confirmation"
                  prefill={{
                    name: bookingDetails?.customerName,
                    email: bookingDetails?.customerEmail,
                    customAnswers: {
                      '1': bookingDetails?.service || '',
                      '2': `Payment ID: ${sessionId}`,
                      '3': bookingDetails?.address || ''
                    }
                  }}
                  onEventScheduled={(event) => {
                    console.log('Event scheduled:', event)
                    // You could trigger additional actions here
                  }}
                />
                <div className="text-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCalendly(false)}
                  >
                    Hide Calendar
                  </Button>
                </div>
              </div>
            )}

            {bookingDetails && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium">{bookingDetails.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-medium">${(bookingDetails.amount / 100).toFixed(2)} CAD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment ID:</span>
                    <span className="font-mono text-xs">{sessionId}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center space-y-3 sm:space-y-4">
              <p className="text-sm text-muted-foreground">
                A confirmation has been sent to your email along with a Calendly link to choose your exact time slot. Our team also receives a notification with your booking details.
              </p>

              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/">Return Home</Link>
                </Button>
                <Button asChild>
                  <Link href="/booking">Book Another Service</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
