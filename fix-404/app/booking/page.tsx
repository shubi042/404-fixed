"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

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

  const handleSubmit = async () => {
    if (!selectedService || !formData.firstName || !formData.email || !formData.phone) {
      alert("Please fill in required fields.")
      return
    }

    setIsSubmitting(true)

    try {
      const service = services[selectedService as keyof typeof services]
      
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          subject: `Booking Request - ${service.name}`,
          message: `
BOOKING REQUEST

Service: ${service.name} - $${service.price} CAD
Customer: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone}
Address: ${formData.address}
Preferred Date: ${formData.date}
Preferred Time: ${formData.time}
Instructions: ${formData.instructions}

Please contact this customer to arrange payment and scheduling.
          `
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        throw new Error("Failed to submit booking request")
      }

    } catch (error: any) {
      alert("Submission failed. Please try again or email us directly at services@tidymate.ca")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">Booking Request Sent!</h2>
            <p className="text-green-700 mb-4">
              Thank you! We've received your booking request and will contact you within 2 hours to arrange payment and confirm your cleaning appointment.
            </p>
            <p className="text-sm text-green-600">
              Check your email for confirmation. Questions? Call or text us!
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)} 
              className="mt-4"
              variant="outline"
            >
              Submit Another Booking
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Book Your Cleaning</h1>
          <p className="text-muted-foreground">We'll contact you to arrange payment and scheduling.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div>
              <Label>Service *</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose service" />
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

            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Phone *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Where should we clean?"
              />
            </div>

            <div>
              <Label>Preferred Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>

            <div>
              <Label>Preferred Time</Label>
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

            <div>
              <Label>Special Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange("instructions", e.target.value)}
                placeholder="Any special requests..."
              />
            </div>

            {selectedService && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">{services[selectedService as keyof typeof services].name}</span>
                  <span className="font-bold">${services[selectedService as keyof typeof services].price} CAD</span>
                </div>
                <p className="text-sm text-blue-600 mt-2">We'll contact you to arrange secure payment</p>
              </div>
            )}

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !selectedService}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Sending..." : "Request Booking"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll contact you within 2 hours to arrange payment and confirm your appointment.
            </p>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}