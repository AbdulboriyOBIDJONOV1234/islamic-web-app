// Ishlatish:  DATABASE_URL="postgres://..." npm run db:reset
// Eski barcha ma'lumotni o'chirib, bazani 0 dan yaratadi.
import { readFileSync } from 'node:fs';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL berilmagan'); process.exit(1); }
if (process.argv[2] !== '--yes') {
  console.error('Bu BUTUN bazani o\'chiradi. Tasdiqlash uchun:  npm run db:reset -- --yes');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(readFileSync(new URL('../db/reset.sql', import.meta.url), 'utf8'));
await client.end();
console.log('✅ Baza 0 dan qayta yaratildi (users, daily_entries bo\'sh).');
