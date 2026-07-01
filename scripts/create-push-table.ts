import db from '../src/lib/db.js';

async function createTable() {
  try {
    console.log('[CREATE TABLE] Creating push_subscriptions...');
    
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subscription TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )`,
      args: []
    });
    
    console.log('[CREATE TABLE] ✅ Table created successfully');
    
    // Verify
    const check = await db.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='push_subscriptions'`,
      args: []
    });
    
    console.log('[CREATE TABLE] Table exists:', check.rows.length > 0);
    
  } catch (error) {
    console.error('[CREATE TABLE] Error:', error);
  }
}

createTable();
