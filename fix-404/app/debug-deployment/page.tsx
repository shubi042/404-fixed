export default function DebugPage() {
  const timestamp = new Date().toISOString()
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 DEPLOYMENT DEBUG PAGE</h1>
      <p><strong>Build Time:</strong> {timestamp}</p>
      <p><strong>Commit:</strong> 949daeb</p>
      <p><strong>Branch:</strong> main</p>
      
      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <h3>✅ EXPECTED STATE:</h3>
        <ul>
          <li>❌ NO consultation page should exist</li>
          <li>❌ NO consultation links in navigation</li>
          <li>✅ Booking page should have Stripe integration</li>
          <li>✅ API should have string cleaning function</li>
        </ul>
      </div>

      <div style={{ background: '#ffe6e6', padding: '10px', margin: '10px 0' }}>
        <h3>🚨 IF YOU SEE THIS PAGE:</h3>
        <p>The correct code IS deployed! Check if you're looking at the right site URL.</p>
        <p>Go to <a href="/booking">/booking</a> to test the booking system.</p>
      </div>

      <div style={{ background: '#e6ffe6', padding: '10px', margin: '10px 0' }}>
        <h3>🎯 NAVIGATION CHECK:</h3>
        <p>Check the navigation bar above. It should show:</p>
        <p><strong>Home | Services | Book Now | Contact</strong></p>
        <p>If you see "Free Consultation", you're looking at the wrong deployment.</p>
      </div>
    </div>
  )
}