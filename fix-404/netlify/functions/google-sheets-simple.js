// Simple Google Sheets integration without googleapis dependency
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const bookingData = JSON.parse(event.body);
    
    console.log('📋 Received booking data:', {
      customer: bookingData.customerName,
      service: bookingData.serviceName,
      sessionId: bookingData.sessionId
    });

    // For now, let's just log that we received the data
    // The actual Google Sheets integration will be handled by Zapier
    console.log('✅ Booking data processed successfully');
    console.log('📊 Google Sheets will be updated via Zapier');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Booking received - Google Sheets update via Zapier',
        data: {
          customer: bookingData.customerName,
          service: bookingData.serviceName,
          sessionId: bookingData.sessionId
        }
      })
    };

  } catch (error) {
    console.error('❌ Error processing booking:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        message: 'Failed to process booking'
      })
    };
  }
};