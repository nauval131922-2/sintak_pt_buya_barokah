import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

function getDbUrl() {
  const isDev = process.env.NODE_ENV === 'development';
  const defaultDb = isDev ? 'database_dev.sqlite' : 'database.sqlite';
  const dbPath = path.join(process.cwd(), '..', process.env.DB_PATH || defaultDb);
  return `file:${dbPath}`;
}

const client = createClient({ url: getDbUrl() });

export default client;
