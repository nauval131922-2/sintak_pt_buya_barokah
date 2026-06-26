const SINTAK_API_URL = 'http://localhost:3000';
const SINTAK_API_KEY = 'bismillah-m377-4j76-bb34-c450-7a62-ad3f';

async function testAPI() {
  console.log('🧪 Testing API with proper headers...\n');
  
  const url = `${SINTAK_API_URL}/api/telegram/check-status?telegram_id=123`;
  
  console.log('URL:', url);
  console.log('Header X-API-Key:', SINTAK_API_KEY, '\n');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': SINTAK_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('\nResponse:');
    
    if (text.startsWith('<!DOCTYPE')) {
      console.log('❌ HTML Response (first 150 chars):');
      console.log(text.substring(0, 150));
    } else {
      console.log('✅ JSON Response:');
      console.log(text);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
