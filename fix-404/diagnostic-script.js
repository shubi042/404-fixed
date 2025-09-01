#!/usr/bin/env node

/**
 * TidyMate Backend Integration Diagnostic Script
 * Tests Calendly and Stripe integrations for proper configuration
 */

const https = require('https');
const fs = require('fs');

// Configuration
const CALENDLY_USERNAME = 'services-tidymate';
const CALENDLY_CONSULTATION_URL = `https://calendly.com/${CALENDLY_USERNAME}/30min`;
const CALENDLY_BOOKING_URL = `https://calendly.com/${CALENDLY_USERNAME}/booking-confirmation`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode === 200 || res.statusCode === 302
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        accessible: false,
        error: err.message
      });
    });
  });
}

async function main() {
  log('\n🔍 TIDYMATE BACKEND INTEGRATION DIAGNOSTICS', colors.bold + colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  // 1. Environment Variables Check
  log('\n📋 1. ENVIRONMENT VARIABLES CHECK', colors.bold + colors.blue);
  log('-'.repeat(40), colors.blue);
  
  const envVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'CONTACT_TO_EMAIL',
    'OWNER_NOTIFICATION_EMAIL',
    'FROM_EMAIL'
  ];
  
  const envStatus = {};
  envVars.forEach(varName => {
    const value = process.env[varName];
    envStatus[varName] = {
      set: !!value,
      preview: value ? `${value.substring(0, 8)}...` : 'NOT SET'
    };
    
    if (value) {
      log(`✅ ${varName}: ${envStatus[varName].preview}`, colors.green);
    } else {
      log(`❌ ${varName}: NOT SET`, colors.red);
    }
  });

  // 2. Calendly Accessibility Check
  log('\n📅 2. CALENDLY INTEGRATION CHECK', colors.bold + colors.blue);
  log('-'.repeat(40), colors.blue);
  
  log('Testing Calendly URLs...');
  const calendlyUrls = [
    CALENDLY_CONSULTATION_URL,
    CALENDLY_BOOKING_URL
  ];
  
  const calendlyResults = await Promise.all(calendlyUrls.map(checkUrl));
  
  calendlyResults.forEach(result => {
    if (result.accessible) {
      log(`✅ ${result.url} - Accessible (${result.status})`, colors.green);
    } else {
      log(`❌ ${result.url} - Not accessible (${result.status})`, colors.red);
      if (result.error) log(`   Error: ${result.error}`, colors.red);
    }
  });

  // 3. Code Integration Analysis
  log('\n🔧 3. CODE INTEGRATION ANALYSIS', colors.bold + colors.blue);
  log('-'.repeat(40), colors.blue);
  
  // Check for required files
  const requiredFiles = [
    'app/api/create-payment-intent/route.ts',
    'app/api/stripe/webhook/route.ts',
    'app/api/send-calendly-link/route.ts',
    'lib/email.ts',
    'netlify/functions/send-email.js'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file} - EXISTS`, colors.green);
    } else {
      log(`❌ ${file} - MISSING`, colors.red);
    }
  });

  // 4. Package Dependencies Check
  log('\n📦 4. PACKAGE DEPENDENCIES CHECK', colors.bold + colors.blue);
  log('-'.repeat(40), colors.blue);
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredPackages = [
      'stripe',
      '@stripe/stripe-js',
      'resend',
      'nodemailer'
    ];
    
    requiredPackages.forEach(pkg => {
      if (packageJson.dependencies[pkg]) {
        log(`✅ ${pkg}: ${packageJson.dependencies[pkg]}`, colors.green);
      } else {
        log(`❌ ${pkg}: NOT INSTALLED`, colors.red);
      }
    });
  } catch (err) {
    log(`❌ Could not read package.json: ${err.message}`, colors.red);
  }

  // 5. Generate Report
  log('\n📊 5. DIAGNOSTIC SUMMARY', colors.bold + colors.magenta);
  log('='.repeat(60), colors.magenta);
  
  const issues = [];
  const recommendations = [];
  
  // Check environment variables
  const criticalEnvVars = ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'RESEND_API_KEY'];
  criticalEnvVars.forEach(varName => {
    if (!envStatus[varName].set) {
      issues.push(`Missing ${varName} environment variable`);
      recommendations.push(`Set ${varName} in Netlify environment variables`);
    }
  });
  
  // Check Calendly accessibility
  const inaccessibleCalendly = calendlyResults.filter(r => !r.accessible);
  if (inaccessibleCalendly.length > 0) {
    issues.push('Some Calendly URLs are not accessible');
    recommendations.push('Verify Calendly account setup and event type configuration');
  }
  
  // Missing webhook secret
  if (!envStatus['STRIPE_WEBHOOK_SECRET'].set) {
    issues.push('Stripe webhook secret not configured');
    recommendations.push('Add STRIPE_WEBHOOK_SECRET for secure webhook processing');
  }

  if (issues.length === 0) {
    log('🎉 ALL INTEGRATIONS APPEAR TO BE PROPERLY CONFIGURED!', colors.bold + colors.green);
  } else {
    log(`⚠️  FOUND ${issues.length} ISSUES:`, colors.bold + colors.yellow);
    issues.forEach((issue, i) => {
      log(`   ${i + 1}. ${issue}`, colors.yellow);
    });
    
    log('\n💡 RECOMMENDATIONS:', colors.bold + colors.cyan);
    recommendations.forEach((rec, i) => {
      log(`   ${i + 1}. ${rec}`, colors.cyan);
    });
  }
  
  log('\n🔗 INTEGRATION STATUS:', colors.bold);
  log(`📅 Calendly: ${calendlyResults.every(r => r.accessible) ? '✅ WORKING' : '❌ ISSUES FOUND'}`, 
      calendlyResults.every(r => r.accessible) ? colors.green : colors.red);
  log(`💳 Stripe: ${envStatus['STRIPE_SECRET_KEY'].set && envStatus['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'].set ? '✅ CONFIGURED' : '❌ INCOMPLETE'}`,
      envStatus['STRIPE_SECRET_KEY'].set && envStatus['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'].set ? colors.green : colors.red);
  log(`📧 Email: ${envStatus['RESEND_API_KEY'].set ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`,
      envStatus['RESEND_API_KEY'].set ? colors.green : colors.red);
  
  log('\n📋 NEXT STEPS:', colors.bold + colors.blue);
  log('1. Set missing environment variables in Netlify dashboard');
  log('2. Test the booking flow end-to-end');
  log('3. Verify webhook endpoints are accessible from external services');
  log('4. Consider setting up Calendly webhooks for automatic synchronization');
  
  log('\n🌐 USEFUL LINKS:', colors.bold);
  log(`- Calendly Profile: https://calendly.com/${CALENDLY_USERNAME}`);
  log('- Stripe Dashboard: https://dashboard.stripe.com/');
  log('- Resend Dashboard: https://resend.com/');
  log('- Netlify Environment Variables: [Your Netlify Site] > Site Settings > Environment Variables');
}

main().catch(console.error);