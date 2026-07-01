import db from '../src/lib/db.js';

async function checkSubscriptions() {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM push_subscriptions',
      args: []
    });
    
    console.log('[CHECK] Total subscriptions:', result.rows.length);
    console.log('[CHECK] Data:', JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('[CHECK] Error:', error);
  }
}

checkSubscriptions();
