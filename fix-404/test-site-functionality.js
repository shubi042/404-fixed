#!/usr/bin/env node

/**
 * TidyMate Site Functionality Test
 * Tests all major functionality end-to-end
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'

console.log('🧹 TidyMate Site Functionality Test')
console.log('=====================================')
console.log(`Testing site at: ${BASE_URL}`)
console.log('')

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} ${name}`)
  if (details) console.log(`   ${details}`)
  
  results.tests.push({ name, passed, details })
  if (passed) results.passed++
  else results.failed++
}

async function testEndpoint(name, url, expectedStatus = 200, expectedContent = null) {
  try {
    const response = await fetch(url)
    const statusOk = response.status === expectedStatus
    
    let contentOk = true
    let content = ''
    
    if (expectedContent) {
      content = await response.text()
      contentOk = content.includes(expectedContent)
    }
    
    const passed = statusOk && contentOk
    const details = `Status: ${response.status}${expectedContent ? `, Contains: "${expectedContent}": ${contentOk}` : ''}`
    
    logTest(name, passed, details)
    return { passed, response, content }
  } catch (error) {
    logTest(name, false, `Error: ${error.message}`)
    return { passed: false, error }
  }
}

async function testAPI(name, url, method = 'GET', body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    
    if (body) options.body = JSON.stringify(body)
    
    const response = await fetch(url, options)
    const passed = response.status === expectedStatus
    const responseText = await response.text()
    
    let details = `Status: ${response.status}`
    if (responseText) {
      try {
        const json = JSON.parse(responseText)
        details += `, Response: ${JSON.stringify(json)}`
      } catch {
        details += `, Response: ${responseText.substring(0, 100)}...`
      }
    }
    
    logTest(name, passed, details)
    return { passed, response, body: responseText }
  } catch (error) {
    logTest(name, false, `Error: ${error.message}`)
    return { passed: false, error }
  }
}

async function runTests() {
  console.log('📄 Testing Page Loads')
  console.log('---------------------')
  
  // Test main pages
  await testEndpoint('Home page loads', `${BASE_URL}/`, 200, 'TidyMate')
  await testEndpoint('Services page loads', `${BASE_URL}/services`, 200, 'Our Cleaning Services')
  await testEndpoint('Booking page loads', `${BASE_URL}/booking`, 200, 'Book Your Professional Cleaning')
  await testEndpoint('Contact page loads', `${BASE_URL}/contact`, 200, 'Contact TidyMate')
  await testEndpoint('404 page works', `${BASE_URL}/nonexistent-page`, 404, 'Page Not Found')
  
  console.log('')
  console.log('🔧 Testing API Endpoints')
  console.log('------------------------')
  
  // Test API endpoints
  await testAPI('Verify setup endpoint', `${BASE_URL}/api/verify-setup`)
  await testAPI('Test email endpoint', `${BASE_URL}/api/test-email`)
  
  // Test contact form (should fail without proper data, but endpoint should exist)
  await testAPI('Contact API (no data)', `${BASE_URL}/api/contact`, 'POST', {}, 400)
  await testAPI('Contact API (with data)', `${BASE_URL}/api/contact`, 'POST', {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test',
    message: 'This is a test message'
  }, 200)
  
  // Test Stripe payment creation (should fail without Stripe keys, but endpoint should exist)
  await testAPI('Payment intent creation (no data)', `${BASE_URL}/api/create-payment-intent`, 'POST', {}, 500)
  
  console.log('')
  console.log('🎨 Testing Static Assets')
  console.log('------------------------')
  
  // Test static files
  await testEndpoint('Robots.txt', `${BASE_URL}/robots.txt`, 200, 'User-agent')
  await testEndpoint('Sitemap.xml', `${BASE_URL}/sitemap.xml`, 200, 'urlset')
  
  console.log('')
  console.log('📱 Testing Responsive Design')
  console.log('----------------------------')
  
  // Test that pages load with mobile user agent
  const mobileHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  }
  
  try {
    const response = await fetch(`${BASE_URL}/`, { headers: mobileHeaders })
    const content = await response.text()
    const hasMobileClasses = content.includes('sm:') || content.includes('md:') || content.includes('lg:')
    logTest('Mobile responsive classes present', hasMobileClasses, 'Tailwind responsive classes found')
  } catch (error) {
    logTest('Mobile responsive test', false, `Error: ${error.message}`)
  }
  
  console.log('')
  console.log('🔍 Testing SEO Elements')
  console.log('-----------------------')
  
  try {
    const response = await fetch(`${BASE_URL}/`)
    const content = await response.text()
    
    const hasTitle = content.includes('<title>') && content.includes('TidyMate')
    const hasDescription = content.includes('name="description"')
    const hasOG = content.includes('property="og:')
    const hasStructuredData = content.includes('application/ld+json')
    
    logTest('Page title present', hasTitle, 'Title tag with TidyMate found')
    logTest('Meta description present', hasDescription, 'Meta description found')
    logTest('Open Graph tags present', hasOG, 'OG tags found')
    logTest('Structured data present', hasStructuredData, 'JSON-LD structured data found')
  } catch (error) {
    logTest('SEO elements test', false, `Error: ${error.message}`)
  }
  
  console.log('')
  console.log('📊 Test Results Summary')
  console.log('=======================')
  console.log(`Total tests: ${results.tests.length}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`Success rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`)
  
  if (results.failed > 0) {
    console.log('')
    console.log('❌ Failed Tests:')
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`   - ${test.name}: ${test.details}`)
    })
  }
  
  console.log('')
  if (results.failed === 0) {
    console.log('🎉 All tests passed! The site is working properly.')
  } else if (results.failed < 3) {
    console.log('⚠️  Most tests passed, but there are a few issues to address.')
  } else {
    console.log('🚨 Multiple tests failed. The site needs attention.')
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})