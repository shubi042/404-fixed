"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function BookingPage() {
  const [selectedService, setSelectedService] = useState("")
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
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

  const servicePricing = {
    // Airbnb Cleaning Services
    "airbnb-1bed": {
      name: "Airbnb 1 Bedroom",
      price: 140,
      cleaners: "1 Cleaner",
      category: "Airbnb Cleaning",
    },
    "airbnb-2bed": {
      name: "Airbnb 2 Bedrooms",
      price: 180,
      cleaners: "1 Cleaner",
      category: "Airbnb Cleaning",
    },
    "airbnb-3bed": {
      name: "Airbnb 3 Bedrooms",
      price: 270,
      cleaners: "2 Cleaners",
      category: "Airbnb Cleaning",
    },
    "airbnb-4bed": {
      name: "Airbnb 4+ Bedrooms",
      price: 320,
      cleaners: "2 Cleaners",
      category: "Airbnb Cleaning",
    },

    // Post-Construction Residential
    "postconstruction-res-1bed": {
      name: "Post-Construction Residential 1 Bedroom",
      price: 350,
      cleaners: "1 Cleaner",
      category: "Post-Construction Residential",
    },
    "postconstruction-res-2bed": {
      name: "Post-Construction Residential 2 Bedrooms",
      price: 450,
      cleaners: "1 Cleaner",
      category: "Post-Construction Residential",
    },
    "postconstruction-res-3bed": {
      name: "Post-Construction Residential 3 Bedrooms",
      price: 650,
      cleaners: "2 Cleaners",
      category: "Post-Construction Residential",
    },
    "postconstruction-res-4bed": {
      name: "Post-Construction Residential 4+ Bedrooms",
      price: 800,
      cleaners: "2 Cleaners",
      category: "Post-Construction Residential",
    },
    "postconstruction-res-5bed": {
      name: "Post-Construction Residential 5+ Bedrooms",
      price: 1000,
      cleaners: "3 Cleaners",
      category: "Post-Construction Residential",
    },

    // Post-Construction Non-Residential
    "postconstruction-nonres-small": {
      name: "Post-Construction Non-Residential Small",
      price: 900,
      cleaners: "2 Cleaners",
      category: "Post-Construction Commercial",
    },
    "postconstruction-nonres-medium": {
      name: "Post-Construction Non-Residential Medium",
      price: 1300,
      cleaners: "3 Cleaners",
      category: "Post-Construction Commercial",
    },
    "postconstruction-nonres-large": {
      name: "Post-Construction Non-Residential Large",
      price: 2000,
      cleaners: "4+ Cleaners",
      category: "Post-Construction Commercial",
    },
  }

  const addons = [
    { id: "inside-fridge", name: "Inside Refrigerator", price: 25 },
    { id: "inside-oven", name: "Inside Oven", price: 30 },
    { id: "windows", name: "Window Cleaning", price: 40 },
    { id: "garage", name: "Garage Cleaning", price: 50 },
    { id: "basement", name: "Basement Cleaning", price: 35 },
    { id: "carpet-cleaning", name: "Carpet Deep Clean", price: 60 },
  ]

  const calculateTotal = () => {
    const basePrice = servicePricing[selectedService as keyof typeof servicePricing]?.price || 0
    const addonTotal = selectedAddons.reduce((sum, addonId) => {
      const addon = addons.find((a) => a.id === addonId)
      return sum + (addon?.price || 0)
    }, 0)
    return basePrice + addonTotal
  }

  const handleAddonChange = (addonId: string, checked: boolean) => {
    if (checked) {
      setSelectedAddons([...selectedAddons, addonId])
    } else {
      setSelectedAddons(selectedAddons.filter((id) => id !== addonId))
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePayment = async () => {
    if (
      !selectedService ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.date ||
      !formData.time
    ) {
      alert("Please fill in all required fields before proceeding to payment.")
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent on the server
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: calculateTotal() * 100, // Convert to cents
          currency: "cad",
          service: servicePricing[selectedService as keyof typeof servicePricing],
          addons: selectedAddons.map((id) => addons.find((a) => a.id === id)).filter(Boolean),
          customerInfo: formData,
        }),
      })

      const { clientSecret } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) throw new Error("Stripe failed to load")

      const { error } = await stripe.redirectToCheckout({
        sessionId: clientSecret,
      })

      if (error) {
        console.error("Stripe error:", error)
        alert("Payment failed. Please try again.")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Group services by category for better organization
  const serviceCategories = Object.entries(servicePricing).reduce(
    (acc, [key, service]) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push({ key, ...service })
      return acc
    },
    {} as Record<string, Array<{ key: string; name: string; price: number; cleaners: string; category: string }>>,
  )

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Book Your Professional Cleaning Service</h1>
          <p className="text-xl text-muted-foreground">
            Professional cleaning services in Toronto with transparent flat-rate pricing.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Service Selection & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Selection */}
                <div>
                  <Label htmlFor="service" className="text-base font-semibold mb-4 block">
                    Select Your Service
                  </Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your cleaning service" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(serviceCategories).map(([category, services]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                            {category}
                          </div>
                          {services.map((service) => (
                            <SelectItem key={service.key} value={service.key}>
                              <div className="flex justify-between items-center w-full">
                                <span>{service.name}</span>
                                <div className="text-right ml-4">
                                  <div className="font-semibold">${service.price} CAD</div>
                                  <div className="text-xs text-muted-foreground">{service.cleaners}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {servicePricing[selectedService as keyof typeof servicePricing]?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {servicePricing[selectedService as keyof typeof servicePricing]?.cleaners} • Professional
                            Equipment Included
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ${servicePricing[selectedService as keyof typeof servicePricing]?.price} CAD
                          </p>
                          <p className="text-xs text-muted-foreground">Flat Rate</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add-on Services */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Optional Add-on Services</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {addons.map((addon) => (
                      <div
                        key={addon.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          id={addon.id}
                          checked={selectedAddons.includes(addon.id)}
                          onCheckedChange={(checked) => handleAddonChange(addon.id, checked as boolean)}
                        />
                        <Label htmlFor={addon.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{addon.name}</span>
                            <span className="text-sm font-semibold">+${addon.price}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferred Date & Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Preferred Date</Label>
                    <Input
                      type="date"
                      id="date"
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
                        <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                        <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="Your first name"
                        required
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Your last name"
                        required
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(416) 123-4567"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="address">Property Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Full address where cleaning will take place (Toronto area)"
                      required
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <Label htmlFor="instructions">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Any special requests, access instructions, areas of focus, or specific requirements..."
                    rows={3}
                    value={formData.instructions}
                    onChange={(e) => handleInputChange("instructions", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quote Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Your Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedService ? (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium">
                          {servicePricing[selectedService as keyof typeof servicePricing]?.name}
                        </span>
                        <div className="text-xs text-muted-foreground mt-1">
                          {servicePricing[selectedService as keyof typeof servicePricing]?.cleaners}
                        </div>
                      </div>
                      <span className="font-semibold">
                        ${servicePricing[selectedService as keyof typeof servicePricing]?.price}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Select a service to see your quote</p>
                    </div>
                  )}

                  {selectedAddons.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="font-medium mb-2 text-sm">Add-ons:</p>
                      {selectedAddons.map((addonId) => {
                        const addon = addons.find((a) => a.id === addonId)
                        return addon ? (
                          <div key={addonId} className="flex justify-between text-sm mb-1">
                            <span>{addon.name}</span>
                            <span>+${addon.price}</span>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}

                  {selectedService && (
                    <>
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Estimate</span>
                          <span>${calculateTotal()} CAD</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          All taxes included • Professional equipment provided
                        </p>
                      </div>

                      <Button className="w-full mt-6" size="lg" onClick={handlePayment} disabled={isProcessing}>
                        {isProcessing ? "Processing..." : "Book & Pay Now"}
                      </Button>

                      <div className="text-center mt-2">
                        <p className="text-xs text-muted-foreground">🔒 Secure payment powered by Stripe</p>
                      </div>
                    </>
                  )}

                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Questions? Email us at{" "}
                      <a href="mailto:services@tidymate.ca" className="text-primary hover:underline font-medium">
                        services@tidymate.ca
                      </a>
                    </p>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg mt-4">
                    <h4 className="font-semibold text-sm mb-2">Why Choose TidyMate?</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>✓ Transparent flat-rate pricing</li>
                      <li>✓ Professional trained cleaners</li>
                      <li>✓ All equipment & supplies included</li>
                      <li>✓ Fully insured & bonded</li>
                      <li>✓ 100% satisfaction guarantee</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-primary text-primary-foreground py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">T</span>
              </div>
              <span className="text-2xl font-bold">TidyMate</span>
            </div>
            <p className="text-white/80 mb-4">Professional cleaning services you can trust</p>
            <p className="text-white/60">© 2024 TidyMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
