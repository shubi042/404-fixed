import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Cleaning Services</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Professional cleaning solutions tailored to your needs. Choose from hourly services or comprehensive
            packages.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Residential Cleaning */}
            <Card className="h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <CardTitle className="text-2xl">Residential Cleaning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Complete home cleaning services including kitchens, bathrooms, bedrooms, and living areas.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Deep cleaning of all rooms</li>
                  <li>• Kitchen and bathroom sanitization</li>
                  <li>• Dusting and vacuuming</li>
                  <li>• Floor mopping and polishing</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Office Cleaning */}
            <Card className="h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🏢</span>
                </div>
                <CardTitle className="text-2xl">Office Cleaning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Professional office cleaning to maintain a productive and healthy work environment.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Desk and workspace cleaning</li>
                  <li>• Conference room maintenance</li>
                  <li>• Restroom sanitization</li>
                  <li>• Common area cleaning</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Deep Cleaning */}
            <Card className="h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <CardTitle className="text-2xl">Deep Cleaning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Intensive cleaning service for move-ins, move-outs, or seasonal deep cleans.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Inside appliance cleaning</li>
                  <li>• Baseboards and window sills</li>
                  <li>• Light fixture cleaning</li>
                  <li>• Cabinet interior cleaning</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Post-Construction */}
            <Card className="h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🔨</span>
                </div>
                <CardTitle className="text-2xl">Post-Construction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Specialized cleaning after construction or renovation projects to remove dust and debris.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Construction dust removal</li>
                  <li>• Paint and adhesive cleanup</li>
                  <li>• Window and surface cleaning</li>
                  <li>• Final inspection cleaning</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Move-In/Move-Out */}
            <Card className="h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📦</span>
                </div>
                <CardTitle className="text-2xl">Move-In/Move-Out</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Comprehensive cleaning for property transitions, ensuring spaces are move-in ready.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Complete property cleaning</li>
                  <li>• Appliance deep cleaning</li>
                  <li>• Carpet and floor treatment</li>
                  <li>• Final walkthrough</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recurring Services */}
            <Card className="h-full">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🔄</span>
                </div>
                <CardTitle className="text-2xl">Recurring Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Regular cleaning schedules to maintain your space consistently clean and organized.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Weekly, bi-weekly, or monthly</li>
                  <li>• Customized cleaning plans</li>
                  <li>• Consistent team assignment</li>
                  <li>• Discounted rates</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Options */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Flexible Pricing Options</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the pricing structure that works best for your needs and budget.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-8">
              <CardHeader>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⏱️</span>
                </div>
                <CardTitle className="text-2xl mb-2">Hourly Rate</CardTitle>
                <p className="text-muted-foreground">Perfect for smaller jobs or specific tasks</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">$35</span>
                  <span className="text-muted-foreground">/hour</span>
                </div>
                <ul className="text-left space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Minimum 2-hour booking</li>
                  <li>• Flexible scheduling</li>
                  <li>• Pay for time used</li>
                  <li>• Perfect for touch-ups</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Book Hourly</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-primary border-2">
              <CardHeader>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📋</span>
                </div>
                <CardTitle className="text-2xl mb-2">Flat Rate Packages</CardTitle>
                <p className="text-muted-foreground">Complete cleaning packages at fixed prices</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">From $120</span>
                  <span className="text-muted-foreground">/service</span>
                </div>
                <ul className="text-left space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Comprehensive cleaning</li>
                  <li>• Predictable pricing</li>
                  <li>• No hourly surprises</li>
                  <li>• Best value for full cleans</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/booking">Get Package Quote</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
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
