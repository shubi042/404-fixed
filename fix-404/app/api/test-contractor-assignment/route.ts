import { NextResponse } from "next/server"
import { assignContractor, getContractorList } from "@/lib/contractor-assignment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
	try {
		console.log("🧪 Testing contractor assignment system...")
		
		// Test 1: Get all contractors
		const contractors = await getContractorList()
		console.log(`📋 Found ${contractors.length} contractors`)
		
		// Test 2: Test assignment for different service types
		const testCases = [
			{ service: "Airbnb/Residential 2 Bedrooms", date: "2024-12-15", cleaners: 1 },
			{ service: "Post-Construction Residential 3 Bedrooms", date: "2024-12-16", cleaners: 2 },
			{ service: "Airbnb/Residential 1 Bedroom", date: "2024-12-17", cleaners: 1 }
		]
		
		const assignments = []
		for (const testCase of testCases) {
			console.log(`\n🔍 Testing assignment for: ${testCase.service}`)
			const assignment = await assignContractor(testCase.service, testCase.date, testCase.cleaners)
			assignments.push({
				testCase,
				assignment: assignment ? {
					contractorName: assignment.contractorName,
					contractorEmail: assignment.contractorEmail,
					estimatedDuration: assignment.estimatedDuration
				} : null
			})
		}
		
		return NextResponse.json({
			success: true,
			contractors: contractors.map(c => ({
				name: c.name,
				email: c.email,
				specialties: c.specialties,
				availability: c.availability,
				status: c.status
			})),
			testAssignments: assignments,
			message: "Contractor assignment system is working!"
		})
		
	} catch (error: any) {
		console.error("❌ Contractor assignment test failed:", error)
		return NextResponse.json({
			success: false,
			error: error.message,
			message: "Contractor assignment system failed"
		}, { status: 500 })
	}
}