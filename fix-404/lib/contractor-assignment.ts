// Contractor assignment logic for TidyMate bookings

export interface Contractor {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  maxJobsPerDay: number
  availability: string[]
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

// Sample contractor database - in production, this would come from a database
const contractors: Contractor[] = [
  {
    id: "contractor-001",
    name: "Maria Santos",
    email: "maria@tidymate.ca",
    phone: "(416) 555-0101",
    specialties: ["airbnb", "residential", "deep-clean"],
    maxJobsPerDay: 3,
    availability: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },
  {
    id: "contractor-002", 
    name: "David Chen",
    email: "david@tidymate.ca",
    phone: "(416) 555-0102",
    specialties: ["post-construction", "commercial", "heavy-duty"],
    maxJobsPerDay: 2,
    availability: ["tuesday", "wednesday", "thursday", "friday", "saturday"]
  },
  {
    id: "contractor-003",
    name: "Sarah Johnson", 
    email: "sarah@tidymate.ca",
    phone: "(416) 555-0103",
    specialties: ["airbnb", "residential", "move-out"],
    maxJobsPerDay: 4,
    availability: ["monday", "wednesday", "thursday", "friday", "saturday"]
  },
  {
    id: "contractor-004",
    name: "Ahmed Hassan",
    email: "ahmed@tidymate.ca", 
    phone: "(416) 555-0104",
    specialties: ["post-construction", "commercial", "industrial"],
    maxJobsPerDay: 2,
    availability: ["monday", "tuesday", "thursday", "friday", "saturday"]
  }
]

export function assignContractor(serviceType: string, preferredDate: string, cleanersNeeded: number): BookingAssignment | null {
  try {
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

    // Find available contractors
    const availableContractors = contractors.filter(contractor => {
      // Check if contractor specializes in this service type
      const hasSpecialty = contractor.specialties.some(specialty => 
        specialty.includes(serviceCategory) || serviceCategory.includes(specialty)
      )
      
      // Check if contractor is available on the requested day
      const isAvailable = contractor.availability.includes(dayOfWeek)
      
      return hasSpecialty && isAvailable
    })

    if (availableContractors.length === 0) {
      console.warn("No contractors available for this service type and date")
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

    console.log(`✅ Contractor assigned: ${selectedContractor.name} for ${serviceType}`)
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