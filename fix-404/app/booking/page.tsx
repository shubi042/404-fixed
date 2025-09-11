"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function BookingPage() {
  const [selectedService, setSelectedService] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    date: "",
    time: "",
    instructions: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const services = {
    "airbnb-1bed": { name: "Airbnb 1 Bedroom", price: 110 },
    "airbnb-2bed": { name: "Airbnb 2 Bedrooms", price: 140 },
    "airbnb-3bed": { name: "Airbnb 3 Bedrooms", price: 200 },
    "postconstruction-small": { name: "Post Construction Small", price: 350 },
    "postconstruction-medium": { name: "Post Construction Medium", price: 500 },
    "postconstruction-large": { name: "Post Construction Large", price: 750 },
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePayment = async () => {
    if (!selectedService || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address) {
      alert("Please fill in all required fields.")
      return
    }

    setIsProcessing(true)

    try {
      const service = services[selectedService as keyof typeof services]
      
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: service.price * 100,
          currency: "cad",
          service: { name: service.name, price: service.price },
          addons: [],
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            date: formData.date || "TBD",
            time: formData.time || "TBD",
            instructions: formData.instructions || ""
          }
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Payment failed")
      }

      const stripe = await stripePromise
      if (!stripe) throw new Error("Stripe failed to load")

      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
      if (error) throw error

    } catch (error: any) {
      console.error("Payment error:", error)
      alert(error?.message || "Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Book Your Cleaning Service</h1>
          <p className="text-muted-foreground">Simple, transparent pricing for professional cleaning.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Service Selection */}
            <div>
              <Label htmlFor="service">Select Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your service" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(services).map(([key, service]) => (
                    <SelectItem key={key} value={key}>
                      {service.name} - ${service.price} CAD
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Special Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange("instructions", e.target.value)}
                placeholder="Any special requests..."
              />
            </div>

            {/* Quote Display */}
            {selectedService && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{services[selectedService as keyof typeof services].name}</span>
                  <span className="font-bold">${services[selectedService as keyof typeof services].price} CAD</span>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing || !selectedService}
              className="w-full"
              size="lg"
            >
              {isProcessing ? "Processing..." : "Book & Pay Now"}
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}