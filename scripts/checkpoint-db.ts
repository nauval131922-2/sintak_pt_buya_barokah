import { createClient } from '@libsql/client';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');

const client = createClient({
  url: `file:${dbPath}`,
});

async function main() {
  const result = await client.execute("PRAGMA integrity_check");
  console.log('Integrity:', result.rows[0]['integrity_check']);

  await client.execute("PRAGMA wal_checkpoint(TRUNCATE)");
  console.log('WAL checkpointed');

  client.close();
  console.log('Done');
}

main().catch(console.error);
