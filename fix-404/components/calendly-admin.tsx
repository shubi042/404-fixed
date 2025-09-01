"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendlyEvent, CalendlyEventType, getUpcomingBookings, getTidyMateEventTypes } from "@/lib/calendly"

export function CalendlyAdminDashboard() {
  const [eventTypes, setEventTypes] = useState<CalendlyEventType[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendlyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCalendlyData()
  }, [])

  const loadCalendlyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [types, events] = await Promise.all([
        getTidyMateEventTypes(),
        getUpcomingBookings(30)
      ])
      
      setEventTypes(types)
      setUpcomingEvents(events)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const setupWebhooks = async () => {
    try {
      const response = await fetch('/api/calendly-webhook/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: window.location.origin
        })
      })
      
      if (response.ok) {
        alert('✅ Calendly webhooks configured successfully!')
      } else {
        const error = await response.text()
        alert(`❌ Webhook setup failed: ${error}`)
      }
    } catch (error) {
      alert(`❌ Webhook setup error: ${error}`)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading Calendly data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">⚠️ Calendly Integration Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            This usually means the CALENDLY_ACCESS_TOKEN environment variable is not configured.
          </p>
          <Button onClick={loadCalendlyData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Event Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Calendly Event Types
            <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">{eventTypes.length} active</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventTypes.map((eventType) => (
              <div key={eventType.uri} className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">{eventType.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {eventType.duration} minutes
                </p>
                <div className="flex gap-2">
                  <span 
                    className={`text-xs px-2 py-1 rounded ${
                      eventType.active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                    style={{ backgroundColor: eventType.active ? undefined : eventType.color }}
                  >
                    {eventType.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <a 
                  href={eventType.scheduling_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-2 block"
                >
                  View on Calendly →
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗓️ Upcoming Appointments
            <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded">{upcomingEvents.length} scheduled</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No upcoming appointments scheduled
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 10).map((event) => (
                <div key={event.uri} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.start_time).toLocaleDateString()} at{" "}
                        {new Date(event.start_time).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.invitees_counter.active} attendee(s)
                      </p>
                    </div>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded border">
                      {Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60))} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Status & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Integration Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">✅ Active Integrations</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Consultation booking (30min)</li>
                <li>• Booking confirmation (15min)</li>
                <li>• Email notifications</li>
                <li>• Success page integration</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">🔄 Available Actions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={setupWebhooks}
                  size="sm"
                  className="w-full"
                >
                  Setup Webhooks
                </Button>
                <Button 
                  onClick={loadCalendlyData}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-900 mb-2">📋 Setup Checklist</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>✅ Calendly account: services-tidymate</li>
              <li>✅ Event types configured</li>
              <li>✅ Website integration active</li>
              <li>⚠️ API token needed for advanced features</li>
              <li>⚠️ Webhooks need manual setup</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}