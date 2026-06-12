import { createClient } from '@libsql/client';
import type { InStatement } from '@libsql/core/api';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const isVercel = !!process.env.VERCEL;
const useRemote = (isVercel || process.env.USE_REMOTE_DB === 'true') && !!process.env.TURSO_DATABASE_URL;

let dbUrl = '';
if (useRemote) {
  dbUrl = process.env.TURSO_DATABASE_URL!;
} else {
  const defaultDbName = isDev ? 'database_dev.sqlite' : 'database.sqlite';
  dbUrl = `file:${path.join(process.cwd(), process.env.DB_PATH || defaultDbName)}`;
}

const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const dbExport = {
  async execute(stmt: InStatement) {
    return client.execute(stmt);
  },
};

export default dbExport;
