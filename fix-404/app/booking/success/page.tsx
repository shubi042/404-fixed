"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      // Fetch booking details from Stripe session
      fetch(`/api/booking-details?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          setBookingDetails(data)
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
            <p className="text-muted-foreground mt-2">
              Thank you for choosing TidyMate. Your payment has been processed successfully.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-primary mr-2">1.</span>
                  <span>You'll receive a confirmation email at your provided email address within 5 minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">2.</span>
                  <span>Our team will contact you within 24 hours to confirm your appointment details</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">3.</span>
                  <span>Our professional cleaners will arrive at your scheduled time with all equipment</span>
                </li>
              </ul>
            </div>

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

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Questions about your booking? Contact us at{" "}
                <a href="mailto:services@tidymate.ca" className="text-primary hover:underline font-medium">
                  services@tidymate.ca
                </a>
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
