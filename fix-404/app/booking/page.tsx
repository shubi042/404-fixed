"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function BookingPage() {
  const [selectedService, setSelectedService] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const services = {
    "airbnb-1bed": { name: "Airbnb 1 Bedroom", price: 110 },
    "airbnb-2bed": { name: "Airbnb 2 Bedrooms", price: 140 },
    "postconstruction": { name: "Post Construction", price: 350 }
  }

  const handlePayment = async () => {
    if (!selectedService || !formData.firstName || !formData.email || !formData.phone) {
      alert("Please fill in required fields.")
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
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName || "Customer",
            email: formData.email,
            phone: formData.phone
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
      alert("Payment failed: " + (error?.message || "Please try again"))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Book Cleaning</h1>
        </div>

        <div className="space-y-4">
          
          <div>
            <Label>Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Choose service" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(services).map(([key, service]) => (
                  <SelectItem key={key} value={key}>
                    {service.name} - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>First Name</Label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Last Name</Label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          {selectedService && (
            <div className="p-4 bg-gray-100 rounded">
              <div className="flex justify-between">
                <span>{services[selectedService as keyof typeof services].name}</span>
                <span>${services[selectedService as keyof typeof services].price} CAD</span>
              </div>
            </div>
          )}

          <Button 
            onClick={handlePayment} 
            disabled={isProcessing || !selectedService}
            className="w-full"
            size="lg"
          >
            {isProcessing ? "Processing..." : "Pay Now"}
          </Button>

        </div>
      </div>
    </div>
  )
}