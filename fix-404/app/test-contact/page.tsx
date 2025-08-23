"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestContactPage() {
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  const testContactAPI = async () => {
    setLoading(true)
    setResult("Testing...")
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Contact Form Test',
          message: 'This is a test message to verify the contact form is working properly.'
        })
      })
      
      const data = await response.json()
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
      
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testDebugAPI = async () => {
    setLoading(true)
    setResult("Running detailed email debug...")
    
    try {
      const response = await fetch('/api/debug-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
      
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Email & API Testing Page</CardTitle>
            <p className="text-muted-foreground">
              Test your email configuration and API endpoints
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testContactAPI} disabled={loading}>
                Test Contact API
              </Button>
              <Button onClick={testDebugAPI} disabled={loading} variant="destructive">
                🔍 Debug Email Config
              </Button>
            </div>
            
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Test Results:</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                    {result}
                  </pre>
                </CardContent>
              </Card>
            )}
            
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">📧 Expected Results:</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ <strong>Success:</strong> {"{"}"ok": true{"}"} + email to services@tidymate.ca</li>
                  <li>❌ <strong>API Key Missing:</strong> {"{"}"error": "RESEND_API_KEY not configured"{"}"}</li>
                  <li>❌ <strong>Email Failed:</strong> {"{"}"error": "Failed to send message"{"}"}</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">🔧 Environment Variables Needed:</h3>
                <ul className="text-sm space-y-1 font-mono">
                  <li>• RESEND_API_KEY=re_...</li>
                  <li>• CONTACT_TO_EMAIL=services@tidymate.ca</li>
                  <li>• FROM_EMAIL=noreply@yourdomain.com</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}