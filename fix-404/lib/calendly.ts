// Calendly API utilities for TidyMate integration

const CALENDLY_API_BASE = 'https://api.calendly.com'
const CALENDLY_ACCESS_TOKEN = process.env.CALENDLY_ACCESS_TOKEN

export interface CalendlyUser {
  uri: string
  name: string
  slug: string
  email: string
  scheduling_url: string
  timezone: string
}

export interface CalendlyEventType {
  uri: string
  name: string
  slug: string
  duration: number
  kind: string
  scheduling_url: string
  description_plain?: string
  description_html?: string
  color: string
  active: boolean
}

export interface CalendlyEvent {
  uri: string
  name: string
  start_time: string
  end_time: string
  event_type: string
  location?: {
    type: string
    location?: string
    join_url?: string
  }
  invitees_counter: {
    total: number
    active: number
    limit: number
  }
  created_at: string
  updated_at: string
}

export interface CalendlyInvitee {
  uri: string
  name: string
  email: string
  text_reminder_number?: string
  timezone: string
  event: string
  created_at: string
  updated_at: string
  canceled: boolean
  cancellation?: {
    canceled_by: string
    reason: string
    canceler_type: string
  }
  payment?: {
    external_id: string
    provider: string
    amount: number
    currency: string
    terms: string
  }
  questions_and_answers?: Array<{
    question: string
    answer: string
  }>
}

class CalendlyAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${CALENDLY_API_BASE}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Calendly API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async getCurrentUser(): Promise<CalendlyUser> {
    const data = await this.makeRequest('/users/me')
    return data.resource
  }

  async getEventTypes(userUri: string): Promise<CalendlyEventType[]> {
    const data = await this.makeRequest(`/event_types?user=${encodeURIComponent(userUri)}`)
    return data.collection
  }

  async getScheduledEvents(userUri: string, options: {
    minStartTime?: string
    maxStartTime?: string
    status?: 'active' | 'canceled'
  } = {}): Promise<CalendlyEvent[]> {
    const params = new URLSearchParams({
      user: userUri,
      ...options
    })
    
    const data = await this.makeRequest(`/scheduled_events?${params.toString()}`)
    return data.collection
  }

  async getEventInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
    const data = await this.makeRequest(`/scheduled_events/${encodeURIComponent(eventUri)}/invitees`)
    return data.collection
  }

  async getInvitee(inviteeUri: string): Promise<CalendlyInvitee> {
    const data = await this.makeRequest(`/scheduled_events/invitees/${encodeURIComponent(inviteeUri)}`)
    return data.resource
  }

  // Webhook management
  async createWebhook(url: string, events: string[], userUri: string) {
    return this.makeRequest('/webhook_subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        url,
        events,
        organization: userUri.replace('/users/', '/organizations/'),
        user: userUri,
        scope: 'user'
      })
    })
  }

  async listWebhooks(organizationUri: string) {
    return this.makeRequest(`/webhook_subscriptions?organization=${encodeURIComponent(organizationUri)}`)
  }

  async deleteWebhook(webhookUri: string) {
    return this.makeRequest(`/webhook_subscriptions/${encodeURIComponent(webhookUri)}`, {
      method: 'DELETE'
    })
  }
}

// Utility functions for TidyMate-specific Calendly operations
export async function getCalendlyClient(): Promise<CalendlyAPI | null> {
  if (!CALENDLY_ACCESS_TOKEN) {
    console.warn('CALENDLY_ACCESS_TOKEN not configured')
    return null
  }
  return new CalendlyAPI(CALENDLY_ACCESS_TOKEN)
}

export async function getTidyMateEventTypes(): Promise<CalendlyEventType[]> {
  const client = await getCalendlyClient()
  if (!client) return []

  try {
    const user = await client.getCurrentUser()
    const eventTypes = await client.getEventTypes(user.uri)
    return eventTypes.filter(et => et.active)
  } catch (error) {
    console.error('Error fetching Calendly event types:', error)
    return []
  }
}

export async function getUpcomingBookings(days: number = 30): Promise<CalendlyEvent[]> {
  const client = await getCalendlyClient()
  if (!client) return []

  try {
    const user = await client.getCurrentUser()
    const minStartTime = new Date().toISOString()
    const maxStartTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    
    return await client.getScheduledEvents(user.uri, {
      minStartTime,
      maxStartTime,
      status: 'active'
    })
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error)
    return []
  }
}

export async function setupCalendlyWebhooks(baseUrl: string): Promise<boolean> {
  const client = await getCalendlyClient()
  if (!client) return false

  try {
    const user = await client.getCurrentUser()
    const webhookUrl = `${baseUrl}/api/calendly-webhook`
    
    await client.createWebhook(webhookUrl, [
      'invitee.created',
      'invitee.canceled'
    ], user.uri)
    
    console.log('✅ Calendly webhooks configured successfully')
    return true
  } catch (error) {
    console.error('Error setting up Calendly webhooks:', error)
    return false
  }
}

// Embed URL builders
export function buildCalendlyEmbedUrl(
  eventSlug: string,
  options: {
    prefill?: {
      name?: string
      email?: string
      customAnswers?: Record<string, string>
    }
    embedType?: 'inline' | 'popup'
    hideDetails?: boolean
    primaryColor?: string
    textColor?: string
  } = {}
): string {
  const baseUrl = `https://calendly.com/services-tidymate/${eventSlug}`
  const params = new URLSearchParams()
  
  // Embed parameters
  if (typeof window !== 'undefined') {
    params.append('embed_domain', window.location.hostname)
  }
  params.append('embed_type', options.embedType === 'popup' ? 'PopupWidget' : 'Inline')
  params.append('hide_event_type_details', options.hideDetails ? '1' : '0')
  params.append('hide_gdpr_banner', '1')
  params.append('primary_color', options.primaryColor || '000000')
  params.append('text_color', options.textColor || '4d4d4d')
  
  // Prefill data
  if (options.prefill?.name) {
    params.append('name', options.prefill.name)
  }
  if (options.prefill?.email) {
    params.append('email', options.prefill.email)
  }
  
  // Custom answers (for custom questions)
  if (options.prefill?.customAnswers) {
    Object.entries(options.prefill.customAnswers).forEach(([key, value]) => {
      params.append(`a${key}`, value)
    })
  }
  
  return `${baseUrl}?${params.toString()}`
}

export const CALENDLY_EVENTS = {
  CONSULTATION: '30min',
  BOOKING_CONFIRMATION: 'booking-confirmation',
  FOLLOW_UP: 'follow-up'
} as const