#!/usr/bin/env node

/**
 * Debug script to test minimal Stripe API calls and isolate the exact field causing the error
 */

const Stripe = require('stripe');

// You'll need to set your test Stripe key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable not set');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

console.log('🔍 Debugging Stripe API calls to isolate the pattern error...\n');

// Test cases with progressively more complex data
const testCases = [
  {
    name: "Minimal Valid Session",
    data: {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Test Service',
          },
          unit_amount: 11000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://tidymate.ca/success',
      cancel_url: 'https://tidymate.ca/cancel',
    }
  },
  {
    name: "With Basic Metadata",
    data: {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Test Service',
          },
          unit_amount: 11000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://tidymate.ca/success',
      cancel_url: 'https://tidymate.ca/cancel',
      metadata: {
        test: 'basic'
      }
    }
  },
  {
    name: "With Customer Email",
    data: {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Test Service',
          },
          unit_amount: 11000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://tidymate.ca/success',
      cancel_url: 'https://tidymate.ca/cancel',
      customer_email: 'test@example.com',
      metadata: {
        customerName: 'John Doe'
      }
    }
  },
  {
    name: "With Phone in Metadata",
    data: {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Test Service',
          },
          unit_amount: 11000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://tidymate.ca/success',
      cancel_url: 'https://tidymate.ca/cancel',
      customer_email: 'test@example.com',
      metadata: {
        customerName: 'John Doe',
        phone: '4161234567'
      }
    }
  },
  {
    name: "With Address in Metadata",
    data: {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Test Service',
          },
          unit_amount: 11000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://tidymate.ca/success',
      cancel_url: 'https://tidymate.ca/cancel',
      customer_email: 'test@example.com',
      metadata: {
        customerName: 'John Doe',
        phone: '4161234567',
        address: '123 Main St Toronto ON M1A 1A1'
      }
    }
  },
  {
    name: "With Special Characters",
    data: {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Test Service',
          },
          unit_amount: 11000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://tidymate.ca/success',
      cancel_url: 'https://tidymate.ca/cancel',
      customer_email: 'test@example.com',
      metadata: {
        customerName: 'John O\'Connor',
        phone: '(416) 123-4567',
        address: '123 Main St, Toronto, ON M1A 1A1'
      }
    }
  },
  {
    name: "With URL Template",
    data: {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Test Service',
          },
          unit_amount: 11000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://tidymate.ca/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://tidymate.ca/cancel',
      customer_email: 'test@example.com',
      metadata: {
        customerName: 'John Doe',
        phone: '4161234567'
      }
    }
  }
];

async function testStripeCall(testCase) {
  console.log(`🧪 Testing: ${testCase.name}`);
  
  try {
    const session = await stripe.checkout.sessions.create(testCase.data);
    console.log(`   ✅ SUCCESS - Session ID: ${session.id}`);
    return true;
  } catch (error) {
    console.log(`   ❌ FAILED - ${error.message}`);
    console.log(`   📝 Error Type: ${error.type}`);
    console.log(`   📝 Error Code: ${error.code}`);
    if (error.param) {
      console.log(`   📝 Error Param: ${error.param}`);
    }
    
    // If this is the pattern error, log more details
    if (error.message && error.message.includes('pattern')) {
      console.log(`   🔍 PATTERN ERROR FOUND!`);
      console.log(`   📋 Data that caused error:`, JSON.stringify(testCase.data, null, 2));
    }
    
    return false;
  }
}

async function runDebugTests() {
  console.log('🔍 Running progressive Stripe API tests...\n');
  
  let successCount = 0;
  let failureIndex = -1;
  
  for (let i = 0; i < testCases.length; i++) {
    const success = await testStripeCall(testCases[i]);
    
    if (success) {
      successCount++;
    } else {
      failureIndex = i;
      break; // Stop at first failure to isolate the issue
    }
    
    console.log(''); // Empty line between tests
  }
  
  console.log('📊 DEBUG RESULTS');
  console.log('=================');
  console.log(`✅ Successful tests: ${successCount}`);
  console.log(`❌ First failure at: ${failureIndex >= 0 ? testCases[failureIndex].name : 'None'}`);
  
  if (failureIndex >= 0) {
    console.log('\n🎯 ISSUE ISOLATED:');
    console.log(`The error occurs when adding: ${testCases[failureIndex].name}`);
    console.log('This indicates the specific field or format causing the pattern validation error.');
    
    if (failureIndex > 0) {
      console.log('\n💡 WORKING DATA (Previous test):');
      console.log(JSON.stringify(testCases[failureIndex - 1].data, null, 2));
    }
    
    console.log('\n❌ FAILING DATA:');
    console.log(JSON.stringify(testCases[failureIndex].data, null, 2));
  } else {
    console.log('\n🎉 All basic tests passed! The issue might be in more complex data combinations.');
  }
}

// Run the debug tests
runDebugTests().catch(console.error);