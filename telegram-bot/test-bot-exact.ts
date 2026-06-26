import * as dotenv from 'dotenv';
dotenv.config();

const SINTAK_API_URL = process.env.SINTAK_API_URL || 'http://localhost:3000';
const SINTAK_API_KEY = process.env.SINTAK_API_KEY || '';

console.log('🔍 Bot Environment Check:\n');
console.log('SINTAK_API_URL:', SINTAK_API_URL);
console.log('SINTAK_API_KEY:', SINTAK_API_KEY);
console.log('');

async function testBotAPICall() {
  console.log('🧪 Testing bot API call with exact same code...\n');
  
  const endpoint = '/api/telegram/check-status?telegram_id=123';
  const url = `${SINTAK_API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'X-API-Key': SINTAK_API_KEY,
    'Content-Type': 'application/json'
  };
  
  console.log('URL:', url);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', response.headers.get('content-type'));
    console.log('');
    
    const data = await response.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Success! API call works.');
    } else {
      console.log('\n❌ Failed! Status:', response.status);
      console.log('Error:', data.error);
      if (data.debug) {
        console.log('Debug info:', data.debug);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Fetch error:', error.message);
  }
}

testBotAPICall();
