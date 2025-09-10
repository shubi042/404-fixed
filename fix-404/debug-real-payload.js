#!/usr/bin/env node

/**
 * Debug script to test the exact payload that your booking system sends to Stripe
 */

const http = require('http');

console.log('🔍 Testing Real Booking Payload...\n');

const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3001',
  timeout: 15000
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: jsonBody, rawBody: body });
        } catch (e) {
          resolve({ status: res.statusCode, body: {}, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test with the exact data structure your app sends
const realBookingData = {
  amount: 11000,
  currency: "cad",
  service: {
    name: "Airbnb 1 Bedroom",
    price: 110,
    cleaners: "1 Cleaner",
    category: "Airbnb Cleaning"
  },
  addons: [
    {
      id: "windows",
      name: "Window Cleaning", 
      price: 40
    }
  ],
  customerInfo: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "4161234567",
    address: "123 Main Street, Toronto, ON M5V 3A1, Canada",
    date: "2024-01-15",
    time: "morning",
    instructions: "Please call before arriving. Access code is 1234."
  }
};

// Test with problematic characters that might cause issues
const problematicData = {
  amount: 11000,
  currency: "cad", 
  service: {
    name: "Post-Construction • Residential",
    price: 350,
    cleaners: "2 Cleaners",
    category: "Post-Construction"
  },
  addons: [],
  customerInfo: {
    firstName: "José",
    lastName: "O'Connor-Smith",
    email: "jose.oconnor@email-domain.co.uk",
    phone: "(416) 123-4567 ext. 123",
    address: "123 Main St., Apt #456, Toronto, ON M5V 3A1 🏠",
    date: "2024-01-15",
    time: "morning",
    instructions: "Special instructions: Call 📞 before arriving! Access code: #1234. Parking available @ rear."
  }
};

async function testPayload(name, data) {
  console.log(`🧪 Testing: ${name}`);
  
  try {
    const url = new URL(TEST_CONFIG.baseUrl + '/api/create-payment-intent');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, data);
    
    if (response.status === 200) {
      console.log(`   ✅ SUCCESS - Session created: ${response.body.sessionId?.substring(0, 20)}...`);
      return true;
    } else {
      console.log(`   ❌ FAILED - Status: ${response.status}`);
      console.log(`   📝 Error: ${response.body.error}`);
      
      // Log the exact data that failed
      if (response.body.error && response.body.error.includes('pattern')) {
        console.log(`   🔍 PATTERN ERROR - This is the exact data causing the issue:`);
        console.log(`   📋 Payload:`, JSON.stringify(data, null, 2));
      }
      
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ REQUEST FAILED - ${error.message}`);
    return false;
  }
}

async function runRealPayloadTests() {
  console.log(`🚀 Testing real booking payloads against: ${TEST_CONFIG.baseUrl}\n`);
  
  // Test 1: Normal booking data
  const test1 = await testPayload("Normal Booking Data", realBookingData);
  console.log('');
  
  // Test 2: Problematic characters
  const test2 = await testPayload("Problematic Characters", problematicData);
  console.log('');
  
  // Test 3: Edge cases
  const edgeCaseData = {
    ...realBookingData,
    customerInfo: {
      ...realBookingData.customerInfo,
      firstName: "A".repeat(100), // Very long name
      lastName: "B".repeat(100),
      address: "This is an extremely long address that might exceed Stripe's limits and cause validation errors because it contains way too much information and goes on and on".repeat(5),
      instructions: "Very long instructions ".repeat(100),
      phone: "1234567890123456789", // Very long phone
    }
  };
  
  const test3 = await testPayload("Edge Case Data (Long Fields)", edgeCaseData);
  console.log('');
  
  console.log('📊 REAL PAYLOAD TEST SUMMARY');
  console.log('=============================');
  
  if (test1 && test2 && test3) {
    console.log('🎉 All payloads worked! The issue might be environment-specific.');
  } else {
    console.log('🔍 Found the problematic payload pattern!');
    console.log('The failing test above shows exactly what data causes the Stripe error.');
  }
}

// Run the tests
runRealPayloadTests().catch(console.error);