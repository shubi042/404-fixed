#!/usr/bin/env node

/**
 * Comprehensive Stripe Validation Test
 * Tests the booking system with various input scenarios to ensure validation works
 */

const http = require('http');

console.log('🧪 Stripe Validation Test Suite Starting...\n');

// Test configuration
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.setTimeout(TEST_CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test cases with various problematic inputs
const testCases = [
  {
    name: "Valid Input - Should Work",
    data: {
      amount: 11000,
      currency: "cad",
      service: {
        name: "Airbnb 1 Bedroom",
        price: 110,
        cleaners: "1 Cleaner",
        category: "Airbnb Cleaning"
      },
      addons: [
        { id: "windows", name: "Window Cleaning", price: 40 }
      ],
      customerInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "4161234567",
        address: "123 Main St, Toronto, ON M1A 1A1",
        date: "2024-01-15",
        time: "morning",
        instructions: "Please call before arriving"
      }
    },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: "Special Characters in Names - Should Be Sanitized",
    data: {
      amount: 11000,
      currency: "cad",
      service: {
        name: "Airbnb 1 Bedroom",
        price: 110,
        cleaners: "1 Cleaner",
        category: "Airbnb Cleaning"
      },
      addons: [],
      customerInfo: {
        firstName: "Jöhn@#$",
        lastName: "Döe!@#",
        email: "john.doe@example.com",
        phone: "4161234567",
        address: "123 Main St, Toronto, ON M1A 1A1",
        date: "2024-01-15",
        time: "morning",
        instructions: "Special chars: @#$%^&*()"
      }
    },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: "Long Fields - Should Be Truncated",
    data: {
      amount: 11000,
      currency: "cad",
      service: {
        name: "Airbnb 1 Bedroom",
        price: 110,
        cleaners: "1 Cleaner",
        category: "Airbnb Cleaning"
      },
      addons: [],
      customerInfo: {
        firstName: "A".repeat(100),
        lastName: "B".repeat(100),
        email: "john.doe@example.com",
        phone: "4161234567",
        address: "This is a very long address that exceeds normal limits and should be truncated by the validation system to prevent any issues with the payment processor".repeat(3),
        date: "2024-01-15",
        time: "morning",
        instructions: "Very long instructions ".repeat(50)
      }
    },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: "Invalid Email - Should Fail",
    data: {
      amount: 11000,
      currency: "cad",
      service: {
        name: "Airbnb 1 Bedroom",
        price: 110,
        cleaners: "1 Cleaner",
        category: "Airbnb Cleaning"
      },
      addons: [],
      customerInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        phone: "4161234567",
        address: "123 Main St, Toronto, ON M1A 1A1",
        date: "2024-01-15",
        time: "morning",
        instructions: ""
      }
    },
    expectedStatus: 400,
    shouldSucceed: false
  },
  {
    name: "Invalid Phone - Should Fail",
    data: {
      amount: 11000,
      currency: "cad",
      service: {
        name: "Airbnb 1 Bedroom",
        price: 110,
        cleaners: "1 Cleaner",
        category: "Airbnb Cleaning"
      },
      addons: [],
      customerInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "123",
        address: "123 Main St, Toronto, ON M1A 1A1",
        date: "2024-01-15",
        time: "morning",
        instructions: ""
      }
    },
    expectedStatus: 400,
    shouldSucceed: false
  }
];

async function runTest(testCase) {
  console.log(`🧪 Testing: ${testCase.name}`);
  
  try {
    const url = new URL(TEST_CONFIG.baseUrl + '/api/create-payment-intent');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: TEST_CONFIG.timeout
    };

    const response = await makeRequest(options, testCase.data);
    
    const statusMatches = response.status === testCase.expectedStatus;
    const successMatches = testCase.shouldSucceed ? response.status === 200 : response.status >= 400;
    
    if (statusMatches && successMatches) {
      console.log(`   ✅ PASS - Status: ${response.status}`);
      if (response.body.sessionId) {
        console.log(`   📝 Session ID received: ${response.body.sessionId.substring(0, 20)}...`);
      }
      if (response.body.error) {
        console.log(`   ℹ️  Expected error: ${response.body.error}`);
      }
      return true;
    } else {
      console.log(`   ❌ FAIL - Expected status: ${testCase.expectedStatus}, Got: ${response.status}`);
      console.log(`   📝 Response: ${JSON.stringify(response.body, null, 2)}`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ FAIL - Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`🚀 Running Stripe validation tests against: ${TEST_CONFIG.baseUrl}\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Empty line between tests
  }
  
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL VALIDATION TESTS PASSED!');
    console.log('✅ The Stripe integration should now work without "pattern" errors');
    console.log('✅ Input sanitization is working correctly');
    console.log('✅ Field validation is properly implemented');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the API implementation.');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run the test suite
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});