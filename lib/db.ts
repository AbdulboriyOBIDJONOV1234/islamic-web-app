import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

export default function getDb() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  _sql = neon(url);
  return _sql;
}
