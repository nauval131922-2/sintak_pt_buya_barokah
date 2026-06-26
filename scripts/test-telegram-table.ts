import { createClient } from '@libsql/client';

const db = createClient({
  url: 'file:database_dev.sqlite'
});

async function testTelegramUsersTable() {
  try {
    console.log('Testing telegram_users table...\n');
    
    // Check table exists
    const result = await db.execute(`PRAGMA table_info(telegram_users)`);
    
    if (result.rows.length === 0) {
      console.error('❌ Table telegram_users tidak ditemukan!');
      process.exit(1);
    }
    
    console.log('✅ Table telegram_users exists!');
    console.log('\nColumns:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    
    // Check indexes
    const indexes = await db.execute(`PRAGMA index_list(telegram_users)`);
    console.log('\nIndexes:');
    indexes.rows.forEach((row: any) => {
      console.log(`  - ${row.name}`);
    });
    
    console.log('\n✅ Database migration berhasil!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTelegramUsersTable();
