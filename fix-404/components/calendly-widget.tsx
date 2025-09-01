"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CalendlyWidgetProps {
  url: string
  prefill?: {
    name?: string
    email?: string
    customAnswers?: Record<string, string>
  }
  embedType?: "inline" | "popup"
  height?: number
  className?: string
  onEventScheduled?: (event: any) => void
}

export function CalendlyWidget({
  url,
  prefill,
  embedType = "inline",
  height = 700,
  className = "",
  onEventScheduled
}: CalendlyWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.head.appendChild(script)

    // Listen for Calendly events
    const handleCalendlyEvent = (e: any) => {
      if (e.data.event && e.data.event.indexOf('calendly') === 0) {
        if (e.data.event === 'calendly.event_scheduled') {
          onEventScheduled?.(e.data.payload)
        }
      }
    }

    window.addEventListener('message', handleCalendlyEvent)

    return () => {
      window.removeEventListener('message', handleCalendlyEvent)
      document.head.removeChild(script)
    }
  }, [onEventScheduled])

  const buildCalendlyUrl = () => {
    const params = new URLSearchParams()
    
    // Add embed parameters
    if (typeof window !== 'undefined') {
      params.append('embed_domain', window.location.hostname)
    }
    params.append('embed_type', embedType === 'popup' ? 'PopupWidget' : 'Inline')
    params.append('hide_event_type_details', '1')
    params.append('hide_gdpr_banner', '1')
    params.append('primary_color', '000000')
    params.append('text_color', '4d4d4d')
    
    // Add prefill data
    if (prefill?.name) {
      params.append('name', prefill.name)
    }
    if (prefill?.email) {
      params.append('email', prefill.email)
    }
    
    // Add custom answers
    if (prefill?.customAnswers) {
      Object.entries(prefill.customAnswers).forEach(([key, value]) => {
        params.append(`a${key}`, value)
      })
    }
    
    return `${url}?${params.toString()}`
  }

  const openPopup = () => {
    if (typeof window !== 'undefined' && (window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({
        url: buildCalendlyUrl(),
        prefill: prefill || {},
        utm: {
          utmCampaign: 'TidyMate Website',
          utmSource: 'booking_flow',
          utmMedium: 'website'
        }
      })
    }
  }

  if (embedType === "popup") {
    return (
      <Button 
        onClick={openPopup}
        className={`w-full ${className}`}
        size="lg"
      >
        📅 Schedule Your Cleaning Time
      </Button>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📅 Schedule Your Appointment
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading calendar...</p>
              </div>
            </div>
          )}
          <iframe
            src={buildCalendlyUrl()}
            width="100%"
            height={height}
            frameBorder="0"
            scrolling="no"
            className="rounded-lg"
            title="Schedule appointment with TidyMate"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for using Calendly programmatically
export function useCalendly() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const openPopup = (url: string, options?: any) => {
    if (isLoaded && (window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({
        url,
        ...options
      })
    }
  }

  const closePopup = () => {
    if (isLoaded && (window as any).Calendly) {
      (window as any).Calendly.closePopupWidget()
    }
  }

  return { isLoaded, openPopup, closePopup }
}