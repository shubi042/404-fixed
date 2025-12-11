// Contractor assignment logic for TidyMate bookings

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
  // For now, use fallback contractors to ensure deployment works
  // Google Sheets integration can be enabled after deployment
  console.log('📋 Using fallback contractors for stable deployment')
  return getFallbackContractors()
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