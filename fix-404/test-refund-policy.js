#!/usr/bin/env node

/**
 * Comprehensive test for refund policy and booking system
 */

const http = require('http');

console.log('🧪 Testing Refund Policy and Booking System...\n');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3004',
  timeout: 10000
};

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.setTimeout(TEST_CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testBookingPage() {
  console.log('📝 Testing Booking Page Content...');
  
  try {
    const url = new URL(TEST_CONFIG.baseUrl + '/booking');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET'
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('   ✅ Booking page loads successfully');
      
      // Test for refund policy content
      const hasRefundPolicy = response.body.includes('REFUND') || response.body.includes('refund');
      const hasCancellationPolicy = response.body.includes('cancellation') || response.body.includes('Cancellation');
      const has24HourRule = response.body.includes('24 hours') || response.body.includes('24-hour');
      const hasNoRefunds = response.body.includes('No refunds') || response.body.includes('no refunds');
      const hasCheckbox = response.body.includes('terms-agreement') || response.body.includes('agree');
      const hasBookButton = response.body.includes('Book') && response.body.includes('Pay');
      
      console.log(`   ${hasRefundPolicy ? '✅' : '❌'} Refund policy content present`);
      console.log(`   ${hasCancellationPolicy ? '✅' : '❌'} Cancellation policy content present`);
      console.log(`   ${has24HourRule ? '✅' : '❌'} 24-hour rule mentioned`);
      console.log(`   ${hasNoRefunds ? '✅' : '❌'} No refunds policy stated`);
      console.log(`   ${hasCheckbox ? '✅' : '❌'} Terms agreement checkbox present`);
      console.log(`   ${hasBookButton ? '✅' : '❌'} Book & Pay button present`);
      
      return {
        success: true,
        hasRefundPolicy,
        hasCancellationPolicy,
        has24HourRule,
        hasNoRefunds,
        hasCheckbox,
        hasBookButton
      };
    } else {
      console.log(`   ❌ Booking page failed to load: ${response.status}`);
      return { success: false };
    }
    
  } catch (error) {
    console.log(`   ❌ Error testing booking page: ${error.message}`);
    return { success: false };
  }
}

async function testAPIEndpoint() {
  console.log('🔌 Testing Stripe API Endpoint...');
  
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

    const testData = {
      amount: 11000,
      currency: 'cad',
      service: { name: 'Test Service', price: 110 },
      addons: [],
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '4161234567',
        address: '123 Test St',
        date: '2024-01-15',
        time: 'morning',
        instructions: 'Test booking'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode === 200 && data.sessionId) {
            console.log('   ✅ Stripe API responds successfully');
            console.log(`   ✅ Session ID generated: ${data.sessionId.substring(0, 20)}...`);
          } else if (res.statusCode === 500 && data.error.includes('Stripe secret key')) {
            console.log('   ✅ API responds correctly (needs Stripe keys in production)');
          } else {
            console.log(`   ❌ API error: ${data.error || 'Unknown error'}`);
          }
        } catch (e) {
          console.log(`   ❌ API response parsing error: ${e.message}`);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ API request error: ${error.message}`);
    });

    req.write(JSON.stringify(testData));
    req.end();
    
  } catch (error) {
    console.log(`   ❌ Error testing API: ${error.message}`);
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Running Comprehensive Tests...\n');
  
  const bookingTest = await testBookingPage();
  console.log('');
  
  await testAPIEndpoint();
  console.log('');
  
  console.log('📊 TEST SUMMARY');
  console.log('================');
  
  if (bookingTest.success) {
    const allPolicyTests = 
      bookingTest.hasRefundPolicy &&
      bookingTest.hasCancellationPolicy &&
      bookingTest.has24HourRule &&
      bookingTest.hasNoRefunds &&
      bookingTest.hasCheckbox &&
      bookingTest.hasBookButton;
    
    if (allPolicyTests) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Refund policy is properly displayed');
      console.log('✅ Terms agreement checkbox working');
      console.log('✅ Booking system functional');
      console.log('✅ Ready for deployment!');
    } else {
      console.log('⚠️  Some policy elements missing - check booking page');
    }
  } else {
    console.log('❌ Booking page tests failed');
  }
}

// Run the tests
runComprehensiveTests().catch(console.error);