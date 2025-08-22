"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConsultationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Schedule Your Free Consultation</h1>
          <p className="text-xl text-muted-foreground">
            Discuss your cleaning needs with our team and get a personalized quote.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Book Your Consultation</CardTitle>
            <p className="text-muted-foreground">
              Our team will contact you to discuss your specific cleaning needs and provide a customized quote.
            </p>
          </CardHeader>
          <CardContent>
            {/* Calendly Widget */}
            <div className="w-full">
              <iframe
                src="https://calendly.com/YOUR-USERNAME/cleaning-consultation?embed_domain=yourdomain.com&embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1&primary_color=000000&text_color=4d4d4d"
                width="100%"
                height="700"
                frameBorder="0"
                scrolling="no"
                className="rounded-lg"
                title="Schedule a consultation with TidyMate"
              />
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll call you at your scheduled time</li>
                <li>• Discuss your specific cleaning requirements</li>
                <li>• Provide a detailed, customized quote</li>
                <li>• Schedule your cleaning service if you decide to proceed</li>
                <li>• Send booking confirmation via email</li>
              </ul>
            </div>
          </CardContent>
        </Card>
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