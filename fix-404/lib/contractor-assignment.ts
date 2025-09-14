// Contractor assignment logic for TidyMate bookings
import { google } from 'googleapis'

export interface Contractor {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  maxJobsPerDay: number
  availability: string[]
  status: string
}

export interface BookingAssignment {
  bookingId: string
  contractorId: string
  contractorName: string
  contractorEmail: string
  contractorPhone: string
  assignedAt: string
  serviceType: string
  estimatedDuration: number
}

// Google Sheets configuration for contractors
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

async function getContractorsFromSheet(): Promise<Contractor[]> {
  if (!SHEET_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn('Google Sheets not configured - using fallback contractors')
    return getFallbackContractors()
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Read contractors from the "subcontractors" sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'subcontractors!A2:H100', // Assuming headers in row 1, data starts row 2
    })

    const rows = response.data.values || []
    const contractors: Contractor[] = []

    for (const row of rows) {
      if (row.length >= 7) { // Ensure we have enough columns
        const contractor: Contractor = {
          id: row[0] || `contractor-${Date.now()}`,
          name: row[1] || 'Unknown',
          email: row[2] || '',
          phone: row[3] || '',
          specialties: (row[4] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
          availability: (row[5] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
          maxJobsPerDay: parseInt(row[6]) || 2,
          status: (row[7] || 'active').toLowerCase()
        }

        // Only include active contractors with valid email
        if (contractor.status === 'active' && contractor.email && contractor.email.includes('@')) {
          contractors.push(contractor)
        }
      }
    }

    console.log(`✅ Loaded ${contractors.length} active contractors from Google Sheets`)
    return contractors

  } catch (error) {
    console.error('❌ Failed to load contractors from Google Sheets:', error)
    console.log('⚠️ Using fallback contractor list')
    return getFallbackContractors()
  }
}

function getFallbackContractors(): Contractor[] {
  return [
    {
      id: "contractor-001",
      name: "Maria Santos",
      email: "maria@tidymate.ca",
      phone: "(416) 555-0101",
      specialties: ["airbnb", "residential", "deep-clean"],
      maxJobsPerDay: 3,
      availability: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      status: "active"
    },
    {
      id: "contractor-002", 
      name: "David Chen",
      email: "david@tidymate.ca",
      phone: "(416) 555-0102",
      specialties: ["post-construction", "commercial", "heavy-duty"],
      maxJobsPerDay: 2,
      availability: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
      status: "active"
    },
    {
      id: "contractor-003",
      name: "Sarah Johnson", 
      email: "sarah@tidymate.ca",
      phone: "(416) 555-0103",
      specialties: ["airbnb", "residential", "move-out"],
      maxJobsPerDay: 4,
      availability: ["monday", "wednesday", "thursday", "friday", "saturday"],
      status: "active"
    },
    {
      id: "contractor-004",
      name: "Ahmed Hassan",
      email: "ahmed@tidymate.ca", 
      phone: "(416) 555-0104",
      specialties: ["post-construction", "commercial", "industrial"],
      maxJobsPerDay: 2,
      availability: ["monday", "tuesday", "thursday", "friday", "saturday"],
      status: "active"
    }
  ]
}

export async function assignContractor(serviceType: string, preferredDate: string, cleanersNeeded: number): Promise<BookingAssignment | null> {
  try {
    // Get contractors from Google Sheets
    const contractors = await getContractorsFromSheet()
    
    if (contractors.length === 0) {
      console.warn("No active contractors available")
      return null
    }

    // Determine service category for contractor matching
    let serviceCategory = "residential"
    if (serviceType.toLowerCase().includes("post-construction")) {
      serviceCategory = "post-construction"
    } else if (serviceType.toLowerCase().includes("commercial")) {
      serviceCategory = "commercial"
    } else if (serviceType.toLowerCase().includes("airbnb") || serviceType.toLowerCase().includes("residential")) {
      serviceCategory = "airbnb"
    }

    // Get day of week from preferred date
    const dayOfWeek = new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // Find available contractors from Google Sheets
    const availableContractors = contractors.filter(contractor => {
      // Check if contractor specializes in this service type
      const hasSpecialty = contractor.specialties.some(specialty => 
        specialty.includes(serviceCategory) || serviceCategory.includes(specialty)
      )
      
      // Check if contractor is available on the requested day
      const isAvailable = contractor.availability.includes(dayOfWeek)
      
      // Only active contractors
      const isActive = contractor.status === 'active'
      
      return hasSpecialty && isAvailable && isActive
    })

    if (availableContractors.length === 0) {
      console.warn(`No contractors available for ${serviceCategory} on ${dayOfWeek}`)
      return null
    }

    // Select contractor with least current workload (simplified - would check actual bookings in production)
    const selectedContractor = availableContractors[0]

    // Calculate estimated duration based on service type
    let estimatedDuration = 2 // Default 2 hours
    if (serviceType.includes("1 Bedroom")) estimatedDuration = 2
    else if (serviceType.includes("2 Bedroom")) estimatedDuration = 3
    else if (serviceType.includes("3 Bedroom")) estimatedDuration = 4
    else if (serviceType.includes("4+ Bedroom")) estimatedDuration = 5
    else if (serviceType.includes("Post-Construction")) estimatedDuration = 6

    const assignment: BookingAssignment = {
      bookingId: `booking-${Date.now()}`,
      contractorId: selectedContractor.id,
      contractorName: selectedContractor.name,
      contractorEmail: selectedContractor.email,
      contractorPhone: selectedContractor.phone,
      assignedAt: new Date().toISOString(),
      serviceType: serviceType,
      estimatedDuration: estimatedDuration
    }

    console.log(`✅ Contractor assigned from Google Sheets: ${selectedContractor.name} for ${serviceType}`)
    return assignment

  } catch (error) {
    console.error("Error assigning contractor:", error)
    return null
  }
}

export function getContractorList(): Contractor[] {
  return contractors
}

export function getContractorById(contractorId: string): Contractor | null {
  return contractors.find(c => c.id === contractorId) || null
}